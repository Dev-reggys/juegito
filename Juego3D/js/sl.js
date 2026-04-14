// sl.js - Private Room: Ennard Night Edition (Corazón del Juego)
let slActive = false;
let power = 100; 
let timeLimit = 360; // 6 minutos = 6 AM
let currentTime = 0;
let ennardPosition = 0; 
let nodeIndex = 0;
let currentRoute = 'rutaAzul';

let ennardMovementInterval;
let clockInterval;
let powerInterval;
let ambientInterval; 
let usage = 1; 

let doorLeftOpen = true;
let doorRightOpen = true;

// MAPA TÉCNICO: Nodos basados en tu dibujo (Azul y Verde)
const mapNodes = {
    rutaAzul: [
        { x: 0.4, y: 0.3, cam: 'CAM 07' },
        { x: 0.45, y: 0.1, cam: 'CAM 04' },
        { x: 0.5, y: -0.1, cam: 'CAM 02' },
        { x: 0.2, y: -0.25, cam: 'ATAQUE DER' }
    ],
    rutaVerde: [
        { x: -0.4, y: 0.3, cam: 'CAM 06' },
        { x: -0.35, y: 0.1, cam: 'CAM 05' },
        { x: -0.45, y: -0.1, cam: 'CAM 03' },
        { x: -0.5, y: -0.2, cam: 'CAM 01' },
        { x: -0.2, y: -0.25, cam: 'ATAQUE IZQ' }
    ]
};

function startSisterLocation() {
    console.log("Iniciando Sister Location...");
    slActive = true;
    power = 100;
    currentTime = 0;
    nodeIndex = 0;
    currentRoute = 'rutaAzul';
    doorLeftOpen = true;
    doorRightOpen = true;

    const gameContainer = document.querySelector('#game-container');
    const lobbyContainer = document.querySelector('#lobby-container');
    
    if (lobbyContainer) lobbyContainer.innerHTML = '';
    gameContainer.innerHTML = '';

    const ambientMusic = document.querySelector('#snd-ambient-sl');
    if (ambientMusic) {
        ambientMusic.volume = 0.4;
        ambientMusic.currentTime = 0;
        ambientMusic.play().catch(e => console.log("Audio Error:", e));
    }

    buildSLOffice(gameContainer);
    setupSLPlayer();
    setupKeyboardControls();
    startSLGameLoops();
}

function buildSLOffice(container) {
    console.log("Generando oficina con muros perimetrales y mapa técnico...");
    
    container.innerHTML += `
        <a-sky color="#030303"></a-sky>
        <a-entity light="type: ambient; color: #333; intensity: 0.5"></a-entity>
        
        <a-plane rotation="-90 0 0" width="20" height="20" src="#tex-suelo" material="color: #444" static-body></a-plane>

        <a-box position="0 2.5 -5" width="10" height="5" depth="0.2" src="#tex-pared-sl" material="repeat: 4 2" static-body></a-box>
        <a-box position="0 2.5 5" width="10" height="5" depth="0.2" src="#tex-pared-sl" material="repeat: 4 2" static-body></a-box>

        <a-box position="-5 4 0" width="0.2" height="2" depth="10" src="#tex-pared-sl" static-body></a-box>
        <a-box position="-5 1.5 3.5" width="0.2" height="3" depth="3" src="#tex-pared-sl" static-body></a-box>
        <a-box position="-5 1.5 -3.5" width="0.2" height="3" depth="3" src="#tex-pared-sl" static-body></a-box>

        <a-box position="5 4 0" width="0.2" height="2" depth="10" src="#tex-pared-sl" static-body></a-box>
        <a-box position="5 1.5 3.5" width="0.2" height="3" depth="3" src="#tex-pared-sl" static-body></a-box>
        <a-box position="5 1.5 -3.5" width="0.2" height="3" depth="3" src="#tex-pared-sl" static-body></a-box>

        <a-box position="0 0.8 -3.5" width="5" height="0.1" depth="2" color="#222" static-body></a-box>

        <a-entity id="monitor-central" position="0 1.4 -3.8">
            <a-box width="1.4" height="1.1" depth="0.2" color="#111"></a-box> 
            <a-plane color="#050505" width="1.2" height="0.9" position="0 0 0.11"></a-plane>

            <a-entity line="start: -0.4 0.25 0.12; end: 0.4 0.25 0.12; color: #444"></a-entity>
            <a-entity line="start: -0.4 0.25 0.12; end: -0.4 -0.1 0.12; color: #444"></a-entity>
            <a-entity line="start: 0.4 0.25 0.12; end: 0.4 -0.1 0.12; color: #444"></a-entity>
            <a-entity line="start: -0.4 -0.1 0.12; end: -0.1 -0.2 0.12; color: #444"></a-entity>
            <a-entity line="start: 0.4 -0.1 0.12; end: 0.1 -0.2 0.12; color: #444"></a-entity>

            <a-text id="power-text" value="POWER: 100%" position="-0.55 0.4 0.13" color="#00ff00" width="1.8"></a-text>
            <a-text id="usage-text" value="USAGE: |" position="-0.55 0.33 0.13" color="#00ff00" width="1.8"></a-text>
            
            <a-sphere id="ennard-dot" radius="0.025" color="white" position="-0.4 0.3 0.14" 
                      animation="property: material.opacity; from: 1; to: 0.4; dur: 500; loop: true; dir: alternate"></a-sphere>
        </a-entity>

        <a-box id="door-left" position="-4.95 5 0" width="0.1" height="4" depth="4" color="#151515" static-body></a-box>
        <a-box id="door-right" position="4.95 5 0" width="0.1" height="4" depth="4" color="#151515" static-body></a-box>

        <a-text value="Q" position="-4.8 3 0" rotation="0 90 0" color="red" width="6" align="center"></a-text>
        <a-text value="E" position="4.8 3 0" rotation="0 -90 0" color="red" width="6" align="center"></a-text>
    `;
}

