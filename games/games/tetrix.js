/* --- MOTOR DE TETRIS (CON SISTEMA DE VIDAS Y LIMPIEZA DE ARENA) --- */
function initTetris() {
    if (window.animationId) cancelAnimationFrame(window.animationId);
    
    const box = 20;
    const cols = canvas.width / box;
    const rows = canvas.height / box;
    let score = 0, dropCounter = 0, dropInterval = 1000, lastTime = 0;
    const board = Array.from({ length: rows }, () => Array(cols).fill(0));
    let player = { pos: { x: 0, y: 0 }, matrix: null };
    let boardInvulnerable = false; // Para el efecto visual al perder vida

    const pieces = [
        [[0,0,0,0],[1,1,1,1],[0,0,0,0],[0,0,0,0]], // I
        [[2,2],[2,2]], // O
        [[0,3,3],[3,3,0],[0,0,0]], // S
        [[4,4,0],[0,4,4],[0,0,0]], // Z
        [[5,0,0],[5,5,5],[0,0,0]], // L
        [[0,0,6],[6,6,6],[0,0,0]], // J
        [[0,7,0],[7,7,7],[0,0,0]]  // T
    ];
    const colors = [null, "#00ffff", "#ffff00", "#00ff00", "#ff4141", "#ff00ff", "#ff8000", "#00fbff"];

    window.moverTetris = (keyCode) => {
        if (!window.gameActive) return;
        if (keyCode === 37) playerMove(-1);
        else if (keyCode === 39) playerMove(1);
        else if (keyCode === 40) playerDrop();
        else if (keyCode === 38) playerRotate();
    };

    function playerMove(dir) {
        player.pos.x += dir;
        if (collide(board, player)) player.pos.x -= dir;
    }

    function playerRotate() {
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
            for (let x = 0; x < y; ++x) [matrix[x][y], matrix[y][x]] = [matrix[y][x], matrix[x][y]];
        }
        dir > 0 ? matrix.forEach(row => row.reverse()) : matrix.reverse();
    }

    function collide(board, player) {
        const [m, o] = [player.matrix, player.pos];
        for (let y = 0; y < m.length; ++y) {
            for (let x = 0; x < m[y].length; ++x) {
                if (m[y][x] !== 0 && (board[y + o.y] && board[y + o.y][x + o.x]) !== 0) return true;
            }
        }
        return false;
    }

    function playerDrop() {
        player.pos.y++;
        if (collide(board, player)) {
            player.pos.y--;
            merge(board, player);
            resetPlayer();
            arenaSweep();
        }
        dropCounter = 0;
    }

    function merge(board, player) {
        player.matrix.forEach((row, y) => {
            row.forEach((v, x) => { if (v !== 0) board[y + player.pos.y][x + player.pos.x] = v; });
        });
    }

    function arenaSweep() {
        outer: for (let y = board.length - 1; y >= 0; --y) {
            for (let x = 0; x < board[y].length; ++x) { if (board[y][x] === 0) continue outer; }
            const row = board.splice(y, 1)[0].fill(0);
            board.unshift(row);
            score += 10; window.scoreElement.innerText = score;
        }
    }

    function resetPlayer() {
        player.matrix = pieces[Math.floor(Math.random() * pieces.length)];
        player.pos.y = 0;
        player.pos.x = Math.floor(cols / 2) - 1;

        // CHOQUE EN EL TECHO (SISTEMA DE VIDAS)
        if (collide(board, player)) {
            window.Vidas(); // Restar vida global

            if (window.lives > 0) {
                // LIMPIEZA DE EMERGENCIA: Borrar las 6 filas superiores para dar espacio
                for(let y = 0; y < 8; y++) {
                    board[y].fill(0);
                }
                boardInvulnerable = true;
                setTimeout(() => { boardInvulnerable = false; }, 1500);
            } else {
                // Game Over ya manejado por window.Vidas()
                return;
            }
        }
    }

    function update(time = 0) {
        if (!window.gameActive || window.currentRunningGame !== 'tetris') return;
        const deltaTime = time - lastTime;
        lastTime = time;
        dropCounter += deltaTime;
        if (dropCounter > dropInterval) playerDrop();

        ctx.fillStyle = "#111"; 
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Dibujar Tablero (con efecto parpadeo si perdió vida)
        if (!boardInvulnerable || Math.floor(Date.now() / 150) % 2) {
            drawMatrix(board, {x:0, y:0});
            drawMatrix(player.matrix, player.pos);
        }

        window.animationId = requestAnimationFrame(update);
    }

    function drawMatrix(matrix, offset) {
        matrix.forEach((row, y) => {
            row.forEach((v, x) => {
                if (v !== 0) { 
                    ctx.fillStyle = colors[v]; 
                    ctx.fillRect((x+offset.x)*box, (y+offset.y)*box, box-1, box-1); 
                    // Toque neón
                    ctx.strokeStyle = "white";
                    ctx.lineWidth = 0.5;
                    ctx.strokeRect((x+offset.x)*box, (y+offset.y)*box, box-1, box-1);
                }
            });
        });
    }

    resetPlayer(); 
    update();
}