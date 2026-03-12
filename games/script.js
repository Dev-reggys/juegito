/* --- VARIABLES GLOBALES DE ESTADO --- */
window.canvas = null;
window.ctx = null;
window.scoreElement = null;
window.animationId = null;
window.currentGameInterval = null;
window.currentRunningGame = ""; 
window.gameActive = false; 

// MOUSE PARA SLITHER
window.mouseX = 200;
window.mouseY = 200;

let modoRegistro = false;
let currentUser = "";
let usuarios = JSON.parse(localStorage.getItem('usuarios_arcade')) || {};

// Variables de Guitar Master
window.ghNotes = [];
window.ghLaneColors = ["#ff4141", "#ffea00", "#00ff41", "#00fbff"]; 
window.keyMap = { 'a': 0, 's': 1, 'd': 2, 'f': 3 };
window.keyVisualIds = ['key-a', 'key-s', 'key-d', 'key-f']; 
window.combo = 0; 
window.multiplier = 1;

/* --- AUDIO --- */
window.audioTracks = {
    menutheme: new Audio('./src/menuLoop.mp3'),
    guitartheme: new Audio('./src/guitartheme.mp3'),
    snaketheme: new Audio('./src/snaketheme.mp3'),
    dinotheme: new Audio('./src/dinotheme.mp3'),
    geometrytheme: new Audio('./src/geometrytheme.mp3'),
    tetristheme: new Audio('./src/tetristheme.mp3'),
    slithertheme: new Audio('./src/slithertheme.mp3')
};

Object.values(window.audioTracks).forEach(track => { track.loop = true; });

/* --- INICIALIZACIÓN --- */
window.addEventListener('DOMContentLoaded', () => {
    window.canvas = document.getElementById("mainCanvas");
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
    window.scoreElement = document.getElementById("score");
    
    // Inicializar ranking
    if(!localStorage.getItem('ranking_v2_initialized')) {
        localStorage.removeItem('arcade_ranking');
        localStorage.setItem('ranking_v2_initialized', 'true');
    }
    mostrarRanking();
});

/* --- MOTOR PRINCIPAL --- */
function startGame(gameType) {
    window.gameActive = false;
    if (window.animationId) cancelAnimationFrame(window.animationId);
    if (window.currentGameInterval) clearInterval(window.currentGameInterval);
    
    Object.values(window.audioTracks).forEach(audio => {
        audio.pause();
        audio.currentTime = 0;
    });

    window.currentRunningGame = gameType;
    document.getElementById("welcome-msg").classList.add("hidden");
    document.getElementById("char-menu").classList.add("hidden");
    document.getElementById("game-layout").classList.remove("hidden");
    document.getElementById('game-over-modal').classList.add('hidden');
    
    const gControls = document.getElementById('guitar-controls');
    if (gControls) gControls.classList.add('hidden');

    window.ctx.clearRect(0, 0, window.canvas.width, window.canvas.height);
    window.scoreElement.innerText = "0";
    
    setTimeout(() => { if(window.canvas) window.canvas.focus(); }, 150);
    window.gameActive = true; 

    const theme = window.audioTracks[gameType + "theme"];
    if (theme) theme.play().catch(() => {});

    switch(gameType) {
        case 'guitar':
            if (gControls) gControls.classList.remove('hidden');
            initGuitarHero(); 
            break;
        case 'snake': if (typeof initSnake === "function") initSnake(); break;
        case 'slither': if (typeof initSlither === "function") initSlither(); break;
        case 'dino': initDino(window.selectedDino || "🦖"); break;
        case 'geometry': if (typeof initGeometryGD === "function") initGeometryGD(); break;
        case 'tetris': if (typeof initTetris === "function") initTetris(); break;
    }
}

