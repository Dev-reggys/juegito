/* --- MOTOR SLITHER MULTI-BOT (7 RIVALES + DASH) --- */
const WORLD_WIDTH = 900;
const WORLD_HEIGHT = 1000;
const TOTAL_BOTS = 7; // <--- ¡Deseo concedido!

window.slitherPlayer = [];
window.slitherFood = [];
window.slitherBots = []; // Ahora es una lista de bots

function initSlither() {
    const canvas = window.canvas;
    const ctx = window.ctx;

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
        // Posición inicial aleatoria para cada bot
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

        // --- 1. LÓGICA JUGADOR ---
        // --- 1. LÓGICA JUGADOR (CON BLOQUEO DE BORDES) ---
        let speed = isDashing ? 6 : 3;
        
        let targetX = window.mouseX + camX;
        let targetY = window.mouseY + camY;
        let angle = Math.atan2(targetY - head.y, targetX - head.x);

        let prevX = head.x;
        let prevY = head.y;

        // Calculamos la nueva posición potencial
        let nextX = head.x + Math.cos(angle) * speed;
        let nextY = head.y + Math.sin(angle) * speed;

        // COLISIÓN CON BORDES (No permite salir del mapa)
        if (nextX >= 0 && nextX <= WORLD_WIDTH) {
            head.x = nextX;
        }
        if (nextY >= 0 && nextY <= WORLD_HEIGHT) {
            head.y = nextY;
        }

        // Si intentas ir más allá, la serpiente se desliza por el borde
        actualizarCuerpo(window.slitherPlayer, prevX, prevY);

        // --- 2. LÓGICA DE LOS 7 BOTS ---
        window.slitherBots.forEach(bot => {
            if (!bot.alive) return;

            let bHead = bot.body[0];
            bot.angle += (Math.random() - 0.5) * 0.3; // Movimiento más errático
            let bPrevX = bHead.x;
            let bPrevY = bHead.y;
            bHead.x += Math.cos(bot.angle) * 2.5;
            bHead.y += Math.sin(bot.angle) * 2.5;

            // Rebotar en paredes
            if(bHead.x < 0 || bHead.x > WORLD_WIDTH) bot.angle = Math.PI - bot.angle;
            if(bHead.y < 0 || bHead.y > WORLD_HEIGHT) bot.angle = -bot.angle;

            actualizarCuerpo(bot.body, bPrevX, bPrevY);

            // --- 3. COLISIONES ---
            // Jugador choca con algún Bot?
            bot.body.forEach(part => {
                if (Math.hypot(head.x - part.x, head.y - part.y) < 10) {
                    mostrarGameOver(window.scoreElement.innerText);
                }
            });

            // Algún Bot choca con el Jugador?
            window.slitherPlayer.forEach((part, index) => {
                if (index > 2 && Math.hypot(bHead.x - part.x, bHead.y - part.y) < 10) {
                    bot.alive = false; // El bot muere
                    window.scoreElement.innerText = parseInt(window.scoreElement.innerText) + 300;
                    // El bot muerto se convierte en comida extra
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

        // Grid (Fondo neón oscuro)
        ctx.strokeStyle = "#151515";
        for(let x=0; x<=WORLD_WIDTH; x+=50) { ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x, WORLD_HEIGHT); ctx.stroke(); }
        for(let y=0; y<=WORLD_HEIGHT; y+=50) { ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(WORLD_WIDTH, y); ctx.stroke(); }

        // Comida
        window.slitherFood.forEach(f => {
            ctx.fillStyle = f.color;
            ctx.beginPath(); ctx.arc(f.x, f.y, 4, 0, Math.PI*2); ctx.fill();
        });

        // Dibujar Bots
        window.slitherBots.forEach(bot => {
            if (!bot.alive) return;
            bot.body.forEach((p, i) => {
                ctx.fillStyle = i === 0 ? bot.color : bot.color + "88"; // Cuerpo semi-transparente
                ctx.beginPath(); ctx.arc(p.x, p.y, i === 0 ? 10 : 8, 0, Math.PI*2); ctx.fill();
            });
        });

        // Dibujar Jugador
        window.slitherPlayer.forEach((p, i) => {
            ctx.fillStyle = i === 0 ? "#00fbff" : "#0044ff";
            ctx.beginPath(); ctx.arc(p.x, p.y, i === 0 ? 10 : 8, 0, Math.PI*2); ctx.fill();
        });

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
    window.slitherFood.push({ 
        x: Math.random() * WORLD_WIDTH, 
        y: Math.random() * WORLD_HEIGHT,
        color: colores[Math.floor(Math.random() * colores.length)]
    });
}