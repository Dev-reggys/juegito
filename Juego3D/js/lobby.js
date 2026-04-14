// lobby.js - Central Hub Management

function initLobby() {
    console.log("Cargando el Lobby (Búnker)...");
    const lobbyContainer = document.querySelector('#lobby-container');
    const gameContainer = document.querySelector('#game-container');
    const player = document.querySelector('#player');
    
    // 1. Limpieza total de contenedores y estados de juego
    if (gameContainer) gameContainer.innerHTML = '';
    if (lobbyContainer) lobbyContainer.innerHTML = '';

    // Detener música y variables de otros juegos
    slActive = false;
    shooterActive = false;
    if (typeof laberintoActive !== 'undefined') laberintoActive = false;

    const ambientMusic = document.querySelector('#snd-ambient-sl');
    if (ambientMusic) ambientMusic.pause();

    // Limpiar intervalos de Sister Location si existen
    if (typeof clearAllIntervals === 'function') clearAllIntervals();

    // 2. Construcción visual del Búnker
    lobbyContainer.innerHTML = `
        <a-entity light="type: ambient; color: #222; intensity: 0.8"></a-entity>
        <a-entity light="type: point; color: #00ffaa; intensity: 1.5; distance: 15" position="0 3 -5"></a-entity>
        <a-entity light="type: point; color: #ff0055; intensity: 1; distance: 10" position="-4 2 -8"></a-entity>

        <a-plane src="#tex-suelo" rotation="-90 0 0" width="20" height="20" material="repeat: 4 4; shader: flat" static-body></a-plane>
        <a-plane src="#tex-suelo" rotation="90 0 0" position="0 6 0" width="20" height="20" material="repeat: 4 4; shader: flat"></a-plane>
        
        <a-box src="#tex-container" position="0 3 -10" width="20" height="6" depth="0.5" material="repeat: 3 1" static-body></a-box>
        <a-box src="#tex-container" position="0 3 10" width="20" height="6" depth="0.5" material="repeat: 3 1" static-body></a-box>
        <a-box src="#tex-container" position="-10 3 0" width="0.5" height="6" depth="20" material="repeat: 3 1" static-body></a-box>
        <a-box src="#tex-container" position="10 3 0" width="0.5" height="6" depth="20" material="repeat: 3 1" static-body></a-box>

        <a-text value="MULTIJUEGO HUB PRO" position="0 4.5 -9.5" align="center" width="12" color="#00ffaa" font="kelsonsans"></a-text>
        <a-text value="W A S D para moverte | HAZ CLICK para seleccionar juego" position="0 3.8 -9.5" align="center" width="5" color="#ccc"></a-text>

        <a-entity id="btn-shooter" class="clickable" position="-3.5 2 -9.7" 
                  geometry="primitive: box; width: 2.5; height: 1; depth: 0.3" 
                  material="color: #ff0055; shader: flat" 
                  animation__mouseenter="property: scale; to: 1.1 1.1 1.1; startEvents: mouseenter; dur: 200" 
                  animation__mouseleave="property: scale; to: 1 1 1; startEvents: mouseleave; dur: 200">
            <a-text value="SHOOTER" position="0 0 0.16" align="center" width="6" color="white" font="kelsonsans"></a-text>
        </a-entity>

        <a-entity id="btn-laberinto" class="clickable" position="0 2 -9.7" 
                  geometry="primitive: box; width: 2.5; height: 1; depth: 0.3" 
                  material="color: #222222; shader: flat" 
                  animation__mouseenter="property: scale; to: 1.1 1.1 1.1; startEvents: mouseenter; dur: 200" 
                  animation__mouseleave="property: scale; to: 1 1 1; startEvents: mouseleave; dur: 200">
            <a-text value="LABERINTO" position="0 0 0.16" align="center" width="6" color="#aa0000" font="kelsonsans"></a-text>
        </a-entity>

        <a-entity id="btn-sl" class="clickable" position="3.5 2 -9.7" 
                  geometry="primitive: box; width: 2.5; height: 1; depth: 0.3" 
                  material="color: #4444ff; shader: flat" 
                  animation__mouseenter="property: scale; to: 1.1 1.1 1.1; startEvents: mouseenter; dur: 200" 
                  animation__mouseleave="property: scale; to: 1 1 1; startEvents: mouseleave; dur: 200">
            <a-text value="SISTER LOC" position="0 0 0.16" align="center" width="5.5" color="white" font="kelsonsans"></a-text>
        </a-entity>
    `;

    // 3. Gestión de la interfaz del jugador (HUD)
    const ammoUI = document.querySelector('#ammo-ui');
    const hpUI = document.querySelector('#player-hp-bg');
    const weapon = document.querySelector('#weapon');
    const slUI = document.querySelector('#sl-ui'); // UI de Sister Location

    if (ammoUI) ammoUI.setAttribute('visible', 'false');
    if (hpUI) hpUI.setAttribute('visible', 'false');
    if (weapon) weapon.setAttribute('visible', 'false');
    if (slUI) slUI.remove(); // Eliminamos el reloj y luces de SL

    // 4. Ubicar al jugador en el centro
    if (player) player.setAttribute('position', '0 1.6 0');

    // 5. Activación de Listeners con retraso para estabilidad
    setTimeout(() => {
        const btnShooter = document.querySelector('#btn-shooter');
        const btnLaberinto = document.querySelector('#btn-laberinto');
        const btnSL = document.querySelector('#btn-sl');

        if (btnShooter) {
            btnShooter.addEventListener('click', () => {
                if (ammoUI) ammoUI.setAttribute('visible', 'true');
                if (hpUI) hpUI.setAttribute('visible', 'true');
                if (weapon) weapon.setAttribute('visible', 'true');
                if (typeof startShooterGame === 'function') startShooterGame();
            });
        }

        if (btnLaberinto) {
            btnLaberinto.addEventListener('click', () => {
                if (typeof startLaberinto === 'function') startLaberinto();
            });
        }

        if (btnSL) {
            btnSL.addEventListener('click', () => {
                if (typeof startSisterLocation === 'function') {
                    startSisterLocation();
                } else {
                    console.error("Error: sl.js no detectado.");
                }
            });
        }
    }, 500);
}