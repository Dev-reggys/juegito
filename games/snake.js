/* --- MOTOR DE SNAKE (CONEXIÓN FORZADA) --- */
function initSnake() {
    if (window.currentGameInterval) clearInterval(window.currentGameInterval);

    const box = 20;
    let snake = [{ x: 10 * box, y: 10 * box }];
    let dir = "RIGHT";
    let score = 0;
    let food = { 
        x: Math.floor(Math.random() * 19 + 1) * box, 
        y: Math.floor(Math.random() * 19 + 1) * box 
    };

    // CONEXIÓN MAESTRA: Forzamos la función al objeto window
    window.moverSnake = function(keyCode) {
        console.log("Snake recibió tecla:", keyCode); // Esto te dirá en consola si funciona
        if (!window.gameActive) return;
        if (keyCode == 37 && dir != "RIGHT") dir = "LEFT";
        else if (keyCode == 38 && dir != "DOWN") dir = "UP";
        else if (keyCode == 39 && dir != "LEFT") dir = "RIGHT";
        else if (keyCode == 40 && dir != "UP") dir = "DOWN";
    };

    function draw() {
        if (!window.gameActive || window.currentRunningGame !== 'snake') return;

        ctx.fillStyle = "#000";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Dibujar comida y serpiente
        ctx.fillStyle = "#ff4141";
        ctx.fillRect(food.x, food.y, box, box);
        for (let i = 0; i < snake.length; i++) {
            ctx.fillStyle = (i == 0) ? "#00ff41" : "#008f11";
            ctx.fillRect(snake[i].x, snake[i].y, box - 1, box - 1);
        }

        let headX = snake[0].x;
        let headY = snake[0].y;
        if (dir == "LEFT") headX -= box;
        if (dir == "UP") headY -= box;
        if (dir == "RIGHT") headX += box;
        if (dir == "DOWN") headY += box;

        if (headX < 0 || headX >= canvas.width || headY < 0 || headY >= canvas.height) {
            window.gameActive = false;
            mostrarGameOver(score);
            return;
        }

        if (headX == food.x && headY == food.y) {
            score++;
            window.scoreElement.innerText = score;
            food = { x: Math.floor(Math.random() * 19 + 1) * box, y: Math.floor(Math.random() * 19 + 1) * box };
        } else {
            snake.pop();
        }
        snake.unshift({ x: headX, y: headY });
        window.currentGameInterval = setTimeout(draw, 100);
    }
    draw();
}