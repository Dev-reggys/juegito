// js/main.js
window.addEventListener('load', () => {
    const scene = document.querySelector('a-scene');
    console.log("Estructura Index cargada correctamente.");

    if (scene.hasLoaded) {
        initLobby();
    } else {
        scene.addEventListener('loaded', initLobby);
    }
});