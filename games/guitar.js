/* --- PRUEBA DE FUEGO: GENERADOR FORZADO DE NOTAS --- */

window.ghNotes = [];
window.ghLaneColors = ["#ff4141", "#ffea00", "#00ff41", "#00fbff"]; 
window.combo = 0;
window.multiplier = 1;

// 1. EL MAPA DE LA CANCIÓN (Beatmap sincronizado)
window.beatmap = [];

// Cambia este número por el resultado de (60 / Tu BPM)
const segundosPorBeat = 0.5; // <-- ¡AQUÍ ESTÁ LA CLAVE!

// offset: ¿En qué segundo empieza el primer golpe fuerte de la canción?
const inicioDeLaCancion = 2.0; 

for (let i = inicioDeLaCancion; i <= 180; i += segundosPorBeat) { 
    window.beatmap.push({ 
        time: i, 
        lane: Math.floor(Math.random() * 4) 
    });
}

function initGuitarHero() {
    console.log("🎸 Iniciando Guitar Hero... ¡Prueba de fuego!");
    const canvas = document.getElementById("mainCanvas");
    const ctx = canvas.getContext("2d");
    const audio = window.audioTracks['guitartheme']; 
    
    // Reproducimos el audio normal sin intentar analizarlo
    if (audio) {
        audio.play().catch(e => console.log("Aviso de audio:", e));
    }

    // Mostramos los botones de colores
    const controls = document.getElementById('guitar-controls');
    if (controls) controls.classList.remove('hidden');

    window.ghNotes = [];
    window.combo = 0;
    window.multiplier = 1;
    let lastNoteTime = 0;

    function loop() {
        if (window.currentRunningGame !== 'guitar') {
            if (controls) controls.classList.add('hidden');
            return;
        }

        const now = Date.now();
        
        // 🚨 AQUÍ ESTÁ LA MAGIA: FORZAMOS UNA NOTA CADA 500 MILISEGUNDOS 🚨
        if (now - lastNoteTime > 500) {
            let randomLane = Math.floor(Math.random() * 4);
            window.ghNotes.push({ lane: randomLane, y: -50 });
            lastNoteTime = now;
            console.log("🎵 Nota generada en carril:", randomLane); // Aviso en consola
        }

        // Fondo oscuro
        ctx.fillStyle = "#080808"; 
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Líneas separadoras
        ctx.strokeStyle = "rgba(255, 255, 255, 0.2)";
        for(let i=1; i<4; i++) {
            ctx.beginPath(); 
            ctx.moveTo(i * 100, 0); 
            ctx.lineTo(i * 100, canvas.height); 
            ctx.stroke();
        }

        // Mover y dibujar las notas
        for (let i = window.ghNotes.length - 1; i >= 0; i--) {
            let n = window.ghNotes[i];
            n.y += 5; // Bajan a velocidad 5

            ctx.fillStyle = window.ghLaneColors[n.lane];
            ctx.beginPath();
            ctx.arc(50 + (n.lane * 100), n.y, 18, 0, Math.PI * 2);
            ctx.fill();

            // Si se salen de la pantalla por abajo, se borran
            if (n.y > 450) {
                window.ghNotes.splice(i, 1);
            }
        }

        // Dibujar puntaje
        ctx.fillStyle = "white";
        ctx.font = "bold 18px 'Courier New'";
        ctx.fillText(`COMBO: ${window.combo}`, 20, 30);

window.animationId = requestAnimationFrame(loop);    }
    
    loop();
}