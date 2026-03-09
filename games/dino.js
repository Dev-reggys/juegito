function initDino(sprite) {
    let score = 0;
    let gameActive = true; 
    let dinoY = 330, vY = 0, jumping = false;
    let obstacles = [];
    let frame = 0;

    window.onkeydown = (e) => {
        if(!gameActive) return;
        if((e.code === "Space" || e.code === "ArrowUp") && !jumping) {
            vY = -12; 
            jumping = true;
            e.preventDefault();
        }
    };

    function gameLoop() {
        // EL CANDADO: Si gameActive es falso, el proceso se detiene en seco
        if (!gameActive) return;

        ctx.fillStyle = "#0a0a0a";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Física
        vY += 0.6; 
        dinoY += vY;
        if(dinoY > 330) { 
            dinoY = 330; vY = 0; jumping = false; 
        }

        // Suelo neón
        ctx.strokeStyle = "#00ff41";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, 370);
        ctx.lineTo(canvas.width, 370);
        ctx.stroke();

        // Personaje
        ctx.font = "40px Arial";
        ctx.fillText(sprite, 50, dinoY + 35);

        // Generar Cactus
        if(frame % 100 === 0) {
            obstacles.push({ x: canvas.width, y: 340, w: 20, h: 30 });
        }

        for(let i = obstacles.length-1; i >= 0; i--) {
            obstacles[i].x -= 6;
            ctx.fillStyle = "#ff4141";
            ctx.fillRect(obstacles[i].x, obstacles[i].y, obstacles[i].w, obstacles[i].h);

            // DETECCIÓN DE COLISIÓN MEJORADA
            if(50 < obstacles[i].x + obstacles[i].w && 
               50 + 30 > obstacles[i].x && 
               dinoY < obstacles[i].y + obstacles[i].h && 
               dinoY + 30 > obstacles[i].y) {
                
                gameActive = false; // Bloqueo de lógica
                cancelAnimationFrame(animationId); // Bloqueo de renderizado
                mostrarGameOver(score); // LLAMADA AL MODAL NEÓN
                return; 
            }

            // Puntuación
            if(obstacles[i].x < -20) {
                obstacles.splice(i, 1);
                score += 10;
                scoreElement.innerText = score;
            }
        }

        frame++;
        if (gameActive) {
            animationId = requestAnimationFrame(gameLoop);
        }
    }

    gameLoop();
}