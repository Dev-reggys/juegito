/* --- MOTOR DE GEOMETRY DASH (CON GENERACIÓN LARGA + SISTEMA DE VIDAS) --- */
function initGeometryGD() {
    // 1. LIMPIEZA INICIAL
    if (window.animationId) cancelAnimationFrame(window.animationId);
    
    let player = { x: 100, y: 355, w: 25, h: 25, vY: 0, vX: 6, ground: true };
    const gravity = 0.8;
    const jumpForce = -12;
    const groundY = 380;
    
    let isHoldingJump = false;
    let gdInvulnerable = false; // Protección temporal al perder vida

    // Puente para el script.js
    window.saltarGeometry = () => {
        if (window.gameActive) isHoldingJump = true;
    };

    window.addEventListener('keyup', (e) => {
        const teclasSalto = ["ArrowUp", " ", "w", "W"];
        if (window.currentRunningGame === 'geometry' && teclasSalto.includes(e.key)) {
            isHoldingJump = false;
        }
    });

    if (window.canvas) {
        window.canvas.onmousedown = () => {
            if (window.currentRunningGame === 'geometry') isHoldingJump = true;
        };
        window.canvas.onmouseup = () => { isHoldingJump = false; };
        window.canvas.onmouseleave = () => { isHoldingJump = false; };
    }

    let obstacles = [];
    
    function buildLevel() {
        // 1. EL INICIO A MANO
        let layout = [
            {t:'s', x: 500}, {t:'s', x: 900}, {t:'s', x: 930}, 
            {t:'s', x: 1300}, {t:'s', x: 1330},
            {t:'b', x: 1700, y: 350}, {t:'b', x: 1730, y: 350}, {t:'b', x: 1760, y: 350},
            {t:'s', x: 1790, y: 350}, 
            {t:'s', x: 2300}, {t:'s', x: 2330}, {t:'s', x: 2360},
            {t:'b', x: 2800, y: 350}, 
            {t:'b', x: 2860, y: 310}, 
            {t:'b', x: 2920, y: 270},
            {t:'s', x: 3000},
            {t:'s', x: 3400}, {t:'s', x: 3430}, {t:'s', x: 3460},
            {t:'s', x: 3700}, {t:'s', x: 3730}, {t:'s', x: 3760},
            {t:'b', x: 4200, y: 350}, {t:'s', x: 4230}, {t:'b', x: 4260, y: 350}
        ];

        // 2. GENERADOR DE PATRONES HASTA LA META (45,000 px)
        let currentX = 4900; 
        const targetX = 44000; 

        const patterns = [
            (x) => [ {t:'b', x: x, y: 310}, {t:'s', x: x+30}, {t:'b', x: x+180, y: 310}, {t:'s', x: x+210}, {t:'b', x: x+360, y: 310} ],
            (x) => [ {t:'b', x: x, y: 350}, {t:'b', x: x, y: 320}, {t:'b', x: x+30, y: 350}, {t:'b', x: x+30, y: 320}, {t:'s', x: x+250} ],
            (x) => [ {t:'b', x: x, y: 270}, {t:'b', x: x+90, y: 310}, {t:'b', x: x+180, y: 350}, {t:'s', x: x+210, y: 350}, {t:'s', x: x+270} ],
            (x) => [ {t:'s', x: x}, {t:'s', x: x+350}, {t:'s', x: x+380}, {t:'s', x: x+730}, {t:'s', x: x+760}, {t:'s', x: x+790} ]
        ];

        while (currentX < targetX) {
            let randomPattern = patterns[Math.floor(Math.random() * patterns.length)];
            layout = layout.concat(randomPattern(currentX));
            currentX += 800 + Math.floor(Math.random() * 300); 
        }

        layout.forEach(item => {
            let h = item.t === 'b' ? 30 : 25; 
            let y = item.y !== undefined ? item.y : groundY - h;
            obstacles.push({ type: item.t, x: item.x, y: y, w: 30, h: h });
        });
    }

    function loop() {
        if (!window.gameActive || window.currentRunningGame !== 'geometry') return;

        if (isHoldingJump && player.ground) {
            player.vY = jumpForce;
            player.ground = false;
        }

        player.vY += gravity;
        player.x += player.vX; 
        player.y += player.vY;

        let playerBottom = player.y + player.h;
        let playerRight = player.x + player.w;
        player.ground = false; 

        // --- COLISIONES CON INTEGRACIÓN DE VIDAS ---
        let onBlock = false;
        for (let i = 0; i < obstacles.length; i++) {
            let obs = obstacles[i];
            
            if (playerRight > obs.x + 5 && player.x < obs.x + obs.w - 5) { 
                // Colisión con Picos o Paredes de Bloques
                let hitObstacle = false;
                if (obs.type === 's' && playerBottom > obs.y + 10 && player.y < obs.y + obs.h) hitObstacle = true;
                if (obs.type === 'b' && playerBottom > obs.y + 10 && player.y < obs.y + obs.h) hitObstacle = true;

                if (hitObstacle && !gdInvulnerable) {
                    window.Vidas(); // Restar vida global
                    
                    if (window.lives > 0) {
                        gdInvulnerable = true;
                        // Pequeño impulso hacia arriba para no morir de nuevo al instante
                        player.vY = -8; 
                        player.y -= 10;
                        setTimeout(() => { gdInvulnerable = false; }, 1500);
                    } else {
                        window.gameActive = false;
                        let progreso = Math.floor((player.x / 45000) * 100);
                        mostrarGameOver(progreso + "%");
                        return;
                    }
                }

                // Lógica de plataforma para bloques
                if (obs.type === 'b' && playerBottom >= obs.y && playerBottom <= obs.y + 20 && player.vY >= 0) {
                    player.y = obs.y - player.h;
                    player.vY = 0;
                    player.ground = true;
                    onBlock = true;
                }
            }
        }

        if (!onBlock && playerBottom >= groundY) {
            player.y = groundY - player.h;
            player.vY = 0;
            player.ground = true;
        }

        // --- RENDERIZADO ---
        ctx.fillStyle = "#001b21";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.save();
        ctx.translate(-player.x + 150, 0);

        // Suelo
        ctx.strokeStyle = "#00ff41";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(player.x - 200, groundY);
        ctx.lineTo(player.x + 800, groundY);
        ctx.stroke();

        // Obstáculos
        obstacles.forEach(obs => {
            if (obs.type === 'b') {
                ctx.fillStyle = "#00ff41";
                ctx.fillRect(obs.x, obs.y, obs.w, obs.h);
                ctx.strokeStyle = "#000";
                ctx.strokeRect(obs.x, obs.y, obs.w, obs.h);
            } else {
                ctx.fillStyle = "#ff4141";
                ctx.beginPath();
                ctx.moveTo(obs.x + obs.w / 2, obs.y); 
                ctx.lineTo(obs.x + obs.w, obs.y + obs.h); 
                ctx.lineTo(obs.x, obs.y + obs.h); 
                ctx.closePath();
                ctx.fill();
            }
        });

        // Jugador con efecto de daño
        if (!gdInvulnerable || Math.floor(Date.now() / 150) % 2) {
            ctx.fillStyle = "#00ff41";
            if (!player.ground) {
                ctx.save();
                ctx.translate(player.x + player.w/2, player.y + player.h/2);
                ctx.rotate(player.x * 0.05); 
                ctx.fillRect(-player.w/2, -player.h/2, player.w, player.h);
                ctx.restore();
            } else {
                ctx.fillRect(player.x, player.y, player.w, player.h);
            }
        }
        
        ctx.restore();

        // Texto GG
        if (player.x > 44300) { 
            ctx.save();
            ctx.translate(-player.x + 150, 0); 
            ctx.fillStyle = "#00ff41"; 
            ctx.font = "bold 80px Arial";
            ctx.shadowColor = "#00ff41"; 
            ctx.shadowBlur = 20;
            ctx.fillText("GG", 44500, 200); 
            ctx.restore();
        }

        // Victoria
        if (player.x > 45000) {
            window.gameActive = false; 
            mostrarGameOver("¡NIVEL COMPLETADO!"); 
            return; 
        }

        // Barra de progreso
        const meta = 45000;
        let progreso = Math.min(Math.max(player.x / meta, 0), 1); 
        const anchoBarra = 300;
        const posX = (canvas.width - anchoBarra) / 2; 

        ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
        ctx.fillRect(posX, 20, anchoBarra, 12);
        ctx.fillStyle = "#00ff41";
        ctx.fillRect(posX, 20, anchoBarra * progreso, 12);
        ctx.strokeStyle = "#ffffff";
        ctx.strokeRect(posX, 20, anchoBarra, 12);

        window.animationId = requestAnimationFrame(loop);
    }

    buildLevel();
    loop();
}