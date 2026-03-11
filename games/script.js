/* --- VARIABLES GLOBALES DE ESTADO --- */
window.canvas = null;
window.ctx = null;
window.scoreElement = null;
window.animationId = null;
window.currentGameInterval = null;
window.currentRunningGame = ""; 
window.gameActive = false; 

let modoRegistro = false;
let currentUser = "";
let usuarios = JSON.parse(localStorage.getItem('usuarios_arcade')) || {};

// Variables de Guitar Master (PROTEGIDAS)
window.ghNotes = [];
window.ghLaneColors = ["#ff4141", "#ffea00", "#00ff41", "#00fbff"]; 
window.keyMap = { 'a': 0, 's': 1, 'd': 2, 'f': 3 };
window.keyVisualIds = ['key-a', 'key-s', 'key-d', 'key-f']; 
window.combo = 0; 
window.multiplier = 1;

/* --- INICIALIZACIÓN AL CARGAR --- */
window.addEventListener('DOMContentLoaded', () => {
    window.canvas = document.getElementById("mainCanvas");
    if (window.canvas) {
        window.ctx = window.canvas.getContext("2d");
        window.canvas.setAttribute('tabindex', '0'); 
    }
    window.scoreElement = document.getElementById("score");
});

/* --- MOTOR PRINCIPAL: START GAME --- */
function startGame(gameType) {
    // 1. Parada de emergencia de cualquier proceso activo
    window.gameActive = false;
    if (window.animationId) cancelAnimationFrame(window.animationId);
    if (window.currentGameInterval) {
        clearInterval(window.currentGameInterval);
        clearTimeout(window.currentGameInterval);
    }
    
    // Detener toda la música (INCLUYENDO EL MENÚ)
    ['snaketheme', 'geometrytheme', 'tetristheme', 'dinotheme', 'guitartheme', 'menutheme'].forEach(id => {
        const audio = document.getElementById(id);
        if (audio) { audio.pause(); audio.currentTime = 0; }
    });

    // 2. Cambio de Interfaz
    window.currentRunningGame = gameType;
    document.getElementById("welcome-msg").classList.add("hidden");
    document.getElementById("char-menu").classList.add("hidden");
    document.getElementById("game-layout").classList.remove("hidden");
    document.getElementById('game-over-modal').classList.add('hidden');
    
    const gControls = document.getElementById('guitar-controls');
    if (gControls) gControls.classList.add('hidden');

    // 3. Reset de Canvas y Score
    window.ctx.clearRect(0, 0, window.canvas.width, window.canvas.height);
    window.scoreElement.innerText = "0";
    
    // 4. Activar Foco y Motor
    window.canvas.focus();
    window.gameActive = true; 

    // Sonido del juego actual
    const theme = document.getElementById(gameType + "theme");
    if (theme) theme.play().catch(() => {});

    // 5. Lanzar el archivo .js correspondiente
    switch(gameType) {
        case 'guitar':
            if (gControls) gControls.classList.remove('hidden');
            initGuitarHero(); 
            break;
        case 'snake':
            if (typeof initSnake === "function") initSnake();
            break;
        case 'dino':
            initDino(window.selectedDino || "🦖");
            break;
        case 'geometry':
            if (typeof initGeometryGD === "function") initGeometryGD();
            break;
        case 'tetris':
            if (typeof initTetris === "function") initTetris();
            break;
    }
}

