/* --- MOTOR SLITHER MULTI-BOT (7 RIVALES + DASH + SISTEMA DE VIDAS) --- */
const WORLD_WIDTH = 900;
const WORLD_HEIGHT = 1000;
const TOTAL_BOTS = 7;

window.slitherPlayer = [];
window.slitherFood = [];
window.slitherBots = [];
let slitherInvulnerable = false; 

function initSlither() {
    const canvas = window.canvas;
    const ctx = window.ctx;
    slitherInvulnerable = false; 

    // Reset Jugador
    window.slitherPlayer = [];
    for(let i = 0; i < 15; i++) window.slitherPlayer.push({ x: 450, y: 500 });

    // Inicializar los 7 Bots
    window.slitherBots = [];
    const coloresBot = ["#ff4141", "#ff8800", "#ff00ff", "#ffffff", "#00ff41", "#ffff00", "#7700ff"];
    
    for(let b = 0; b < TOTAL_BOTS; b++) {
        let nuevoBot = {
            body: [],
            angle: Math.random() * Math.PI * 2,
            alive: true,
            color: coloresBot[b]
        };
        let startX = Math.random() * WORLD_WIDTH;
        let startY = Math.random() * WORLD_HEIGHT;
        for(let i = 0; i < 12; i++) nuevoBot.body.push({ x: startX, y: startY });
        window.slitherBots.push(nuevoBot);
    }

    // Comida inicial
    window.slitherFood = [];
    for(let i = 0; i < 80; i++) generarComidaSlither();

    let isDashing = false;
    canvas.onmousedown = () => isDashing = true;
    canvas.onmouseup = () => isDashing = false;

    function loop() {
        if (!window.gameActive || window.currentRunningGame !== 'slither') return;

        let head = window.slitherPlayer[0];
        let camX = head.x - canvas.width / 2;
        let camY = head.y - canvas.height / 2;

        // --- 1. LÓGICA JUGADOR (CON GASTO DE PUNTOS POR SPRINT) ---
        let currentScore = parseInt(window.scoreElement.innerText) || 0;
        let canDash = isDashing && currentScore > 10; // Solo corre si tiene más de 10 puntos
        let speed = canDash ? 6 : 3;

        if (canDash) {
            // Restamos 10 puntos por segundo (aprox 0.16 por frame a 60fps)
            let newScore = currentScore - (10 / 60);
            window.scoreElement.innerText = Math.max(0, Math.floor(newScore));
            
            // Efecto visual: Encoger un poco si es muy larga mientras gasta puntos
            if (window.slitherPlayer.length > 10 && Math.random() > 0.95) {
                window.slitherPlayer.pop();
            }
        }

        let targetX = window.mouseX + camX;
        let targetY = window.mouseY + camY;
        let angle = Math.atan2(targetY - head.y, targetX - head.x);

        let prevX = head.x;
        let prevY = head.y;

        let nextX = head.x + Math.cos(angle) * speed;
        let nextY = head.y + Math.sin(angle) * speed;

        if (nextX >= 0 && nextX <= WORLD_WIDTH) head.x = nextX;
        if (nextY >= 0 && nextY <= WORLD_HEIGHT) head.y = nextY;

        actualizarCuerpo(window.slitherPlayer, prevX, prevY);

        // --- 2. LÓGICA DE LOS 7 BOTS ---
        window.slitherBots.forEach(bot => {
            if (!bot.alive) return;

            let bHead = bot.body[0];
            bot.angle += (Math.random() - 0.5) * 0.3; 
            let bPrevX = bHead.x;
            let bPrevY = bHead.y;
            bHead.x += Math.cos(bot.angle) * 2.5;
            bHead.y += Math.sin(bot.angle) * 2.5;

            if(bHead.x < 0 || bHead.x > WORLD_WIDTH) bot.angle = Math.PI - bot.angle;
            if(bHead.y < 0 || bHead.y > WORLD_HEIGHT) bot.angle = -bot.angle;

            actualizarCuerpo(bot.body, bPrevX, bPrevY);

            // --- 3. COLISIONES ---
            bot.body.forEach(part => {
                if (!slitherInvulnerable && Math.hypot(head.x - part.x, head.y - part.y) < 12) {
                    window.Vidas(); 
                    if (window.lives > 0) {
                        slitherInvulnerable = true;
                        head.x -= Math.cos(angle) * 30;
                        head.y -= Math.sin(angle) * 30;
                        setTimeout(() => { slitherInvulnerable = false; }, 2000);
                    }
                }
            });

            window.slitherPlayer.forEach((part, index) => {
                if (index > 2 && Math.hypot(bHead.x - part.x, bHead.y - part.y) < 10) {
                    bot.alive = false; 
                    window.scoreElement.innerText = parseInt(window.scoreElement.innerText) + 300;
                    bot.body.forEach(p => window.slitherFood.push({x: p.x, y: p.y, color: bot.color}));
                }
            });
        });

        // --- 4. COMER ---
        window.slitherFood.forEach((f, i) => {
            if (Math.hypot(head.x - f.x, head.y - f.y) < 15) {
                window.slitherPlayer.push({...window.slitherPlayer[window.slitherPlayer.length-1]});
                window.slitherFood.splice(i, 1);
                generarComidaSlither();
                window.scoreElement.innerText = parseInt(window.scoreElement.innerText) + 10;
            }
        });

        // --- 5. RENDER ---
        ctx.fillStyle = "#050505";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.save();
        ctx.translate(-camX, -camY);

        ctx.strokeStyle = "#151515";
        for(let x=0; x<=WORLD_WIDTH; x+=50) { ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x, WORLD_HEIGHT); ctx.stroke(); }
        for(let y=0; y<=WORLD_HEIGHT; y+=50) { ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(WORLD_WIDTH, y); ctx.stroke(); }

        window.slitherFood.forEach(f => {
            ctx.fillStyle = f.color;
            ctx.beginPath(); ctx.arc(f.x, f.y, 4, 0, Math.PI*2); ctx.fill();
        });

        window.slitherBots.forEach(bot => {
            if (!bot.alive) return;
            bot.body.forEach((p, i) => {
                ctx.fillStyle = i === 0 ? bot.color : bot.color + "88";
                ctx.beginPath(); ctx.arc(p.x, p.y, i === 0 ? 10 : 8, 0, Math.PI*2); ctx.fill();
            });
        });

        if (!slitherInvulnerable || Math.floor(Date.now() / 150) % 2) {
            window.slitherPlayer.forEach((p, i) => {
                ctx.fillStyle = i === 0 ? "#00fbff" : "#0044ff";
                ctx.beginPath(); ctx.arc(p.x, p.y, i === 0 ? 10 : 8, 0, Math.PI*2); ctx.fill();
            });
        }

        ctx.restore();
        window.animationId = requestAnimationFrame(loop);
    }
    loop();
}

function actualizarCuerpo(cuerpo, pX, pY) {
    for (let i = 1; i < cuerpo.length; i++) {
        let part = cuerpo[i];
        let dX = pX - part.x;
        let dY = pY - part.y;
        let dist = Math.hypot(dX, dY);
        if (dist > 10) {
            part.x += (dX / dist) * (dist - 10);
            part.y += (dY / dist) * (dist - 10);
        }
        pX = part.x; pY = part.y;
    }
}

function generarComidaSlither() {
    const colores = ["#00fbff", "#ff00ff", "#ffea00", "#00ff41"];
    if (window.slitherFood) {
        window.slitherFood.push({ 
            x: Math.random() * WORLD_WIDTH, 
            y: Math.random() * WORLD_HEIGHT,
            color: colores[Math.floor(Math.random() * colores.length)]
        });
    }
}