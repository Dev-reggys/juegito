/* --- 1. VARIABLES GLOBALES DE ESTADO --- */
window.canvas = null;
window.ctx = null;
window.scoreElement = null;
window.livesContainer = null; 
window.animationId = null;
window.currentGameInterval = null;
window.currentRunningGame = ""; 
window.gameActive = false; 
window.lives = 3; 
window.isMuted = false;

window.mouseX = 200;
window.mouseY = 200;

let modoRegistro = false;
let currentUser = "";
let usuarios = JSON.parse(localStorage.getItem('usuarios_arcade')) || {};

window.ghNotes = [];
window.ghLaneColors = ["#ff4141", "#ffea00", "#00ff41", "#00fbff"]; 
window.keyMap = { 'a': 0, 's': 1, 'd': 2, 'f': 3 };
window.keyVisualIds = ['key-a', 'key-s', 'key-d', 'key-f']; 
window.combo = 0; 
window.multiplier = 1;

/* --- 2. VINCULACIÓN DE AUDIO --- */
window.audioTracks = {};

function vincularAudios() {
    const ids = ['menutheme', 'guitartheme', 'snaketheme', 'dinotheme', 'geometrytheme', 'tetristheme', 'slithertheme'];
    ids.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            window.audioTracks[id] = el;
            el.loop = true;
        }
    });
}

/* --- 3. SISTEMA DE VIDAS MAESTRO --- */
window.Vidas = function() {
    if (!window.gameActive) return;
    window.lives--; 
    actualizarInterfazVidas(); 
    if (window.canvas) {
        window.canvas.style.filter = "invert(1) sepia(1)";
        setTimeout(() => { window.canvas.style.filter = "none"; }, 150);
    }
    if (window.lives <= 0) {
        window.gameActive = false;
        mostrarGameOver(window.scoreElement.innerText);
    }
};

function actualizarInterfazVidas() {
    const container = document.getElementById("lives");
    if (container) {
        let corazones = "";
        for (let i = 0; i < window.lives; i++) { corazones += "❤️"; }
        container.innerText = corazones || "💀";
    }
}

/* --- 4. INICIALIZACIÓN --- */
window.addEventListener('DOMContentLoaded', () => {
    window.canvas = document.getElementById("mainCanvas");
    window.scoreElement = document.getElementById("score");
    window.livesContainer = document.getElementById("lives"); 
    vincularAudios();
    const btnMute = document.getElementById('btn-mute');
    const muteIcon = document.getElementById('mute-icon');
    if (btnMute) {
        btnMute.onclick = () => {
            window.isMuted = !window.isMuted;
            Object.values(window.audioTracks).forEach(track => { track.muted = window.isMuted; });
            muteIcon.innerText = window.isMuted ? '🔇' : '🔊';
            btnMute.style.opacity = window.isMuted ? "0.5" : "1";
        };
    }
    if (window.canvas) {
        window.ctx = window.canvas.getContext("2d");
        window.canvas.setAttribute('tabindex', '0'); 
        window.canvas.addEventListener('mousemove', (e) => {
            if (window.currentRunningGame === 'slither') {
                const rect = window.canvas.getBoundingClientRect();
                window.mouseX = e.clientX - rect.left;
                window.mouseY = e.clientY - rect.top;
            }
        });
    }
    mostrarRanking();
});

/* --- 5. MOTOR PRINCIPAL --- */
function startGame(gameType) {
    window.gameActive = false;
    if (window.animationId) cancelAnimationFrame(window.animationId);
    if (window.currentGameInterval) clearInterval(window.currentGameInterval);
    Object.values(window.audioTracks).forEach(audio => { audio.pause(); audio.currentTime = 0; });
    window.lives = 3;
    actualizarInterfazVidas();
    window.currentRunningGame = gameType;
    window.scoreElement.innerText = "0";
    document.getElementById("welcome-msg").classList.add("hidden");
    document.getElementById("char-menu").classList.add("hidden");
    document.getElementById("game-layout").classList.remove("hidden");
    document.getElementById('game-over-modal').classList.add('hidden');
    const gControls = document.getElementById('guitar-controls');
    if (gControls) gControls.classList.add('hidden');
    window.ctx.clearRect(0, 0, window.canvas.width, window.canvas.height);
    setTimeout(() => { if(window.canvas) window.canvas.focus(); }, 150);
    window.gameActive = true; 
    const theme = window.audioTracks[gameType + "theme"];
    if (theme) {
        theme.muted = window.isMuted;
        theme.play().catch(e => console.warn("Audio bloqueado."));
    }
    switch(gameType) {
        case 'guitar': if (gControls) gControls.classList.remove('hidden'); initGuitarHero(); break;
        case 'snake': initSnake(); break;
        case 'slither': initSlither(); break;
        case 'dino': initDino(window.selectedDino || "Rex"); break;
        case 'geometry': initGeometryGD(); break;
        case 'tetris': initTetris(); break;
    }
}