/* --- SISTEMA UNIFICADO DE CONTROLES (RECONEXIÓN TOTAL) --- */
window.onkeydown = (e) => {
    // Si no hay juego activo, ignoramos todo
    if (!window.gameActive || !window.currentRunningGame) return;

    // 1. Lógica para Guitar Hero (Letras A, S, D, F)
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
                    let currentScore = parseInt(window.scoreElement.innerText);
                    window.scoreElement.innerText = currentScore + (100 * window.multiplier);
                    window.ghNotes.splice(i, 1);
                    hit = true; 
                    break;
                }
            }
            if (!hit && e.key !== "Escape") { window.combo = 0; window.multiplier = 1; }
        }
        return; // No seguimos con las flechas si es Guitar Hero
    }

    // 2. Lógica para los demás juegos (Snake, Dino, Tetris, Geometry)
    const teclasJuego = ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " ", "w", "a", "s", "d"];
    
    // Si la tecla es una de las permitidas para jugar
    if (teclasJuego.includes(e.key) || teclasJuego.includes(e.code) || teclasJuego.includes(e.key.toLowerCase())) {
        e.preventDefault(); // Evitamos que la pantalla se mueva

        // ENVIAR SEÑAL AL MOTOR ACTIVO
        switch(window.currentRunningGame) {
            case 'snake':
                if (typeof window.moverSnake === "function") window.moverSnake(e.keyCode);
                break;
            case 'dino':
                if (typeof window.saltarDino === "function") window.saltarDino();
                break;
            case 'geometry':
                if (typeof window.saltarGeometry === "function") window.saltarGeometry();
                break;
            case 'tetris':
                if (typeof window.moverTetris === "function") window.moverTetris(e.keyCode);
                break;
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

/* --- FUNCIONES DE CIERRE Y GAME OVER --- */
function volverAlMenu() {
    window.gameActive = false;
    window.currentRunningGame = "";
    if (window.animationId) cancelAnimationFrame(window.animationId);
    if (window.currentGameInterval) clearInterval(window.currentGameInterval);
    
    // Apagar la música de los juegos
    ['snaketheme', 'geometrytheme', 'tetristheme', 'dinotheme', 'guitartheme'].forEach(id => {
        const a = document.getElementById(id); if(a) a.pause();
    });

    // ENCENDER LA MÚSICA DEL MENÚ
    const menuAudio = document.getElementById('menutheme');
    if (menuAudio) menuAudio.play().catch(() => {});

    document.getElementById("game-layout").classList.add("hidden");
    document.getElementById("char-menu").classList.add("hidden");
    document.getElementById("welcome-msg").classList.remove("hidden");
    document.getElementById('game-over-modal').classList.add('hidden');
}

function mostrarGameOver(finalScore) {
    window.gameActive = false;
    document.getElementById('game-over-modal').classList.remove('hidden');
    document.getElementById('final-score').innerText = finalScore;
}

/* --- AUXILIARES DINO --- */
function showDinoCharacters() {
    document.getElementById("welcome-msg").classList.add("hidden");
    document.getElementById("char-menu").classList.remove("hidden");
}

function startDino(sprite) {
    window.selectedDino = sprite;
    startGame('dino');
}

/* --- AUTH Y MENÚ LOOP --- */
function ejecutarAuth() {
    const user = document.getElementById('username').value.trim();
    const pass = document.getElementById('password').value.trim();
    if (!user || !pass) return;
    
    if (modoRegistro) {
        usuarios[user] = pass;
        localStorage.setItem('usuarios_arcade', JSON.stringify(usuarios));
        alert("¡Usuario registrado!");
        alternarModoAuth();
    } else {
        if (usuarios[user] === pass) {
            currentUser = user;
            document.getElementById('login-overlay').classList.add('hidden');
            document.getElementById('main-app').classList.remove('hidden');
            
            // ¡QUE SUENE LA MÚSICA DEL MENÚ AL ENTRAR!
            const menuAudio = document.getElementById('menutheme');
            if (menuAudio) menuAudio.play().catch(() => {
                console.log("El navegador requiere interacción para reproducir el audio.");
            });
            
        } else {
            alert("Usuario o contraseña incorrectos");
        }
    }
}

function alternarModoAuth() {
    modoRegistro = !modoRegistro;
    document.getElementById('auth-title').innerText = modoRegistro ? "REGISTRO" : "LOGIN";
    document.getElementById('auth-btn').innerText = modoRegistro ? "REGISTRARME" : "ENTRAR";
}

/* --- PARCHE DE ESTABILIDAD DE CONTROLES Y FOCO --- */

// Re-vincular el inicio de los juegos para forzar foco
const originalStart = startGame;
startGame = function(tipo) {
    originalStart(tipo);
    // Pequeño retraso para asegurar que el DOM esté listo en localhost antes de dar el foco
    setTimeout(() => {
        if(window.canvas) {
            window.canvas.focus();
            console.log("🎮 Foco forzado y Motor de control vinculado a: " + tipo);
        }
    }, 150); 
};

// Manejo de errores de comunicación de sub-juegos
window.addEventListener('error', (e) => {
    if (e.message.includes('window.mover') || e.message.includes('window.saltar')) {
        console.warn("⚠️ Aviso de control: Esperando a que el sub-juego inicialice sus funciones.");
        e.preventDefault();
    }
});