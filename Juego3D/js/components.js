// IA de movimiento para los Bots
AFRAME.registerComponent('bot-ai', {
  schema: { speed: {type: 'number', default: 0.05} },
  init: function () {
    this.targetPos = new THREE.Vector3();
    this.newTarget();
  },
  newTarget: function () {
    this.targetPos.set((Math.random()-0.5)*20, 0, (Math.random()-0.5)*20);
  },
  tick: function () {
    let pos = this.el.object3D.position;
    if (pos.distanceTo(this.targetPos) < 0.5) {
      this.newTarget();
    } else {
      // Movimiento suave hacia el objetivo
      let direction = new THREE.Vector3().subVectors(this.targetPos, pos).normalize();
      this.el.object3D.position.addScaledVector(direction, this.data.speed);
    }
  }
});

// Componente para que el arma dispare
AFRAME.registerComponent('weapon-system', {
  init: function () {
    window.addEventListener('mousedown', () => {
      // Lógica de disparo (raycast o proyectil)
      console.log("Piu piu!");
    });
  }
});