/* --- 6. CONTROLES GENERALES --- */
window.onkeydown = (e) => {
    if (!window.gameActive || !window.currentRunningGame) return;
    if (window.currentRunningGame === 'guitar') {
        const lane = window.keyMap[e.key.toLowerCase()];
        if (lane !== undefined) {
            const vKey = document.getElementById(window.keyVisualIds[lane]);
            if (vKey) vKey.classList.add('active');
            window.guitarHit(lane);
        }
    }
    const teclasJuego = ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " ", "w", "a", "s", "d"];
    if (teclasJuego.includes(e.key) || teclasJuego.includes(e.code)) {
        e.preventDefault();
        if (window.currentRunningGame === 'snake' && window.moverSnake) window.moverSnake(e.keyCode);
        if (window.currentRunningGame === 'tetris' && window.moverTetris) window.moverTetris(e.keyCode);
    }
};

window.onkeyup = (e) => {
    if (window.currentRunningGame === 'guitar') {
        const lane = window.keyMap[e.key.toLowerCase()];
        if (lane !== undefined) {
            const vKey = document.getElementById(window.keyVisualIds[lane]);
            if (vKey) vKey.classList.remove('active');
        }
    }
};

/* --- 7. NAVEGACIÓN Y RANKING --- */
function volverAlMenu() {
    window.gameActive = false;
    window.currentRunningGame = "";
    if (window.animationId) cancelAnimationFrame(window.animationId);
    if (window.currentGameInterval) clearInterval(window.currentGameInterval);
    Object.values(window.audioTracks).forEach(audio => { audio.pause(); audio.currentTime = 0; });
    if (window.audioTracks['menutheme']) {
        window.audioTracks['menutheme'].muted = window.isMuted;
        window.audioTracks['menutheme'].play();
    }
    document.getElementById("game-layout").classList.add("hidden");
    document.getElementById("char-menu").classList.add("hidden");
    document.getElementById("welcome-msg").classList.remove("hidden");
    document.getElementById('game-over-modal').classList.add('hidden');
}

function mostrarGameOver(finalScore) {
    window.gameActive = false;
    const modal = document.getElementById('game-over-modal');
    modal.classList.remove('hidden');
    document.getElementById('final-score').innerText = finalScore;
    if (parseFloat(finalScore) > 0) { actualizarRanking(currentUser || "Anónimo", finalScore); }
}

function actualizarRanking(nombre, valor) {
    let ranking = JSON.parse(localStorage.getItem('arcade_ranking')) || [];
    let valorNumerico = parseFloat(valor);
    let esGeometry = (window.currentRunningGame === 'geometry');
    const idx = ranking.findIndex(entry => entry.nombre === nombre);
    if (idx !== -1) {
        if (valorNumerico > ranking[idx].valor) {
            ranking[idx].valor = valorNumerico;
            ranking[idx].juego = window.currentRunningGame;
            ranking[idx].display = esGeometry ? valorNumerico + "%" : valorNumerico;
        }
    } else {
        ranking.push({ nombre, valor: valorNumerico, juego: window.currentRunningGame, display: esGeometry ? valorNumerico + "%" : valorNumerico });
    }
    ranking.sort((a, b) => b.valor - a.valor);
    localStorage.setItem('arcade_ranking', JSON.stringify(ranking.slice(0, 10)));
    mostrarRanking();
}

