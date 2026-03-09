// VARIABLES GLOBALES
let modoRegistro = false;
let currentUser = "";
let usuarios = JSON.parse(localStorage.getItem('usuarios_arcade')) || {};
let canvas, ctx, scoreElement, animationId, currentGameInterval;
let currentRunningGame = ""; // Guarda el juego activo para reintentos

// CONTROL DE MÚSICA
function stopAllMusic() {
    const themes = ['snaketheme', 'geometrytheme', 'tetristheme', 'dinotheme', 'menutheme'];
    themes.forEach(id => {
        const audio = document.getElementById(id);
        if (audio) {
            audio.pause();
            audio.currentTime = 0;
        }
    });
}

function playMenuMusic() {
    const menuMusic = document.getElementById('menutheme');
    if (menuMusic) {
        menuMusic.play().catch(e => console.log("El navegador requiere interacción previa para sonar."));
    }
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

    if (!user || !pass) { 
        msg.style.color = "#ff4141"; 
        msg.innerText = "Error: Campos vacíos"; 
        return; 
    }

    if (modoRegistro) {
        if (usuarios[user]) { 
            msg.style.color = "#ff4141"; 
            msg.innerText = "El usuario ya existe"; 
        } else {
            usuarios[user] = pass;
            localStorage.setItem('usuarios_arcade', JSON.stringify(usuarios));
            msg.style.color = "#00ff41"; 
            msg.innerText = "¡Registro exitoso!";
            setTimeout(() => { alternarModoAuth(); }, 1200);
        }
    } else {
        if (usuarios[user] && usuarios[user] === pass) {
            currentUser = user;
            document.getElementById('login-overlay').classList.add('hidden');
            document.getElementById('main-app').classList.remove('hidden');
            playMenuMusic();
        } else {
            msg.style.color = "#ff4141"; 
            msg.innerText = "Usuario o clave incorrectos";
        }
    }
}

// CONTROL DE JUEGOS
function startGame(gameType) {
    currentRunningGame = gameType;
    
    if (animationId) cancelAnimationFrame(animationId);
    if (currentGameInterval) clearInterval(currentGameInterval);

    document.getElementById("welcome-msg").classList.add("hidden");
    document.getElementById("char-menu").classList.add("hidden");
    document.getElementById("game-layout").classList.remove("hidden");
    document.getElementById('game-over-modal').classList.add('hidden');
    
    canvas = document.getElementById("mainCanvas");
    ctx = canvas.getContext("2d");
    scoreElement = document.getElementById("score");
    scoreElement.innerText = "0";

    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    stopAllMusic();
    const theme = document.getElementById(gameType + "theme");
    if (theme) theme.play();

    // Iniciar el script específico del juego
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

// DINO RUN
function showDinoCharacters() {
    document.getElementById("welcome-msg").classList.add("hidden");
    document.getElementById("game-layout").classList.add("hidden");
    document.getElementById("char-menu").classList.remove("hidden");
    document.getElementById('game-over-modal').classList.add('hidden');
}

function startDino(avatar) {
    currentRunningGame = 'dino';
    if (animationId) cancelAnimationFrame(animationId);
    
    canvas = document.getElementById("mainCanvas");
    ctx = canvas.getContext("2d");
    scoreElement = document.getElementById("score");
    scoreElement.innerText = "0";

    document.getElementById("char-menu").classList.add("hidden");
    document.getElementById("game-layout").classList.remove("hidden");
    document.getElementById("game-title").innerText = "DINO: " + avatar;
    
    stopAllMusic();
    const theme = document.getElementById("dinotheme");
    if (theme) theme.play();
    
    if (typeof initDino === "function") initDino(avatar);
}

// SISTEMA DE GAME OVER
function mostrarGameOver(puntos) {
    stopAllMusic();
    const modal = document.getElementById('game-over-modal');
    const scoreDisplay = document.getElementById('final-score');

    if (scoreDisplay) scoreDisplay.innerText = puntos;
    if (modal) modal.classList.remove('hidden');
}

function reintentarJuego() {
    document.getElementById('game-over-modal').classList.add('hidden');
    if (currentRunningGame === 'dino') {
        showDinoCharacters();
    } else if (currentRunningGame) {
        startGame(currentRunningGame);
    }
}

function volverAlMenu() {
    stopAllMusic();
    document.getElementById('game-over-modal').classList.add('hidden');
    document.getElementById("game-layout").classList.add("hidden");
    document.getElementById("char-menu").classList.add("hidden");
    document.getElementById("welcome-msg").classList.remove("hidden");
    playMenuMusic();
}

function logout() { 
    location.reload(); 
}