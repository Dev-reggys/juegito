let playerHP = 200;
let shooterActive = false;

// VARIABLES DE MUNICIÓN
let ammo = 15;
const maxAmmo = 15;
let isReloading = false;

function startShooterGame() {
    console.log("Iniciando Modo 4vs4 en Mapa Container...");
    shooterActive = true;
    playerHP = 200;
    ammo = maxAmmo; // Reiniciar balas al empezar
    isReloading = false;

    const gameContainer = document.querySelector('#game-container');
    const lobbyContainer = document.querySelector('#lobby-container');

    if (lobbyContainer) lobbyContainer.innerHTML = '';
    gameContainer.innerHTML = '';

    gameContainer.innerHTML += `
        <a-sky color="#87CEEB"></a-sky>
        <a-entity light="type: ambient; intensity: 0.8"></a-entity>
        <a-entity light="type: directional; intensity: 0.5" position="-1 4 2"></a-entity>
    `;

    setupPlayerPhysicsAndHUD();
    updateAmmoUI(); // Mostrar las balas iniciales
    createLargeCollidableMap(gameContainer);

    for (let i = 0; i < 3; i++) spawnBot(gameContainer, 'ally', i);
    for (let i = 0; i < 4; i++) spawnBot(gameContainer, 'enemy', i);

    setupWeaponAndControls();
}

function setupPlayerPhysicsAndHUD() {
    const player = document.querySelector('#player');
    
    player.setAttribute('kinematic-body', 'radius: 0.6; height: 1.6');
    player.setAttribute('position', '0 1.6 35'); 

    if (player.body) {
        player.body.velocity.set(0, 0, 0);
        player.body.angularVelocity.set(0, 0, 0);
    }

    updatePlayerHealthUI();
}

function createLargeCollidableMap(container) {
    const floor = document.createElement('a-plane');
    floor.setAttribute('static-body', ''); 
    floor.setAttribute('src', '#tex-suelo');
    floor.setAttribute('rotation', '-90 0 0');
    floor.setAttribute('width', '80'); 
    floor.setAttribute('height', '80');
    floor.setAttribute('material', 'repeat: 16 16; shader: flat;'); 
    container.appendChild(floor);

    addCollidableWall(container, "0 5 -40", "80 10 1", "0 0 0");   
    addCollidableWall(container, "0 5 40", "80 10 1", "0 0 0");    
    addCollidableWall(container, "40 5 0", "1 10 80", "0 0 0");    
    addCollidableWall(container, "-40 5 0", "1 10 80", "0 0 0");   

    addCollidableWall(container, "-3 1.25 0", "2.5 2.5 6", "0 0 0"); 
    addCollidableWall(container, "3 1.25 0", "2.5 2.5 6", "0 0 0");  
    addCollidableWall(container, "0 1.25 -6", "6 2.5 2.5", "0 0 0"); 
    addCollidableWall(container, "0 1.25 6", "6 2.5 2.5", "0 0 0");  

    addCollidableWall(container, "-15 1.25 -15", "2.5 2.5 6", "0 45 0");
    addCollidableWall(container, "15 1.25 -15", "2.5 2.5 6", "0 -45 0");
    addCollidableWall(container, "-15 1.25 15", "2.5 2.5 6", "0 -45 0");
    addCollidableWall(container, "15 1.25 15", "2.5 2.5 6", "0 45 0");

    addCollidableWall(container, "-25 1.25 0", "2.5 2.5 10", "0 0 0");
    addCollidableWall(container, "25 1.25 0", "2.5 2.5 10", "0 0 0");
}

function addCollidableWall(container, pos, size, rot) {
    const wall = document.createElement('a-box');
    const s = size.split(' ');
    wall.setAttribute('position', pos);
    wall.setAttribute('rotation', rot);
    wall.setAttribute('width', s[0]);
    wall.setAttribute('height', s[1]);
    const grosor = parseFloat(s[2]) < 1 ? 1 : s[2];
    wall.setAttribute('depth', grosor);
    
    // AQUÍ APLICAMOS LA TEXTURA DEL CONTENEDOR
    wall.setAttribute('src', '#tex-container');
    wall.setAttribute('material', 'repeat: 1 1; shader: flat;');
    wall.setAttribute('static-body', '');
    container.appendChild(wall);
}