function mostrarRanking() {
    const lista = document.getElementById('ranking-list');
    const ranking = JSON.parse(localStorage.getItem('arcade_ranking')) || [];
    if (!lista) return;
    lista.innerHTML = ranking.map((entry, index) => `
        <li class="ranking-item" style="list-style:none; color:${index===0?'#ffea00':'#eee'}">
            <span style="color:#00fbff">#${index+1}</span> ${entry.nombre} - <b>${entry.display}</b> 
            <small style="color:#666">[${entry.juego.toUpperCase()}]</small>
        </li>
    `).join('');
}

/* --- 8. AUTH Y LOGIN --- */
function ejecutarAuth() {
    const user = document.getElementById('username').value.trim();
    const pass = document.getElementById('password').value.trim();
    if (!user || !pass) return;
    if (modoRegistro) {
        usuarios[user] = pass;
        localStorage.setItem('usuarios_arcade', JSON.stringify(usuarios));
        alert("¡Usuario Registrado!");
        alternarModoAuth();
    } else {
        if (usuarios[user] === pass) {
            currentUser = user;
            document.getElementById('login-overlay').classList.add('hidden');
            document.getElementById('main-app').classList.remove('hidden');
            if (window.audioTracks['menutheme']) {
                window.audioTracks['menutheme'].muted = window.isMuted;
                window.audioTracks['menutheme'].play();
            }
        } else { alert("Credenciales Incorrectas"); }
    }
}

function alternarModoAuth() {
    modoRegistro = !modoRegistro;
    document.getElementById('auth-title').innerText = modoRegistro ? "REGISTRO" : "LOGIN";
}

function logout() { location.reload(); }
function showDinoCharacters() {
    document.getElementById("welcome-msg").classList.add("hidden");
    document.getElementById("char-menu").classList.remove("hidden");
}
function startDino(sprite) { window.selectedDino = sprite; startGame('dino'); }

/* --- 9. MOTORES DE JUEGO --- */

function initSnake() {
    const box = 20;
    let snake = [{ x: 10 * box, y: 10 * box }];
    let food = { x: 5 * box, y: 5 * box };
    let d = "RIGHT";
    window.moverSnake = (keyCode) => {
        if (keyCode == 37 && d != "RIGHT") d = "LEFT";
        else if (keyCode == 38 && d != "DOWN") d = "UP";
        else if (keyCode == 39 && d != "LEFT") d = "RIGHT";
        else if (keyCode == 40 && d != "UP") d = "DOWN";
    };
    window.currentGameInterval = setInterval(() => {
        if (!window.gameActive) return;
        window.ctx.fillStyle = "black";
        window.ctx.fillRect(0, 0, 400, 450);
        let snakeX = snake[0].x;
        let snakeY = snake[0].y;
        if (d === "LEFT") snakeX -= box;
        if (d === "UP") snakeY -= box;
        if (d === "RIGHT") snakeX += box;
        if (d === "DOWN") snakeY += box;
        if (snakeX === food.x && snakeY === food.y) {
            window.scoreElement.innerText = parseInt(window.scoreElement.innerText) + 1;
            food = { x: Math.floor(Math.random() * 19) * box, y: Math.floor(Math.random() * 19) * box };
        } else { snake.pop(); }
        let newHead = { x: snakeX, y: snakeY };
        if (snakeX < 0 || snakeX >= 400 || snakeY < 0 || snakeY >= 450 || checkCollision(newHead, snake)) {
            window.Vidas();
            if (window.lives > 0) { snake = [{ x: 10 * box, y: 10 * box }]; d = "RIGHT"; }
            else { clearInterval(window.currentGameInterval); }
            return;
        }
        snake.unshift(newHead);
        for (let i = 0; i < snake.length; i++) {
            window.ctx.fillStyle = (i === 0) ? "white" : "#2ecc71";
            window.ctx.fillRect(snake[i].x, snake[i].y, box, box);
        }
        window.ctx.fillStyle = "red";
        window.ctx.fillRect(food.x, food.y, box, box);
    }, 100);
    function checkCollision(head, array) {
        for (let i = 0; i < array.length; i++) { if (head.x === array[i].x && head.y === array[i].y) return true; }
        return false;
    }
}

