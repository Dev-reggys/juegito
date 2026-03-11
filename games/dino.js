function initDino(sprite) {
    if (animationId) cancelAnimationFrame(animationId);
    
    let score = 0;
    let dinoY = 330, vY = 0, jumping = false;
    let obstacles = [];
    let frame = 0;

    // PUENTE DE CONTROL
    window.saltarDino = () => {
        if (window.gameActive && !jumping) {
            vY = -12; 
            jumping = true;
        }
    };

    function gameLoop() {
        if (!window.gameActive || currentRunningGame !== 'dino') return; 

        ctx.fillStyle = "#0a0a0a";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        vY += 0.6; 
        dinoY += vY;
        if (dinoY > 330) { dinoY = 330; vY = 0; jumping = false; }

        ctx.strokeStyle = "#00ff41";
        ctx.strokeRect(0, 370, canvas.width, 1);
        ctx.font = "40px Arial";
        ctx.fillText(sprite || "🦖", 50, dinoY + 35);

        if (frame % 100 === 0) obstacles.push({ x: canvas.width, y: 340, w: 20, h: 30 });

        for (let i = obstacles.length - 1; i >= 0; i--) {
            obstacles[i].x -= 6;
            ctx.fillStyle = "#ff4141";
            ctx.fillRect(obstacles[i].x, obstacles[i].y, obstacles[i].w, obstacles[i].h);

            if (50 < obstacles[i].x + obstacles[i].w && 80 > obstacles[i].x && dinoY + 35 > obstacles[i].y) {
                window.gameActive = false;
                mostrarGameOver(score);
                return;
            }
            if (obstacles[i].x < -20) { obstacles.splice(i, 1); score += 10; scoreElement.innerText = score; }
        }
        frame++;
        animationId = requestAnimationFrame(gameLoop);
    }
    gameLoop();
}