function spawnBot(container, team, index) {
    if (!shooterActive) return;
    const isEnemy = team === 'enemy';
    const botGroup = document.createElement('a-entity');
    
    botGroup.classList.add('bot', team);
    botGroup.setAttribute('data-hp', 200);

    const xPos = (index * 6) - 9; 
    const zPos = isEnemy ? -35 : 35;
    botGroup.setAttribute('position', `${xPos} 0 ${zPos}`);

    const botImg = document.createElement('a-image');
    botImg.setAttribute('src', '#tex-enemigo');
    botImg.setAttribute('width', '1.8');
    botImg.setAttribute('height', '2.2');
    botImg.setAttribute('position', '0 1.1 0');
    botImg.setAttribute('look-at', '[camera]');
    botImg.setAttribute('material', 'transparent: true; alphaTest: 0.5; shader: flat;');
    
    botImg.classList.add('clickable');
    if (isEnemy) {
        botImg.setAttribute('color', '#ff6666');
        botImg.classList.add('enemy-hitbox'); 
    } else {
        botImg.setAttribute('color', '#6666ff');
        botImg.classList.add('ally-hitbox');
    }

    const hpBg = document.createElement('a-plane');
    hpBg.setAttribute('width', '1.6'); hpBg.setAttribute('height', '0.16');
    hpBg.setAttribute('color', 'black'); hpBg.setAttribute('opacity', '0.8');
    hpBg.setAttribute('position', '0 2.5 0'); hpBg.setAttribute('look-at', '[camera]');

    const hpBar = document.createElement('a-plane');
    hpBar.setAttribute('width', '1.6'); hpBar.setAttribute('height', '0.16');
    hpBar.setAttribute('color', isEnemy ? 'red' : 'lime');
    hpBar.setAttribute('position', '0 0 0.01');
    hpBg.appendChild(hpBar);

    botGroup.appendChild(botImg);
    botGroup.appendChild(hpBg);

    let currentTarget = null;

    const aiLoop = setInterval(() => {
        if (!shooterActive || !botGroup.parentNode) return clearInterval(aiLoop);

        let hp = parseFloat(botGroup.getAttribute('data-hp'));
        if (hp <= 0) {
            clearInterval(aiLoop);
            botGroup.remove();
            return;
        }

        hpBar.setAttribute('width', Math.max(0, (hp / 200) * 1.6));

        let targets = Array.from(document.querySelectorAll(isEnemy ? '.bot.ally' : '.bot.enemy'));
        if (isEnemy) { 
            const playerEl = document.querySelector('#player');
            if (playerEl && playerHP > 0) targets.push(playerEl);
        }

        let minDistance = Infinity;
        currentTarget = null;
        const myPos = botGroup.getAttribute('position');

        targets.forEach(t => {
            if(!t || !t.parentNode) return;
            const tPos = t.getAttribute('position');
            const dist = Math.hypot(tPos.x - myPos.x, tPos.z - myPos.z);
            if (dist < minDistance) {
                minDistance = dist;
                currentTarget = t;
            }
        });

        if (currentTarget && minDistance > 8) {
            const tPos = currentTarget.getAttribute('position');
            const dx = tPos.x - myPos.x;
            const dz = tPos.z - myPos.z;
            const length = Math.hypot(dx, dz);
            const speed = 0.05; 
            myPos.x += (dx / length) * speed;
            myPos.z += (dz / length) * speed;
            botGroup.setAttribute('position', myPos);
        }
    }, 50);

    const shootLoop = setInterval(() => {
        if (!shooterActive || !botGroup.parentNode || !currentTarget) return;
        
        const myPos = botGroup.getAttribute('position');
        const tPos = currentTarget.getAttribute('position');
        const dist = Math.hypot(tPos.x - myPos.x, tPos.z - myPos.z);

        if (dist <= 25) { 
            if (currentTarget.id === 'player') {
                playerHP -= 10;
                updatePlayerHealthUI();
                flashRedDamageEffect();
            } else {
                let targetHp = parseFloat(currentTarget.getAttribute('data-hp'));
                currentTarget.setAttribute('data-hp', targetHp - 20); 
            }
        }
    }, 1200);

    botImg.addEventListener('take-damage', () => {
        let hp = parseFloat(botGroup.getAttribute('data-hp'));
        botGroup.setAttribute('data-hp', hp - 35); 
        botImg.setAttribute('color', 'white'); 
        setTimeout(() => { 
            if(botGroup.parentNode) botImg.setAttribute('color', isEnemy ? '#ff6666' : '#6666ff'); 
        }, 100);
    });

    container.appendChild(botGroup);
}

