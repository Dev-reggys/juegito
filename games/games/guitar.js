/* --- MOTOR GUITAR HERO SINCRONIZADO POR AUDIO --- */
window.ghNotes = [];
window.ghLaneColors = ["#ff4141", "#ffea00", "#00ff41", "#00fbff"]; 
window.combo = 0;
window.multiplier = 1;
let ghInvulnerable = false; 

function initGuitarHero() {
    const canvas = document.getElementById("mainCanvas");
    const ctx = canvas.getContext("2d");
    const controls = document.getElementById('guitar-controls');
    
    if (controls) controls.classList.remove('hidden');

    window.ghNotes = [];
    window.combo = 0;
    window.multiplier = 1;
    ghInvulnerable = false;

    // --- 1. CONFIGURACIÓN DE SINCRONIZACIÓN MÚSICA/GRÁFICOS ---
    const audio = window.audioTracks['guitartheme'];
    const hitAreaY = 380; // Donde están los aros guía
    const startY = -50;   // Dónde nacen las notas arriba
    const fallTime = 1.5; // Segundos exactos que tarda la nota en caer de arriba a la zona de hit
    const speedY = (hitAreaY - startY) / fallTime; // Velocidad calculada matemáticamente
    
    // RITMO: Ajusta esto según los BPM de tu canción. 
    // 2 significa que caen 2 notas por cada segundo de música.
    const notasPorSegundo = 2; 
    const tiempoEntreNotas = 1 / notasPorSegundo;
    
    // Para saber cuándo spawnear la siguiente nota
    let proximaNotaTime = audio ? audio.currentTime + fallTime : fallTime;

    // --- 2. FUNCIÓN PARA TOCAR NOTA (HIT) ---
    window.guitarHit = function(lane) {
        if (!window.gameActive) return;
        
        let margin = 45; // Margen de error en píxeles
        let found = false;
        
        for (let i = 0; i < window.ghNotes.length; i++) {
            let n = window.ghNotes[i];
            if (n.lane === lane && Math.abs(n.y - hitAreaY) < margin) {
                // ¡ACIERTO!
                window.ghNotes.splice(i, 1);
                window.combo++;
                window.multiplier = window.combo > 20 ? 4 : (window.combo > 10 ? 2 : 1);
                window.scoreElement.innerText = parseInt(window.scoreElement.innerText) + (10 * window.multiplier);
                found = true;
                break;
            }
        }

        if (!found) { window.combo = 0; window.multiplier = 1; }
    };

    function loop() {
        if (!window.gameActive || window.currentRunningGame !== 'guitar') {
            if (controls) controls.classList.add('hidden');
            return;
        }

        // --- 3. EL CORAZÓN DE LA SINCRONIZACIÓN ---
        // Sacamos el tiempo EXACTO de la pista de audio
        let currentTime = audio ? audio.currentTime : 0;

        // Generar notas por adelantado asegurando que caigan justo en el ritmo
        if (audio && !audio.paused) {
            while (currentTime + fallTime >= proximaNotaTime) {
                window.ghNotes.push({
                    lane: Math.floor(Math.random() * 4),
                    targetTime: proximaNotaTime // Guardamos EN QUÉ SEGUNDO exacto debe ser tocada
                });
                proximaNotaTime += tiempoEntreNotas; // Preparamos la siguiente
            }
        }

        // Renderizado Base
        ctx.fillStyle = "#080808"; 
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Dibujar carriles
        ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
        for(let i=0; i<=4; i++) {
            ctx.beginPath(); 
            ctx.moveTo(i * 100, 0); 
            ctx.lineTo(i * 100, canvas.height); 
            ctx.stroke();
        }

        // ZONA DE GOLPE (Círculos base)
        for(let i=0; i<4; i++) {
            ctx.strokeStyle = window.ghLaneColors[i];
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(50 + (i * 100), hitAreaY, 22, 0, Math.PI * 2);
            ctx.stroke();
        }

        // --- 4. MOVER NOTAS EN BASE AL TIEMPO, NO A LOS FPS ---
        for (let i = window.ghNotes.length - 1; i >= 0; i--) {
            let n = window.ghNotes[i];
            
            // Calculamos cuánto tiempo falta para que suene su "beat"
            let timeRemaining = n.targetTime - currentTime;
            
            // Asignamos su Y geométrico exacto
            n.y = hitAreaY - (timeRemaining * speedY);

            // Solo dibujamos si está dentro de la pantalla
            if (n.y > -60) {
                ctx.fillStyle = window.ghLaneColors[n.lane];
                ctx.shadowBlur = 15;
                ctx.shadowColor = window.ghLaneColors[n.lane];
                ctx.beginPath();
                ctx.arc(50 + (n.lane * 100), n.y, 18, 0, Math.PI * 2);
                ctx.fill();
                ctx.shadowBlur = 0; 
            }

            // --- DETECTAR NOTA PERDIDA (CASTIGO) ---
            if (n.y > 430) { 
                window.ghNotes.splice(i, 1);
                window.combo = 0;
                window.multiplier = 1;

                if (!ghInvulnerable) {
                    window.Vidas(); 
                    ghInvulnerable = true;
                    setTimeout(() => { ghInvulnerable = false; }, 1000); 
                }
            }
        }

        // HUD: Combo y Multiplicador
        ctx.fillStyle = "white";
        ctx.font = "bold 20px Arial";
        ctx.fillText(`COMBO: ${window.combo}`, 20, 40);
        
        if (window.multiplier > 1) {
            ctx.fillStyle = "#00fbff";
            ctx.fillText(`x${window.multiplier}`, 330, 40);
        }

        window.animationId = requestAnimationFrame(loop);
    }
    
    loop();
}