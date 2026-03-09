// VARIABLES GLOBALES
let modoRegistro = false;
let currentUser = "";
let usuarios = JSON.parse(localStorage.getItem('usuarios_arcade')) || {};
let canvas, ctx, scoreElement, animationId, currentGameInterval;
let currentRunningGame = ""; // 👈 NUEVO: Guarda qué juego estamos jugando

// CONTROL DE MÚSICA
function stopAllMusic() {
    const themes = ['snaketheme', 'geometrytheme', 'tetristheme', 'dinotheme'];
    themes.forEach(id => {
        const audio = document.getElementById(id);
        if (audio) {
            audio.pause();
            audio.currentTime = 0;
        }
    });
}

// LOGIN Y REGISTRO
function alternarModoAuth() {
    modoRegistro = !modoRegistro;
    document.getElementById('auth-title').innerText = modoRegistro ? "REGISTRO" : "LOGIN";
    document.getElementById('auth-main-btn').innerText = modoRegistro ? "CREAR CUENTA" : "ENTRAR AL ARCADE";
    document.getElementById('switch-text').innerText = modoRegistro ? "¿Ya tienes cuenta?" : "¿No tienes cuenta?";
    document.getElementById('switch-btn').innerText = modoRegistro ? "Inicia sesión" : "Regístrate aquí";
    document.getElementById('auth-msg').innerText = ""; 
}

function ejecutarAuth() {
    const user = document.getElementById('username').value.trim();
    const pass = document.getElementById('password').value.trim();
    const msg = document.getElementById('auth-msg');

    if (!user || !pass) { msg.style.color = "#ff4141"; msg.innerText = "Error: Campos vacíos"; return; }

    if (modoRegistro) {
        if (usuarios[user]) { msg.style.color = "#ff4141"; msg.innerText = "El usuario ya existe"; } 
        else {
            usuarios[user] = pass;
            localStorage.setItem('usuarios_arcade', JSON.stringify(usuarios));
            msg.style.color = "#00ff41"; msg.innerText = "¡Registro exitoso!";
            setTimeout(() => { alternarModoAuth(); }, 1200);
        }
    } else {
        if (usuarios[user] && usuarios[user] === pass) {
            currentUser = user;
            document.getElementById('login-overlay').classList.add('hidden');
            document.getElementById('main-app').classList.remove('hidden');
        } else {
            msg.style.color = "#ff4141"; msg.innerText = "Usuario o clave incorrectos";
        }
    }
}

// CONTROL DE JUEGOS
function startGame(gameType) {
    currentRunningGame = gameType; // 👈 Guardamos el tipo de juego activo
    
    if (animationId) cancelAnimationFrame(animationId);
    if (currentGameInterval) clearTimeout(currentGameInterval);

    document.getElementById("welcome-msg").classList.add("hidden");
    document.getElementById("char-menu").classList.add("hidden");
    document.getElementById("game-layout").classList.remove("hidden");
    document.getElementById('game-over-modal').classList.add('hidden'); // Esconder modal si estaba abierto
    
    canvas = document.getElementById("mainCanvas");
    ctx = canvas.getContext("2d");
    scoreElement = document.getElementById("score");
    scoreElement.innerText = "0";

    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    stopAllMusic();
    const theme = document.getElementById(gameType + "theme");
    if (theme) theme.play();

    switch(gameType) {
        case 'snake':
            document.getElementById("game-title").innerText = "SNAKE NEON";
            if (typeof initSnake === "function") initSnake();
            break;
        case 'geometry':
            document.getElementById("game-title").innerText = "ROBOT PARKOUR";
            if (typeof initGeometryGD === "function") initGeometryGD();
            break;
        case 'tetris':
            document.getElementById("game-title").innerText = "TETRIS CLASSIC";
            if (typeof initTetris === "function") initTetris();
            break;
    }
}

function startDino(avatar) {
    currentRunningGame = 'dino'; // 👈 Guardamos que es Dino
    if (animationId) cancelAnimationFrame(animationId);
    
    canvas = document.getElementById("mainCanvas");
    ctx = canvas.getContext("2d");
    scoreElement = document.getElementById("score");
    scoreElement.innerText = "0";

    document.getElementById("char-menu").classList.add("hidden");
    document.getElementById("game-layout").classList.remove("hidden");
    document.getElementById('game-over-modal').classList.add('hidden');
    document.getElementById("game-title").innerText = "DINO: " + avatar;
    
    stopAllMusic();
    const theme = document.getElementById("dinotheme");
    if (theme) theme.play();
    
    if (typeof initDino === "function") initDino(avatar);
}

// --- CORRECCIÓN DE GAME OVER Y MENÚS ---

function mostrarGameOver(puntos) {
    stopAllMusic();
    const modal = document.getElementById('game-over-modal');
    const scoreDisplay = document.getElementById('final-score');

    if (scoreDisplay) scoreDisplay.innerText = puntos;
    if (modal) modal.classList.remove('hidden');
}

// Botón Reintentar: Reinicia el juego actual sin recargar la página
function reintentarJuego() {
    if (currentRunningGame === 'dino') {
        // Para Dino, volvemos a mostrar el menú de personajes o el último avatar
        showDinoCharacters(); 
    } else {
        startGame(currentRunningGame);
    }
}

// Botón Volver al Menú: Limpia el canvas y vuelve a la selección de juegos
function volverAlMenu() {
    stopAllMusic();
    document.getElementById('game-over-modal').classList.add('hidden');
    document.getElementById("game-layout").classList.add("hidden");
    document.getElementById("welcome-msg").classList.remove("hidden");
    
    // Limpiar canvas
    if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
}

// Solo para el botón de salir de la cuenta
function logout() { 
    location.reload(); 
}

function showDinoCharacters() {
    document.getElementById("welcome-msg").classList.add("hidden");
    document.getElementById("game-layout").classList.add("hidden");
    document.getElementById('game-over-modal').classList.add('hidden');
    document.getElementById("char-menu").classList.remove("hidden");
}