function setupWeaponAndControls() {
    const camera = document.querySelector('[camera]');
    
    if (!document.querySelector('#weapon')) {
        const gun = document.createElement('a-image');
        gun.setAttribute('id', 'weapon');
        gun.setAttribute('src', '#tex-arma');
        gun.setAttribute('width', '0.8'); gun.setAttribute('height', '0.8');
        gun.setAttribute('position', '0.45 -0.35 -0.7'); 
        gun.setAttribute('material', 'transparent: true; alphaTest: 0.5; shader: flat;');
        camera.appendChild(gun);
    }

    const shootSound = document.querySelector('#snd-disparo');
    if (shootSound) shootSound.volume = 0.5; 

    window.oncontextmenu = function(e) { e.preventDefault(); return false; };

    // DISPARO
    window.addEventListener('mousedown', (e) => {
        if (!shooterActive || isReloading) return;

        if (e.button === 0) { // Click Izquierdo
            if (ammo > 0) {
                // Gastar bala
                ammo--;
                updateAmmoUI();

                if (shootSound) {
                    shootSound.currentTime = 0; 
                    shootSound.play().catch(e => console.log("Esperando interacción para audio"));
                }

                const gun = document.querySelector('#weapon');
                if(gun) {
                    gun.setAttribute('position', '0.45 -0.30 -0.6'); 
                    setTimeout(() => { if(gun && !isReloading) gun.setAttribute('position', '0.45 -0.35 -0.7'); }, 100); 
                }

                const cursor = document.querySelector('#mouse-cursor');
                if(cursor && cursor.components.raycaster) {
                    const intersectedEls = cursor.components.raycaster.intersectedEls;
                    if (intersectedEls.length > 0) {
                        const target = intersectedEls[0];
                        if (target.classList.contains('enemy-hitbox')) {
                            target.emit('take-damage');
                        }
                    }
                }
            } else {
                // Si no hay balas y haces clic, forzar recarga
                reloadWeapon();
            }

        } else if (e.button === 2) { // Click Derecho
            camera.setAttribute('camera', 'fov', 40);
        }
    });

    window.addEventListener('mouseup', (e) => {
        if (!shooterActive) return;
        if (e.button === 2) { 
            camera.setAttribute('camera', 'fov', 80);
        }
    });

    // TECLA DE RECARGA (R)
    window.addEventListener('keydown', (e) => {
        if (!shooterActive || isReloading) return;
        if ((e.key === 'r' || e.key === 'R') && ammo < maxAmmo) {
            reloadWeapon();
        }
    });
}

// SISTEMA DE RECARGA
function reloadWeapon() {
    isReloading = true;
    const ammoUI = document.querySelector('#ammo-ui');
    if (ammoUI) ammoUI.setAttribute('value', 'Recargando...');

    // Ocultar el arma ligeramente para simular la recarga
    const gun = document.querySelector('#weapon');
    if(gun) gun.setAttribute('position', '0.45 -0.6 -0.5'); 

    // Tiempo de recarga: 1.5 segundos
    setTimeout(() => {
        ammo = maxAmmo;
        isReloading = false;
        updateAmmoUI();
        if(gun) gun.setAttribute('position', '0.45 -0.35 -0.7'); 
    }, 1500);
}

// ACTUALIZAR TEXTO DE BALAS
function updateAmmoUI() {
    const ammoUI = document.querySelector('#ammo-ui');
    if (ammoUI) {
        if (ammo === 0) {
            ammoUI.setAttribute('value', '0 / 15 [R]');
            ammoUI.setAttribute('color', 'red');
        } else {
            ammoUI.setAttribute('value', `${ammo} / 15`);
            ammoUI.setAttribute('color', 'white');
        }
    }
}

function updatePlayerHealthUI() {
    const hpBar = document.querySelector('#player-hp-bar');
    if (!hpBar) return;
    const hpPercentage = playerHP / 200;
    hpBar.setAttribute('width', Math.max(0, hpPercentage * 0.4));

    if (playerHP <= 0 && shooterActive) {
        shooterActive = false;
        alert("¡TE HAN ELIMINADO!");
        location.reload();
    }
}

function flashRedDamageEffect() {
    const dSound = document.querySelector('#snd-dano');
    if (dSound) {
        dSound.volume = 1.0; 
        dSound.currentTime = 0;
        dSound.play().catch(e => console.log("Daño silenciado"));
    }

    const camera = document.querySelector('[camera]');
    if(!camera) return;
    const flash = document.createElement('a-plane');
    flash.setAttribute('position', '0 0 -0.1');
    flash.setAttribute('width', '2'); flash.setAttribute('height', '2');
    flash.setAttribute('color', 'red'); flash.setAttribute('opacity', '0.4');
    flash.setAttribute('transparent', 'true'); flash.setAttribute('material', 'shader: flat;');
    camera.appendChild(flash);
    setTimeout(() => { if(flash.parentNode) flash.remove(); }, 70);
}