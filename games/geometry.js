function initGeometryGD() {
    const DURATION = 70; 
    let startTime = Date.now();
    let gameActive = true;
    let finalScoreSent = false;

    let player = { 
        x: 50, y: 300, w: 25, h: 25, 
        vY: 0, 
        vX: 5, 
        ground: false
    };

    const gravity = 0.6;
    const maxFallSpeed = 12;
    let keys = {};

    // --- CONTROLES DE ALTA RESPUESTA (LATENCIA CERO) ---

    // 1. Mouse: mousedown es mucho más rápido que onclick
    window.onmousedown = (e) => {
        if (gameActive && player.ground) {
            saltar();
        }
    };

    // 2. Teclado: Detección inmediata
    window.onkeydown = (e) => {
        if (!gameActive) return;
        keys[e.code] = true;
        if (["Space", "ArrowUp"].includes(e.code)) {
            e.preventDefault();
            if (player.ground) saltar();
        }
    };
    window.onkeyup = (e) => keys[e.code] = false;

    // Función de salto centralizada para asegurar misma potencia
    function saltar() {
        player.vY = -11;
        player.ground = false;
    }

    let obstacles = [];
    const groundY = 380;

    function generateLevel() {
        let currentX = 400; 
        for (let i = 0; i < 100; i++) {
            let rand = Math.random();
            if (rand < 0.4) { 
                obstacles.push({x: currentX, y: groundY - 30, w: 120, h: 30, type: 'block'});
                currentX += 250;
            } else if (rand < 0.7) { 
                obstacles.push({x: currentX, y: groundY - 30, w: 80, h: 30, type: 'block'});
                obstacles.push({x: currentX + 110, y: groundY - 20, w: 20, h: 20, type: 'spike'});
                currentX += 300;
            } else { 
                obstacles.push({x: currentX, y: groundY - 80, w: 60, h: 20, type: 'block'});
                obstacles.push({x: currentX + 130, y: groundY - 150, w: 60, h: 20, type: 'block'});
                currentX += 350;
            }
        }
    }
    generateLevel();

    function loop() {
        if (!gameActive) return;

        let elapsed = (Date.now() - startTime) / 1000;
        let progress = Math.min((elapsed / DURATION) * 100, 100);

        // Actualizar UI de progreso
        if (scoreElement) {
            scoreElement.innerHTML = `
                <div class="progress-wrapper" style="width: 100%; height: 20px; background: #000; border: 2px solid #00ff41; position: relative; overflow: hidden;">
                    <div class="progress-fill" style="width: ${progress}%; height: 100%; background: #00ff41; box-shadow: 0 0 10px #00ff41;"></div>
                    <span style="position: absolute; width: 100%; text-align: center; color: #fff; font-size: 12px; top: 0; left: 0; line-height: 20px;">${Math.floor(progress)}%</span>
                </div>
            `;
        }

        if (progress >= 100 && !finalScoreSent) {
            finalScoreSent = true;
            muerte("100% ¡GANASTE!"); 
            return;
        }

        // FÍSICA
        player.vY += gravity;
        if (player.vY > maxFallSpeed) player.vY = maxFallSpeed;

        player.x += player.vX; 
        player.y += player.vY;

        // Suelo fijo
        if (player.y + player.h > groundY) {
            player.y = groundY - player.h;
            player.vY = 0;
            player.ground = true;
        }

        // DIBUJO
        ctx.fillStyle = "#001b21";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.save();
        ctx.translate(-player.x + 100, 0);

        // Suelo neón
        ctx.strokeStyle = "#00ff41";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(player.x - 100, groundY);
        ctx.lineTo(player.x + 800, groundY);
        ctx.stroke();

        // Obstáculos y Colisiones
        obstacles.forEach(obs => {
            if (obs.type === 'block') {
                ctx.fillStyle = "#3498db";
                ctx.fillRect(obs.x, obs.y, obs.w, obs.h);
                
                if (player.x < obs.x + obs.w && player.x + player.w > obs.x &&
                    player.y < obs.y + obs.h && player.y + player.h > obs.y) {
                    
                    if (player.vY > 0 && player.y + player.h < obs.y + 15) {
                        player.y = obs.y - player.h;
                        player.vY = 0;
                        player.ground = true;
                    } else {
                        muerte(progress);
                    }
                }
            } else {
                ctx.fillStyle = "#ff4141";
                ctx.beginPath();
                ctx.moveTo(obs.x, obs.y + 20);
                ctx.lineTo(obs.x + 10, obs.y);
                ctx.lineTo(obs.x + 20, obs.y + 20);
                ctx.fill();

                if (player.x < obs.x + 20 && player.x + player.w > obs.x &&
                    player.y < obs.y + 20 && player.y + player.h > obs.y) {
                    muerte(progress);
                }
            }
        });

        // Jugador
        ctx.fillStyle = "#ff3e3e";
        ctx.shadowBlur = 10;
        ctx.shadowColor = "#ff3e3e";
        ctx.fillRect(player.x, player.y, player.w, player.h);
        ctx.shadowBlur = 0; // Reset para no afectar otros dibujos
        ctx.restore();

        function muerte(currentProgress) {
            if (!gameActive) return;
            gameActive = false;
            finalScoreSent = true;
            
            // Limpiar eventos globales al morir
            window.onmousedown = null;
            
            if (animationId) cancelAnimationFrame(animationId);
            
            let textoFinal = (typeof currentProgress === 'string') ? currentProgress : Math.floor(currentProgress) + "%";
            
            if (typeof mostrarGameOver === "function") {
                mostrarGameOver(textoFinal); 
            }
        }

        if (gameActive) {
            animationId = requestAnimationFrame(loop);
        }
    }
    
    loop();
}