let laberintoActive = false;
let orbsCollected = 0;
let hunterInterval;

function startLaberinto() {
    console.log("Iniciando El Laberinto de las Sombras...");
    if (typeof shooterActive !== 'undefined') shooterActive = false;
    laberintoActive = true;
    orbsCollected = 0;

    const gameContainer = document.querySelector('#game-container');
    const lobbyContainer = document.querySelector('#lobby-container');

    // Limpiar el lobby
    if (lobbyContainer) lobbyContainer.innerHTML = '';
    gameContainer.innerHTML = '';

    // Ocultar arma si existe
    const gun = document.querySelector('#weapon');
    if (gun) gun.setAttribute('visible', 'false');

    // Cielo negro (oscuridad) y suelo (¡Ahora con static-body!)
    gameContainer.innerHTML += `
        <a-sky color="#000000"></a-sky> 
        <a-plane src="#tex-suelo" rotation="-90 0 0" width="50" height="50" static-body material="repeat: 10 10; shader: flat; color: #333"></a-plane>
    `;

    // Configurar linterna y UI en la cámara
    const camera = document.querySelector('[camera]');
    const oldUI = document.querySelector('#laberinto-ui');
    if (oldUI) oldUI.remove();

    const laberintoUI = document.createElement('a-entity');
    laberintoUI.setAttribute('id', 'laberinto-ui');
    laberintoUI.innerHTML = `
        <a-entity light="type: spot; color: #ffffff; intensity: 1.5; distance: 15; angle: 40; penumbra: 0.5" position="0 0 0" rotation="0 0 0"></a-entity>
        <a-text id="orb-ui" value="Orbes: 0 / 5" position="0 0.4 -1" color="#00ffaa" align="center" width="2"></a-text>
    `;
    camera.appendChild(laberintoUI);

    // Reiniciar posición del jugador
    const player = document.querySelector('#player');
    if (player) {
        player.setAttribute('position', '0 1.6 0');
    }

    // Llamar a los constructores
    buildMaze(gameContainer);
    spawnOrbs(gameContainer);
    spawnHunter(gameContainer);
}

function buildMaze(container) {
    // Generar 30 pilares aleatorios para simular el laberinto (¡Con static-body!)
    for (let i = 0; i < 30; i++) {
        let x = (Math.random() - 0.5) * 40;
        let z = (Math.random() - 0.5) * 40;
        
        // Evitar que salgan muy cerca del inicio (0,0)
        if (Math.abs(x) < 3 && Math.abs(z) < 3) continue;

        container.innerHTML += `
            <a-box position="${x} 2.5 ${z}" width="3" height="5" depth="3" color="#111111" static-body material="roughness: 1"></a-box>
        `;
    }
    
    // Paredes perimetrales (¡Con static-body!)
    container.innerHTML += `
        <a-box position="0 2.5 -25" width="50" height="5" depth="1" color="#0a0a0a" static-body></a-box>
        <a-box position="0 2.5 25" width="50" height="5" depth="1" color="#0a0a0a" static-body></a-box>
        <a-box position="-25 2.5 0" width="1" height="5" depth="50" color="#0a0a0a" static-body></a-box>
        <a-box position="25 2.5 0" width="1" height="5" depth="50" color="#0a0a0a" static-body></a-box>
    `;
}

function spawnOrbs(container) {
    for (let i = 0; i < 5; i++) {
        let x = (Math.random() - 0.5) * 35;
        let z = (Math.random() - 0.5) * 35;

        if (Math.abs(x) < 4 && Math.abs(z) < 4) continue;

        let orb = document.createElement('a-sphere');
        orb.setAttribute('position', `${x} 1 ${z}`);
        orb.setAttribute('radius', '0.4');
        orb.setAttribute('color', '#00ffaa');
        orb.setAttribute('material', 'shader: flat');
        orb.setAttribute('class', 'clickable orb');
        
        // Luz propia del orbe
        orb.innerHTML = `<a-entity light="type: point; color: #00ffaa; intensity: 1; distance: 5"></a-entity>`;
        
        orb.addEventListener('mousedown', function() {
            if (!laberintoActive) return;
            this.remove();
            orbsCollected++;
            document.querySelector('#orb-ui').setAttribute('value', `Orbes: ${orbsCollected} / 5`);
            
            if (orbsCollected >= 5) {
                endLaberinto(true);
            }
        });

        container.appendChild(orb);
    }
}

function spawnHunter(container) {
    let hunter = document.createElement('a-entity');
    hunter.setAttribute('id', 'hunter');
    // Aparece lejos del jugador
    hunter.setAttribute('position', '20 1.5 20'); 
    hunter.innerHTML = `
        <a-sphere radius="0.8" color="#ff0000" material="shader: flat; transparent: true; opacity: 0.8"></a-sphere>
        <a-entity light="type: point; color: #ff0000; intensity: 2; distance: 8"></a-entity>
    `;
    container.appendChild(hunter);

    const player = document.querySelector('#player');

    // Lógica para que el cazador te persiga cada 100ms
    hunterInterval = setInterval(() => {
        if (!laberintoActive) return;

        let pPos = player.getAttribute('position');
        let hPos = hunter.getAttribute('position');

        // Moverse hacia el jugador
        let dx = pPos.x - hPos.x;
        let dz = pPos.z - hPos.z;
        let distance = Math.sqrt(dx * dx + dz * dz);

        if (distance < 1.5) {
            endLaberinto(false); // Si te toca, pierdes
        } else {
            // Velocidad del cazador
            let speed = 0.05; 
            hunter.setAttribute('position', {
                x: hPos.x + (dx / distance) * speed,
                y: 1.5,
                z: hPos.z + (dz / distance) * speed
            });
        }
    }, 100);
}

function endLaberinto(victoria) {
    laberintoActive = false;
    clearInterval(hunterInterval);

    const camera = document.querySelector('[camera]');
    const oldUI = document.querySelector('#laberinto-ui');
    if (oldUI) oldUI.remove();

    if (victoria) {
        alert("¡ESCAPASTE! Encontraste los 5 orbes.");
    } else {
        alert("¡TE ATRAPÓ EL CAZADOR! Fin del juego.");
    }

    // Regresar al lobby
    if (typeof initLobby === 'function') {
        initLobby();
    }
}