function initDino(charEmoji) {
    let dino = { x: 50, y: 330, w: 35, h: 35, dy: 0, gravity: 0.7, grounded: false, emoji: charEmoji, invulnerable: false };
    let obstacles = [];
    let gameSpeed = 6;
    window.canvas.onmousedown = () => { if(dino.grounded) { dino.dy = -12; dino.grounded = false; } };
    function loop() {
        if (!window.gameActive || window.currentRunningGame !== 'dino') return;
        window.ctx.clearRect(0, 0, 400, 450);
        dino.dy += dino.gravity;
        dino.y += dino.dy;
        if (dino.y > 330) { dino.y = 330; dino.dy = 0; dino.grounded = true; }
        if (Math.random() < 0.02) { obstacles.push({ x: 450, y: 340, w: 25, h: 30, emoji: "🌵" }); }
        for (let i = obstacles.length - 1; i >= 0; i--) {
            let o = obstacles[i];
            o.x -= gameSpeed;
            window.ctx.font = "30px Arial";
            window.ctx.fillText(o.emoji, o.x, o.y);
            if (!dino.invulnerable && dino.x < o.x + 20 && dino.x + 30 > o.x && dino.y + 35 > o.y) {
                window.Vidas();
                if (window.lives > 0) {
                    dino.invulnerable = true;
                    obstacles = []; 
                    setTimeout(() => { dino.invulnerable = false; }, 1000);
                } else { return; }
            }
            if (o.x < -40) {
                obstacles.splice(i, 1);
                window.scoreElement.innerText = parseInt(window.scoreElement.innerText) + 10;
                gameSpeed += 0.05;
            }
        }
        if (!dino.invulnerable || Math.floor(Date.now() / 100) % 2) {
            window.ctx.font = "40px Arial";
            window.ctx.fillText(dino.emoji, dino.x, dino.y + 10);
        }
        window.animationId = requestAnimationFrame(loop);
    }
    loop();
}

function initGuitarHero() {
    window.ghNotes = []; window.combo = 0; window.multiplier = 1;
    let lastNoteTime = 0; let ghInvulnerable = false;
    window.guitarHit = function(lane) {
        if (!window.gameActive) return;
        let hitAreaY = 380; let margin = 45; let found = false;
        for (let i = 0; i < window.ghNotes.length; i++) {
            let n = window.ghNotes[i];
            if (n.lane === lane && Math.abs(n.y - hitAreaY) < margin) {
                window.ghNotes.splice(i, 1);
                window.combo++;
                window.multiplier = window.combo > 20 ? 4 : window.combo > 10 ? 2 : 1;
                window.scoreElement.innerText = parseInt(window.scoreElement.innerText) + (10 * window.multiplier);
                found = true; break;
            }
        }
        if (!found) { window.combo = 0; window.multiplier = 1; }
    };
    function loop() {
        if (!window.gameActive || window.currentRunningGame !== 'guitar') return;
        const now = Date.now();
        if (now - lastNoteTime > 500) {
            window.ghNotes.push({ lane: Math.floor(Math.random() * 4), y: -50 });
            lastNoteTime = now;
        }
        window.ctx.fillStyle = "#080808"; 
        window.ctx.fillRect(0, 0, 400, 450);
        for(let i=0; i<4; i++) {
            window.ctx.strokeStyle = window.ghLaneColors[i];
            window.ctx.lineWidth = 3;
            window.ctx.beginPath(); window.ctx.arc(50 + (i * 100), 380, 22, 0, Math.PI * 2); window.ctx.stroke();
        }
        for (let i = window.ghNotes.length - 1; i >= 0; i--) {
            let n = window.ghNotes[i];
            n.y += 5; 
            window.ctx.fillStyle = window.ghLaneColors[n.lane];
            window.ctx.beginPath(); window.ctx.arc(50 + (n.lane * 100), n.y, 18, 0, Math.PI * 2); window.ctx.fill();
            if (n.y > 430) {
                window.ghNotes.splice(i, 1);
                window.combo = 0; window.multiplier = 1;
                if (!ghInvulnerable) {
                    window.Vidas();
                    if (window.lives > 0) { ghInvulnerable = true; setTimeout(() => { ghInvulnerable = false; }, 1200); }
                }
            }
        }
        window.ctx.fillStyle = "white"; window.ctx.font = "bold 20px Courier New";
        window.ctx.fillText(`COMBO: ${window.combo}`, 20, 35);
        window.animationId = requestAnimationFrame(loop);
    }
    loop();
}

