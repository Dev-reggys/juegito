function initTetris() {
    const box = 20;
    const cols = 20;
    const rows = 20;
    let score = 0;
    let dropCounter = 0;
    let dropInterval = 1000;
    let lastTime = 0;
    let isGameOver = false; // 🛑 NUEVO: Bandera para saber si ya perdimos

    const pieces = [
        [[0, 0, 0, 0], [1, 1, 1, 1], [0, 0, 0, 0], [0, 0, 0, 0]], 
        [[2, 2], [2, 2]], 
        [[0, 3, 3], [3, 3, 0], [0, 0, 0]], 
        [[4, 4, 0], [0, 4, 4], [0, 0, 0]], 
        [[0, 5, 0], [5, 5, 5], [0, 0, 0]], 
        [[0, 0, 6], [6, 6, 6], [0, 0, 0]], 
        [[7, 0, 0], [7, 7, 7], [0, 0, 0]]  
    ];

    const colors = [
        null, "#00ffff", "#ffff00", "#00ff00", 
        "#ff0000", "#ff00ff", "#ff8000", "#0000ff"
    ];

    const board = Array.from({ length: rows }, () => Array(cols).fill(0));
    
    let player = {
        pos: { x: 0, y: 0 },
        matrix: null
    };

    function resetPlayer() {
        const type = Math.floor(Math.random() * pieces.length);
        player.matrix = pieces[type];
        player.pos.y = 0;
        player.pos.x = Math.floor(cols / 2) - Math.floor(player.matrix[0].length / 2);

        if (collide(board, player)) {
            isGameOver = true; // 🛑 DETENEMOS EL JUEGO AQUÍ
            cancelAnimationFrame(animationId);
            document.onkeydown = null;
            mostrarGameOver(score); // LLAMAMOS AL MODAL
        }
    }

    function drawMatrix(matrix, offset) {
        matrix.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value !== 0) {
                    ctx.fillStyle = colors[value];
                    ctx.fillRect((x + offset.x) * box, (y + offset.y) * box, box, box);
                    ctx.strokeStyle = "#000";
                    ctx.strokeRect((x + offset.x) * box, (y + offset.y) * box, box, box);
                }
            });
        });
    }

    function merge(board, player) {
        player.matrix.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value !== 0) {
                    board[y + player.pos.y][x + player.pos.x] = value;
                }
            });
        });
    }

    function collide(board, player) {
        const [m, o] = [player.matrix, player.pos];
        for (let y = 0; y < m.length; ++y) {
            for (let x = 0; x < m[y].length; ++x) {
                if (m[y][x] !== 0 && (board[y + o.y] && board[y + o.y][x + o.x]) !== 0) {
                    return true;
                }
            }
        }
        return false;
    }

    function playerDrop() {
        if (isGameOver) return; // 🛑 Si ya perdimos, no cae nada más
        player.pos.y++;
        if (collide(board, player)) {
            player.pos.y--;
            merge(board, player);
            resetPlayer();
            if (!isGameOver) arenaSweep();
        }
        dropCounter = 0;
    }

    function playerMove(dir) {
        if (isGameOver) return;
        player.pos.x += dir;
        if (collide(board, player)) {
            player.pos.x -= dir;
        }
    }

    function playerRotate() {
        if (isGameOver) return;
        const pos = player.pos.x;
        let offset = 1;
        rotate(player.matrix);
        while (collide(board, player)) {
            player.pos.x += offset;
            offset = -(offset + (offset > 0 ? 1 : -1));
            if (offset > player.matrix[0].length) {
                rotate(player.matrix, -1);
                player.pos.x = pos;
                return;
            }
        }
    }

    function rotate(matrix, dir = 1) {
        for (let y = 0; y < matrix.length; ++y) {
            for (let x = 0; x < y; ++x) {
                [matrix[x][y], matrix[y][x]] = [matrix[y][x], matrix[x][y]];
            }
        }
        if (dir > 0) {
            matrix.forEach(row => row.reverse());
        } else {
            matrix.reverse();
        }
    }

    function arenaSweep() {
        outer: for (let y = board.length - 1; y >= 0; --y) {
            for (let x = 0; x < board[y].length; ++x) {
                if (board[y][x] === 0) continue outer;
            }
            const row = board.splice(y, 1)[0].fill(0);
            board.unshift(row);
            ++y;
            score += 10;
            scoreElement.innerText = score;
        }
    }

    function update(time = 0) {
        if (isGameOver) return; // 🛑 ROMPE EL BUCLE INFINITO DE LA ANIMACIÓN

        if (lastTime === 0) lastTime = time; 
        
        const deltaTime = time - lastTime;
        lastTime = time;
        dropCounter += deltaTime;

        if (dropCounter > dropInterval) {
            playerDrop();
        }

        ctx.fillStyle = "#111"; 
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        drawMatrix(board, { x: 0, y: 0 });
        drawMatrix(player.matrix, player.pos);

        animationId = requestAnimationFrame(update);
    }

    document.onkeydown = (e) => {
        if (isGameOver) return; // 🛑 Ignora teclas si ya perdiste
        if (e.keyCode === 37) playerMove(-1); 
        else if (e.keyCode === 39) playerMove(1); 
        else if (e.keyCode === 40) playerDrop(); 
        else if (e.keyCode === 38) playerRotate(); 
        
        if([37, 38, 39, 40].includes(e.keyCode)) e.preventDefault();
    };

    resetPlayer();
    update();
}