function startSLGameLoops() {
    clearAllIntervals();
    
    // LOOP DE BATERÍA
    powerInterval = setInterval(updatePower, 1000);

    // LOOP DE ENNARD (Movimiento por nodos)
    ennardMovementInterval = setInterval(() => {
        if (!slActive) return;

        const route = mapNodes[currentRoute];
        nodeIndex++;

        if (nodeIndex >= route.length) {
            const attackSide = currentRoute === 'rutaAzul' ? 'right' : 'left';
            const doorClosed = attackSide === 'right' ? !doorRightOpen : !doorLeftOpen;

            if (doorClosed) {
                // Bloqueado: Rebota a la otra ruta
                currentRoute = currentRoute === 'rutaAzul' ? 'rutaVerde' : 'rutaAzul';
                nodeIndex = 0;
            } else {
                triggerEnnardJumpscare();
                return;
            }
        }

        const dot = document.querySelector('#ennard-dot');
        const pos = route[nodeIndex];
        if (dot && pos) {
            dot.setAttribute('position', `${pos.x} ${pos.y} 0.14`);
            dot.setAttribute('color', currentRoute === 'rutaAzul' ? '#00ffff' : '#00ff00');
        }
    }, 4000);

    // LOOP DE RELOJ
    clockInterval = setInterval(() => {
        currentTime++;
        const clockUI = document.querySelector('#clock-ui');
        if (clockUI) {
            let hour = Math.floor(currentTime / 60) + 12;
            if (hour > 12) hour -= 12;
            clockUI.setAttribute('value', `${hour}:00 AM`);
        }
        if (currentTime >= timeLimit) endSLNight(true);
    }, 1000);
}

function updatePower() {
    if (!slActive) return;

    let currentUsage = 1;
    if (!doorLeftOpen) currentUsage += 2;
    if (!doorRightOpen) currentUsage += 2;

    power -= (currentUsage * 0.15); 

    const pText = document.querySelector('#power-text');
    const uText = document.querySelector('#usage-text');
    
    if (pText) pText.setAttribute('value', `POWER: ${Math.max(0, Math.floor(power))}%`);
    if (uText) uText.setAttribute('value', `USAGE: ${"|".repeat(currentUsage)}`);

    if (power <= 0) {
        power = 0;
        triggerPowerOut();
    }
}

function toggleDoor(side) {
    const isLeft = side === 'left';
    // 1. Buscamos el elemento de audio en el DOM
    const sound = document.querySelector('#snd-puerta');
    
    if (isLeft) doorLeftOpen = !doorLeftOpen;
    else doorRightOpen = !doorRightOpen;

    const door = document.querySelector(`#door-${isLeft ? 'left' : 'right'}`);
    const isOpen = isLeft ? doorLeftOpen : doorRightOpen;

    // 2. Lógica de Sonido: Si el audio existe, lo reiniciamos y reproducimos
    if (sound) {
        sound.currentTime = 0; // Reinicia el sonido si se pulsa rápido
        sound.volume = 0.6;    // Ajustamos volumen para que no aturda
        sound.play().catch(e => console.log("Error al reproducir sonido de puerta:", e));
    }

    // 3. Animación (Mantenemos tu lógica intacta)
    door.setAttribute('animation', {
        property: 'position',
        to: isOpen ? `${isLeft ? -4.95 : 4.95} 5 0` : `${isLeft ? -4.95 : 4.95} 1.8 0`,
        dur: 400,
        easing: 'easeInQuad'
    });
}
function setupKeyboardControls() {
    const onKeyDown = (e) => {
        if (!slActive) return;
        if (e.key.toLowerCase() === 'q') toggleDoor('left');
        if (e.key.toLowerCase() === 'e') toggleDoor('right');
    };
    window.addEventListener('keydown', onKeyDown);
}

function setupSLPlayer() {
    const camera = document.querySelector('[camera]');
    const player = document.querySelector('#player');
    
    const oldUI = document.querySelector('#sl-ui');
    if (oldUI) oldUI.remove();

    const slUI = document.createElement('a-entity');
    slUI.setAttribute('id', 'sl-ui');
    slUI.innerHTML = `
        <a-entity light="type: point; color: #fff; intensity: 0.4; distance: 10"></a-entity>
        <a-text id="clock-ui" value="12:00 AM" position="0.7 0.5 -1" color="white" width="2" align="center"></a-text>
    `;
    camera.appendChild(slUI);
    player.setAttribute('position', '0 1.6 0');
}

function triggerPowerOut() {
    slActive = false;
    clearAllIntervals();
    document.querySelector('#game-container').innerHTML = '<a-sky color="black"></a-sky>';
    setTimeout(triggerEnnardJumpscare, 3000);
}

function triggerEnnardJumpscare() {
    slActive = false;
    clearAllIntervals();
    const gameContainer = document.querySelector('#game-container');
    gameContainer.innerHTML = `
        <a-sky color="black"></a-sky>
        <a-image src="#tex-ennard" position="0 1.6 -1" width="2.5" height="2.5"></a-image>
    `;
    const scream = document.querySelector('#snd-dano');
    if (scream) scream.play();
    setTimeout(() => { alert("GAME OVER"); location.reload(); }, 2000);
}

function endSLNight(victoria) {
    slActive = false;
    clearAllIntervals();
    if (victoria) alert("¡6 AM! Sobreviviste.");
    location.reload();
}

function clearAllIntervals() {
    clearInterval(ennardMovementInterval);
    clearInterval(clockInterval);
    clearInterval(powerInterval);
    clearInterval(ambientInterval);
}