function initSnake() {
    const box = 20;
    let snake = [{ x: 10 * box, y: 10 * box }];
    let dir = "RIGHT";
    let score = 0;
    let gameActive = true; 
    let food = { x: Math.floor(Math.random()*19+1)*box, y: Math.floor(Math.random()*19+1)*box };

    window.onkeydown = (e) => {
        if(!gameActive) return;
        if(e.keyCode == 37 && dir != "RIGHT") dir = "LEFT";
        if(e.keyCode == 38 && dir != "DOWN") dir = "UP";
        if(e.keyCode == 39 && dir != "LEFT") dir = "RIGHT";
        if(e.keyCode == 40 && dir != "UP") dir = "DOWN";
        if([37, 38, 39, 40].includes(e.keyCode)) e.preventDefault();
    };

    function draw() {
        if(!gameActive) return; // Freno de seguridad

        ctx.fillStyle = "#000";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        for(let i=0; i<snake.length; i++) {
            ctx.fillStyle = (i==0) ? "#00ff41" : "#008f11";
            ctx.fillRect(snake[i].x, snake[i].y, box - 1, box - 1);
        }

        ctx.fillStyle = "#ff4141";
        ctx.fillRect(food.x, food.y, box, box);

        let headX = snake[0].x;
        let headY = snake[0].y;

        if(dir == "LEFT") headX -= box;
        if(dir == "UP") headY -= box;
        if(dir == "RIGHT") headX += box;
        if(dir == "DOWN") headY += box;

        // --- COLISIÓN ---
        if(headX < 0 || headX >= canvas.width || headY < 0 || headY >= canvas.height || collision(headX, headY, snake)) {
            gameActive = false; 
            clearTimeout(currentGameInterval); // Detenemos el temporizador
            mostrarGameOver(score); // LLAMADA AL NUEVO MODAL
            return; 
        }

        if(headX == food.x && headY == food.y) {
            score++;
            scoreElement.innerText = score;
            food = { x: Math.floor(Math.random()*19+1)*box, y: Math.floor(Math.random()*19+1)*box };
        } else {
            snake.pop();
        }

        snake.unshift({x: headX, y: headY});
        
        // Solo programamos el siguiente cuadro si el juego sigue activo
        if(gameActive) {
            currentGameInterval = setTimeout(draw, 100);
        }
    }

    function collision(x, y, array) {
        for(let i=0; i<array.length; i++) {
            if(x == array[i].x && y == array[i].y) return true;
        }
        return false;
    }
    draw();
}