function initSlither() {
    if (window.animationId) cancelAnimationFrame(window.animationId);
    let snakeHead = { x: 200, y: 200, invulnerable: false, radio: 12 };
    let bots = [];
    for(let b=0; b<7; b++) { 
        bots.push({ x: Math.random() * 400, y: Math.random() * 450, vx: (Math.random() - 0.5) * 4, vy: (Math.random() - 0.5) * 4 }); 
    }
    function loop() {
        if (!window.gameActive || window.currentRunningGame !== 'slither') return;
        window.ctx.fillStyle = "#0a0a0a";
        window.ctx.fillRect(0, 0, 400, 450);
        snakeHead.x += (window.mouseX - snakeHead.x) * 0.1;
        snakeHead.y += (window.mouseY - snakeHead.y) * 0.1;
        if (!snakeHead.invulnerable || Math.floor(Date.now() / 100) % 2) {
            window.ctx.fillStyle = "#00fbff";
            window.ctx.beginPath(); window.ctx.arc(snakeHead.x, snakeHead.y, snakeHead.radio, 0, Math.PI * 2); window.ctx.fill();
        }
        bots.forEach(bot => {
            bot.x += bot.vx; bot.y += bot.vy;
            if(bot.x < 0 || bot.x > 400) bot.vx *= -1;
            if(bot.y < 0 || bot.y > 450) bot.vy *= -1;
            window.ctx.fillStyle = "red";
            window.ctx.beginPath(); window.ctx.arc(bot.x, bot.y, 10, 0, Math.PI * 2); window.ctx.fill();
            let dist = Math.sqrt((snakeHead.x - bot.x)**2 + (snakeHead.y - bot.y)**2);
            if(!snakeHead.invulnerable && dist < 22) {
                window.Vidas();
                if(window.lives > 0) {
                    snakeHead.invulnerable = true; bot.x = -500;
                    setTimeout(() => { snakeHead.invulnerable = false; }, 1500);
                }
            }
        });
        window.animationId = requestAnimationFrame(loop);
    }
    loop();
}

function initTetris() {
    const box = 20; const rows = 450 / box;
    let player = { pos: { x: 4, y: 0 } };
    window.moverTetris = (k) => { if(k==37) player.pos.x--; if(k==39) player.pos.x++; if(k==40) player.pos.y++; };
    window.currentGameInterval = setInterval(() => {
        if(!window.gameActive) return;
        window.ctx.fillStyle = "black"; window.ctx.fillRect(0,0,400,450);
        player.pos.y++;
        if(player.pos.y >= rows) { window.Vidas(); player.pos.y = 0; player.pos.x = 4; }
        window.ctx.fillStyle = "orange"; window.ctx.fillRect(player.pos.x * box, player.pos.y * box, box, box);
    }, 500);
}

