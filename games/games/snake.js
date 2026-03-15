/* --- MOTOR DE SNAKE (CONSERVANDO PUNTOS Y LARGO) --- */
function initSnake() {
    if (window.currentGameInterval) clearTimeout(window.currentGameInterval);

    const box = 20;
    // Iniciamos la serpiente. Si ya había puntos, los respetamos.
    let snake = [{ x: 10 * box, y: 10 * box }];
    let dir = "RIGHT";
    let score = parseInt(window.scoreElement.innerText) || 0; 
    let invulnerable = false; 
    
    let food = { 
        x: Math.floor(Math.random() * 19 + 1) * box, 
        y: Math.floor(Math.random() * 19 + 1) * box 
    };

    window.moverSnake = function(keyCode) {
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

        // Dibujar comida
        ctx.fillStyle = "#ff4141";
        ctx.fillRect(food.x, food.y, box, box);

        // --- DIBUJAR SERPIENTE CON PARPADEO ---
        for (let i = 0; i < snake.length; i++) {
            if (!invulnerable || Math.floor(Date.now() / 100) % 2) {
                ctx.fillStyle = (i == 0) ? "#00fbff" : "#008f11";
                ctx.fillRect(snake[i].x, snake[i].y, box - 1, box - 1);
            }
        }

        let headX = snake[0].x;
        let headY = snake[0].y;
        if (dir == "LEFT") headX -= box;
        if (dir == "UP") headY -= box;
        if (dir == "RIGHT") headX += box;
        if (dir == "DOWN") headY += box;

        // --- DETECCIÓN DE CHOQUE ---
        let chocoPared = headX < 0 || headX >= canvas.width || headY < 0 || headY >= canvas.height;
        let chocoCuerpo = false;
        for(let i=1; i<snake.length; i++) {
            if(headX == snake[i].x && headY == snake[i].y) chocoCuerpo = true;
        }

        if ((chocoPared || chocoCuerpo) && !invulnerable) {
            window.Vidas(); // Restar vida global

            if (window.lives > 0) {
                invulnerable = true;
                
                // --- CÁLCULO DE TELETRANSPORTE (Mantiene el largo) ---
                let diffX = (10 * box) - snake[0].x;
                let diffY = (10 * box) - snake[0].y;

                // Movemos cada segmento para que no se pierdan los puntos/largo
                for(let i=0; i < snake.length; i++) {
                    snake[i].x += diffX;
                    snake[i].y += diffY;
                }
                
                dir = "RIGHT"; // Dirección segura por defecto
                
                setTimeout(() => { 
                    if(window.currentRunningGame === 'snake') invulnerable = false; 
                }, 2000); // 2 segundos de escudo
                
                window.currentGameInterval = setTimeout(draw, 100);
                return;
            } else {
                return; 
            }
        }

        // --- LÓGICA DE COMIDA ---
        if (headX == food.x && headY == food.y) {
            score++;
            window.scoreElement.innerText = score;
            food = { 
                x: Math.floor(Math.random() * 19 + 1) * box, 
                y: Math.floor(Math.random() * 19 + 1) * box 
            };
        } else {
            snake.pop();
        }
        
        snake.unshift({ x: headX, y: headY });
        window.currentGameInterval = setTimeout(draw, 100);
    }
    draw();
}