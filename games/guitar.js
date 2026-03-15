/* --- MOTOR GUITAR HERO (RETOS: COLISIONES, FALLOS Y VIDAS) --- */
window.ghNotes = [];
window.ghLaneColors = ["#ff4141", "#ffea00", "#00ff41", "#00fbff"]; 
window.combo = 0;
window.multiplier = 1;
let ghInvulnerable = false; // Escudo temporal para no perder todas las vidas de golpe

function initGuitarHero() {
    const canvas = document.getElementById("mainCanvas");
    const ctx = canvas.getContext("2d");
    const controls = document.getElementById('guitar-controls');
    
    if (controls) controls.classList.remove('hidden');

    window.ghNotes = [];
    window.combo = 0;
    window.multiplier = 1;
    let lastNoteTime = 0;
    ghInvulnerable = false;

    // --- FUNCIÓN PARA TOCAR NOTA (HIT) ---
    window.guitarHit = function(lane) {
        if (!window.gameActive) return;
        
        let hitAreaY = 380; // La zona de los botones
        let margin = 40;    // Margen de error para el toque
        
        let found = false;
        for (let i = 0; i < window.ghNotes.length; i++) {
            let n = window.ghNotes[i];
            if (n.lane === lane && Math.abs(n.y - hitAreaY) < margin) {
                // ¡ACIERTO!
                window.ghNotes.splice(i, 1);
                window.combo++;
                window.scoreElement.innerText = parseInt(window.scoreElement.innerText) + (10 * window.multiplier);
                found = true;
                break;
            }
        }

        if (!found) {
            // Si presionas donde no hay nota: Romper combo
            window.combo = 0;
        }
    };

    function loop() {
        if (!window.gameActive || window.currentRunningGame !== 'guitar') {
            if (controls) controls.classList.add('hidden');
            return;
        }

        const now = Date.now();
        
        // Generador de notas (Cada 500ms)
        if (now - lastNoteTime > 500) {
            let randomLane = Math.floor(Math.random() * 4);
            window.ghNotes.push({ lane: randomLane, y: -50 });
            lastNoteTime = now;
        }

        // Renderizado
        ctx.fillStyle = "#080808"; 
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Dibujar carriles (Efecto carretera)
        ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
        for(let i=0; i<=4; i++) {
            ctx.beginPath(); 
            ctx.moveTo(i * 100, 0); 
            ctx.lineTo(i * 100, canvas.height); 
            ctx.stroke();
        }

        // --- ZONA DE GOLPE (Los círculos guía abajo) ---
        for(let i=0; i<4; i++) {
            ctx.strokeStyle = window.ghLaneColors[i];
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(50 + (i * 100), 380, 22, 0, Math.PI * 2);
            ctx.stroke();
        }

        // Mover y dibujar las notas
        for (let i = window.ghNotes.length - 1; i >= 0; i--) {
            let n = window.ghNotes[i];
            n.y += 5; 

            // Dibujar Nota Neón
            ctx.fillStyle = window.ghLaneColors[n.lane];
            ctx.shadowBlur = 15;
            ctx.shadowColor = window.ghLaneColors[n.lane];
            ctx.beginPath();
            ctx.arc(50 + (n.lane * 100), n.y, 18, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0; // Reset sombra para rendimiento

            // --- DETECTAR NOTA PERDIDA (CASTIGO) ---
            if (n.y > 420) {
                window.ghNotes.splice(i, 1);
                window.combo = 0; // Reset combo

                if (!ghInvulnerable) {
                    window.Vidas(); // Pierdes un corazón si dejas pasar la nota
                    ghInvulnerable = true;
                    setTimeout(() => { ghInvulnerable = false; }, 1000); // 1s de gracia
                }
            }
        }

        // HUD: Combo y Multiplicador
        ctx.fillStyle = "white";
        ctx.font = "bold 20px Arial";
        ctx.fillText(`COMBO: ${window.combo}`, 20, 40);
        
        // Multiplicador visual
        window.multiplier = window.combo > 20 ? 4 : window.combo > 10 ? 2 : 1;
        if (window.multiplier > 1) {
            ctx.fillStyle = "#00fbff";
            ctx.fillText(`x${window.multiplier}`, 330, 40);
        }

        window.animationId = requestAnimationFrame(loop);
    }
    
    loop();
}