/* --- CONTROLES --- */
window.onkeydown = (e) => {
    if (!window.gameActive || !window.currentRunningGame) return;

    if (window.currentRunningGame === 'guitar') {
        const lane = window.keyMap[e.key.toLowerCase()];
        if (lane !== undefined) {
            const vKey = document.getElementById(window.keyVisualIds[lane]);
            if (vKey) vKey.classList.add('active');
            let hit = false;
            for (let i = 0; i < window.ghNotes.length; i++) {
                let n = window.ghNotes[i];
                if (n.lane === lane && n.y > 310 && n.y < 390) {
                    window.combo++;
                    window.multiplier = window.combo > 15 ? 4 : (window.combo > 8 ? 2 : 1);
                    window.scoreElement.innerText = parseInt(window.scoreElement.innerText) + (100 * window.multiplier);
                    window.ghNotes.splice(i, 1);
                    hit = true; break;
                }
            }
            if (!hit && e.key !== "Escape") { window.combo = 0; window.multiplier = 1; }
        }
        return; 
    }

    const teclasJuego = ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " ", "w", "a", "s", "d"];
    if (teclasJuego.includes(e.key) || teclasJuego.includes(e.code)) {
        e.preventDefault();
        switch(window.currentRunningGame) {
            case 'snake': if (window.moverSnake) window.moverSnake(e.keyCode); break;
            case 'tetris': if (window.moverTetris) window.moverTetris(e.keyCode); break;
        }
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

/* --- NAVEGACIÓN Y RANKING --- */
function volverAlMenu() {
    window.gameActive = false;
    window.currentRunningGame = "";
    if (window.animationId) cancelAnimationFrame(window.animationId);
    Object.values(window.audioTracks).forEach(audio => { audio.pause(); audio.currentTime = 0; });
    const menuAudio = window.audioTracks['menutheme'];
    if (menuAudio) menuAudio.play().catch(() => {});
    document.getElementById("game-layout").classList.add("hidden");
    document.getElementById("char-menu").classList.add("hidden");
    document.getElementById("welcome-msg").classList.remove("hidden");
    document.getElementById('game-over-modal').classList.add('hidden');
}
function mostrarGameOver(finalScore) {
    window.gameActive = false;
    const modal = document.getElementById('game-over-modal');
    modal.classList.remove('hidden');
    
    // El puntaje final
    document.getElementById('final-score').innerText = finalScore;

    // Aseguramos que los botones internos tengan la clase correcta si no la tienen en el HTML
    const botones = modal.querySelectorAll('button');
    botones.forEach(btn => {
        if (!btn.classList.contains('btn-neon')) {
            btn.className = 'btn-neon';
        }
    });

    if (parseFloat(finalScore) > 0) {
        actualizarRanking(currentUser || "Anónimo", finalScore);
    }
}

function actualizarRanking(nombre, valor) {
    let ranking = JSON.parse(localStorage.getItem('arcade_ranking')) || [];
    let valorNumerico = parseFloat(valor);
    let esGeometry = (window.currentRunningGame === 'geometry');
    if (esGeometry && valorNumerico > 100) valorNumerico = 100;

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
    ranking = ranking.slice(0, 10);
    localStorage.setItem('arcade_ranking', JSON.stringify(ranking));
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

/* --- LOGOUT (CORREGIDO) --- */
function logout() {
    window.gameActive = false;
    if (window.animationId) cancelAnimationFrame(window.animationId);
    Object.values(window.audioTracks).forEach(a => { a.pause(); a.currentTime = 0; });
    document.getElementById('main-app').classList.add('hidden');
    document.getElementById('login-overlay').classList.remove('hidden');
    currentUser = "";
}

/* --- AUTH --- */
function ejecutarAuth() {
    const user = document.getElementById('username').value.trim();
    const pass = document.getElementById('password').value.trim();
    if (!user || !pass) return;
    if (modoRegistro) {
        usuarios[user] = pass;
        localStorage.setItem('usuarios_arcade', JSON.stringify(usuarios));
        alert("¡Registrado!"); alternarModoAuth();
    } else {
        if (usuarios[user] === pass) {
            currentUser = user;
            document.getElementById('login-overlay').classList.add('hidden');
            document.getElementById('main-app').classList.remove('hidden');
            if (window.audioTracks['menutheme']) window.audioTracks['menutheme'].play();
        } else { alert("Datos incorrectos"); }
    }
}

function alternarModoAuth() {
    modoRegistro = !modoRegistro;
    document.getElementById('auth-title').innerText = modoRegistro ? "REGISTRO" : "LOGIN";
}

function showDinoCharacters() {
    document.getElementById("welcome-msg").classList.add("hidden");
    document.getElementById("char-menu").classList.remove("hidden");
}

function startDino(sprite) {
    window.selectedDino = sprite;
    startGame('dino');
}