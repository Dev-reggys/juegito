/* --- MOTOR DE GUITAR MASTER: VERSIÓN RÍTMICA INTEGRADA --- */

// Protección de variables globales (Evita errores de "already declared")
window.ghNotes = window.ghNotes || [];
window.ghLaneColors = ["#ff4141", "#ffea00", "#00ff41", "#00fbff"]; 
window.keyMap = { 'a': 0, 's': 1, 'd': 2, 'f': 3 };
window.keyVisualIds = ['key-a', 'key-s', 'key-d', 'key-f'];
window.combo = 0;
window.multiplier = 1;

function initGuitarHero() {
    const canvas = document.getElementById("mainCanvas");
    const ctx = canvas.getContext("2d");
    const audio = document.getElementById("guitartheme");
    // Seleccionamos tu contenedor que tiene el gradiente rotativo
    const container = document.querySelector('.canvas-container');

    if (audio) {
        audio.play().catch(() => console.log("Audio en espera de interacción..."));
    }

    // 1. CONFIGURACIÓN DEL ANALIZADOR (Para el efecto DASH de tu CSS)
    if (!window.audioCtx) {
        try {
            window.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            window.analyser = window.audioCtx.createAnalyser();
            window.source = window.audioCtx.createMediaElementSource(audio);
            window.source.connect(window.analyser);
            window.analyser.connect(window.audioCtx.destination);
        } catch (e) {
            console.warn("Análisis rítmico desactivado (CORS). Usando generador constante.");
        }
    }
    
    if (window.analyser) window.analyser.fftSize = 256;
    const dataArray = new Uint8Array(window.analyser ? window.analyser.frequencyBinCount : 0);

    // Configuración de UI
    const controls = document.getElementById('guitar-controls');
    if (controls) controls.classList.remove('hidden');
    
    window.ghNotes = [];
    window.combo = 0;
    window.multiplier = 1;
    let baseSpeed = 5;
    let lastNoteTime = 0;

    // --- INTEGRACIÓN DE ENTRADA (Para tus botones neón) ---
    window.onkeydown = (e) => {
        const key = e.key.toLowerCase();
        if (window.keyMap.hasOwnProperty(key)) {
            const lane = window.keyMap[key];
            const visualKey = document.getElementById(window.keyVisualIds[lane]);
            
            if (visualKey) visualKey.classList.add('active'); // Brillo blanco de tu CSS

            // Lógica de impacto
            for (let i = 0; i < window.ghNotes.length; i++) {
                let n = window.ghNotes[i];
                // Rango de impacto (ajustado a tu zona de 330px)
                if (n.lane === lane && n.y > 310 && n.y < 390) {
                    window.ghNotes.splice(i, 1);
                    window.combo++;
                    window.multiplier = window.combo > 20 ? 4 : (window.combo > 10 ? 2 : 1);
                    // Actualizar score si tienes el elemento en el HTML
                    const scoreEl = document.getElementById("score");
                    if (scoreEl) scoreEl.innerText = parseInt(scoreEl.innerText) + (10 * window.multiplier);
                    break;
                }
            }
        }
    };

    window.onkeyup = (e) => {
        const key = e.key.toLowerCase();
        if (window.keyMap.hasOwnProperty(key)) {
            const visualKey = document.getElementById(window.keyVisualIds[window.keyMap[key]]);
            if (visualKey) visualKey.classList.remove('active');
        }
    };

    function loop() {
        if (typeof currentRunningGame === 'undefined' || currentRunningGame !== 'guitar') {
            if (controls) controls.classList.add('hidden');
            return;
        }

        // 2. DETECCIÓN DE RITMO (DASH)
        let avgLow = 0;
        if (window.analyser) {
            window.analyser.getByteFrequencyData(dataArray);
            let energy = 0;
            for(let i = 0; i < 10; i++) { energy += dataArray[i]; }
            avgLow = energy / 10;
        }

        // DISPARADOR DE TU ANIMACIÓN CSS (.beat)
        if (avgLow > 195 && container) {
            container.classList.add('beat');
            setTimeout(() => container.classList.remove('beat'), 100);
        }

        // 3. GENERADOR DE NOTAS (Sincronizado o Seguro)
        const now = Date.now();
        const spawnInterval = window.analyser ? 420 : 600;
        const threshold = window.analyser ? 165 : 0;

        if ((avgLow > threshold || !window.analyser) && now - lastNoteTime > spawnInterval) {
            window.ghNotes.push({ lane: Math.floor(Math.random() * 4), y: -50 });
            lastNoteTime = now;
        }

        // 4. RENDERIZADO
        ctx.fillStyle = "#080808"; 
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Guías de carril
        ctx.strokeStyle = "rgba(255, 255, 255, 0.05)";
        for(let i=1; i<4; i++) {
            ctx.beginPath(); ctx.moveTo(i * 100, 0); ctx.lineTo(i * 100, canvas.height); ctx.stroke();
        }

        // 5. MOVIMIENTO Y DIBUJO DE NOTAS
        for (let i = window.ghNotes.length - 1; i >= 0; i--) {
            let n = window.ghNotes[i];
            let currentDash = avgLow / 55; 
            n.y += (baseSpeed + currentDash);

            // Efecto Neón en el Canvas
            ctx.shadowBlur = 15;
            ctx.shadowColor = window.ghLaneColors[n.lane];
            ctx.fillStyle = window.ghLaneColors[n.lane];
            ctx.beginPath();
            ctx.arc(50 + (n.lane * 100), n.y, 18, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;

            // Nota perdida
            if (n.y > 450) {
                window.ghNotes.splice(i, 1);
                window.combo = 0;
                window.multiplier = 1;
            }
        }

        // 6. HUD
        ctx.fillStyle = "white";
        ctx.font = "bold 18px 'Courier New'";
        ctx.fillText(`COMBO: ${window.combo}`, 20, 30);
        ctx.fillStyle = window.multiplier > 1 ? "#ffea00" : "#00fbff";
        ctx.fillText(`x${window.multiplier}`, 340, 30);

        window.animationId = requestAnimationFrame(loop);
    }
    
    loop();
}