function initGeometryGD() {
    if (window.animationId) cancelAnimationFrame(window.animationId);
    let player = { x: 100, y: 355, w: 25, h: 25, vY: 0, vX: 6, ground: true };
    const gravity = 0.8; const jumpForce = -12; const groundY = 380;
    let isHoldingJump = false; let gdInvulnerable = false;
    window.saltarGeometry = () => { if (window.gameActive) isHoldingJump = true; };
    window.canvas.onmousedown = () => { if (window.currentRunningGame === 'geometry') isHoldingJump = true; };
    window.canvas.onmouseup = () => { isHoldingJump = false; };
    let obstacles = [];
    function buildLevel() {
        let layout = [{t:'s', x: 500}, {t:'s', x: 900}, {t:'b', x: 1700, y: 350}, {t:'s', x: 2300}, {t:'b', x: 2800, y: 350}];
        let currentX = 3500; const targetX = 44000;
        const patterns = [(x) => [{t:'b', x: x, y: 310}, {t:'s', x: x+30}], (x) => [{t:'s', x: x}, {t:'s', x: x+350}]];
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
        if (isHoldingJump && player.ground) { player.vY = jumpForce; player.ground = false; }
        player.vY += gravity; player.x += player.vX; player.y += player.vY;
        let pBottom = player.y + player.h; let pRight = player.x + player.w;
        player.ground = false; let onBlock = false;
        for (let obs of obstacles) {
            if (pRight > obs.x + 5 && player.x < obs.x + obs.w - 5) {
                let hit = (pBottom > obs.y + 10 && player.y < obs.y + obs.h);
                if (hit && !gdInvulnerable) {
                    window.Vidas();
                    if (window.lives > 0) { gdInvulnerable = true; player.vY = -8; setTimeout(() => { gdInvulnerable = false; }, 1500); }
                    else return;
                }
                if (obs.type === 'b' && pBottom >= obs.y && pBottom <= obs.y + 20 && player.vY >= 0) {
                    player.y = obs.y - player.h; player.vY = 0; player.ground = true; onBlock = true;
                }
            }
        }
        if (!onBlock && pBottom >= groundY) { player.y = groundY - player.h; player.vY = 0; player.ground = true; }
        window.ctx.fillStyle = "#001b21"; window.ctx.fillRect(0, 0, 400, 450);
        window.ctx.save(); window.ctx.translate(-player.x + 150, 0);
        window.ctx.strokeStyle = "#00ff41"; window.ctx.beginPath();
        window.ctx.moveTo(player.x - 200, groundY); window.ctx.lineTo(player.x + 800, groundY); window.ctx.stroke();
        obstacles.forEach(obs => {
            window.ctx.fillStyle = obs.type === 'b' ? "#00ff41" : "#ff4141";
            window.ctx.fillRect(obs.x, obs.y, obs.w, obs.h);
        });
        if (!gdInvulnerable || Math.floor(Date.now() / 150) % 2) {
            window.ctx.fillStyle = "#00ff41"; window.ctx.fillRect(player.x, player.y, player.w, player.h);
        }
        window.ctx.restore();
        let progreso = Math.min(player.x / 45000, 1);
        window.ctx.fillStyle = "gray"; window.ctx.fillRect(50, 20, 300, 10);
        window.ctx.fillStyle = "#00ff41"; window.ctx.fillRect(50, 20, 300 * progreso, 10);
        if (player.x > 45000) { window.gameActive = false; mostrarGameOver("100%"); return; }
        window.animationId = requestAnimationFrame(loop);
    }
    buildLevel(); loop();
}

/* --- 10. SISTEMA DE JUMPSCARE (SIN LOOP) --- */

function activarJumpscare() {
    let jumpVideo = document.querySelector('video.nyan-cat');

    if (jumpVideo) {
        // Pausar música de fondo
        Object.values(window.audioTracks).forEach(t => t.pause());

        // CONFIGURACIÓN CLAVE: Desactivamos el loop por código
        jumpVideo.loop = false; 
        
        // Estilos para pantalla completa
        jumpVideo.style.cssText = `
            display: block !important;
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            width: 100vw !important;
            height: 100vh !important;
            background: black !important;
            z-index: 999999 !important;
            object-fit: cover !important;
        `;

        jumpVideo.muted = false;
        jumpVideo.volume = 1.0;
        jumpVideo.currentTime = 0;

        jumpVideo.play().catch(error => {
            console.error("Error al reproducir:", error);
        });

        // Al terminar (gracias a que quitamos el loop), se limpia solo
        jumpVideo.onended = () => {
            jumpVideo.style.display = 'none';
            // Volver a poner el video en mute por si acaso
            jumpVideo.muted = true; 
            
            // Reanudar música de menú si no hay juego activo
            if(!window.gameActive && window.audioTracks['menutheme']) {
                window.audioTracks['menutheme'].play();
            }
        };
    }
}

/* --- 11. DETECTOR DE ACTIVACIÓN --- */

document.addEventListener('click', (e) => {
    // Detecta el clic en el gato o en el video oculto
    if (e.target.classList.contains('nyan-cat') || e.target.classList.contains('welcome-gif')) {
        activarJumpscare();
    }
});

// Ocultar al cargar
document.addEventListener('DOMContentLoaded', () => {
    const v = document.querySelector('video.nyan-cat');
    if (v) {
        v.style.display = 'none';
        v.loop = false; // Aseguramos desde el inicio que no haya loop
    }
});