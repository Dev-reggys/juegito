/* --- MOTOR DINO RUN PRO (CON SEPARACIÓN MÍNIMA) --- */
function initDino(charEmoji) {
    const canvas = window.canvas;
    const ctx = window.ctx;

    let dino = {
        x: 50,
        y: 330,
        w: 35,
        h: 35,
        emoji: charEmoji || "🦖",
        dy: 0,
        jumpForce: 13,
        gravity: 0.7,
        grounded: false
    };

    let obstacles = [];
    let gameSpeed = 6;
    let lastObstaclePos = 0; // Para rastrear dónde está el último obstáculo
    let minDistance = 200;   // Distancia mínima de separación en píxeles
    window.scoreElement.innerText = "0";

    // Controles
    window.onkeydown = (e) => {
        if ((e.code === "Space" || e.code === "ArrowUp") && dino.grounded) {
            dino.dy = -dino.jumpForce;
            dino.grounded = false;
        }
    };
    canvas.onclick = () => {
        if (dino.grounded) {
            dino.dy = -dino.jumpForce;
            dino.grounded = false;
        }
    };

    function crearObstaculo() {
        const tipos = [
            { tipo: 'cactus', emoji: '🌵', y: 340, w: 25, h: 35 },
            { tipo: 'pajaro', emoji: '🕊️', y: 260, w: 30, h: 20 },
            { tipo: 'pajaro_bajo', emoji: '🦇', y: 300, w: 30, h: 20 },
            { tipo: 'piedra', emoji: '🪨', y: 345, w: 20, h: 20 }
        ];
        
        const random = tipos[Math.floor(Math.random() * tipos.length)];
        return {
            x: canvas.width + 50,
            ...random
        };
    }

    function loop() {
        if (!window.gameActive || window.currentRunningGame !== 'dino') return;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // --- FÍSICAS ---
        dino.dy += dino.gravity;
        dino.y += dino.dy;

        if (dino.y > 330) {
            dino.y = 330;
            dino.dy = 0;
            dino.grounded = true;
        }

        // --- GENERADOR CON MARGEN DE SEGURIDAD ---
        // Solo intentamos crear un obstáculo si el último ya avanzó lo suficiente
        let distanceToLast = (obstacles.length > 0) 
            ? canvas.width - obstacles[obstacles.length - 1].x 
            : minDistance + 1;

        if (distanceToLast > minDistance) {
            // Un 2% de probabilidad de generar uno cada frame una vez superada la distancia
            if (Math.random() < 0.02) { 
                obstacles.push(crearObstaculo());
                gameSpeed += 0.03; // Aceleración más suave para que sea jugable
                // Aumentamos ligeramente la distancia mínima según la velocidad
                minDistance = 180 + (gameSpeed * 5); 
            }
        }

        // --- DIBUJO Y COLISIONES ---
        for (let i = obstacles.length - 1; i >= 0; i--) {
            let obs = obstacles[i];
            obs.x -= gameSpeed;

            ctx.font = obs.tipo.includes('pajaro') ? "25px Arial" : "30px Arial";
            ctx.fillText(obs.emoji, obs.x, obs.y);

            // Hitbox
            let padding = 8;
            if (
                dino.x + padding < obs.x + obs.w &&
                dino.x + dino.w - padding > obs.x &&
                dino.y + padding < obs.y &&
                dino.y + dino.h - padding > obs.y - obs.h
            ) {
                actualizarRanking(currentUser || "Anónimo", window.scoreElement.innerText);
                mostrarGameOver(window.scoreElement.innerText);
                return;
            }

            if (obs.x < -50) {
                obstacles.splice(i, 1);
                let currentScore = parseInt(window.scoreElement.innerText);
                window.scoreElement.innerText = currentScore + 10;
            }
        }

        // --- ESCENARIO ---
        ctx.strokeStyle = "#444";
        ctx.beginPath();
        ctx.moveTo(0, 350);
        ctx.lineTo(canvas.width, 350);
        ctx.stroke();

        ctx.font = "40px Arial";
        ctx.fillText(dino.emoji, dino.x, dino.y + 10);

        window.animationId = requestAnimationFrame(loop);
    }
    loop();
}