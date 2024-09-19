document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('game-canvas');
    const context = canvas.getContext('2d');
    const nextCanvas = document.getElementById('next-piece');
    const nextContext = nextCanvas.getContext('2d');
    const startButton = document.getElementById('start-button');
    const restartButton = document.getElementById('restart-button');
    const playerNameInput = document.getElementById('player-name');
    const playerNameDisplay = document.getElementById('player-name-display');
    const finalScoreDisplay = document.getElementById('final-score');
    const applauseSound = document.getElementById('applause-sound');

    const leftButton = document.getElementById('left-button');
    const rightButton = document.getElementById('right-button');
    const downButton = document.getElementById('down-button');
    const rotateButton = document.getElementById('rotate-button');

    let playerName = '';
    let gameOver = false;

    const grid = createMatrix(10, 20);
    let dropCounter = 0;
    let dropInterval = 1000;
    let lastTime = 0;

    const colors = [
        null,
        '#FF0D72',
        '#0DC2FF',
        '#0DFF72',
        '#F538FF',
        '#FF8E0D',
        '#FFE138',
        '#3877FF',
    ];

    const pieces = 'ILJOTSZ';

    const player = {
        pos: { x: 0, y: 0 },
        matrix: null,
        next: null,
        score: 0,
        level: 1,
        lines: 0,
    };

    // הוספת מוזיקת הרקע
    const backgroundMusic = new Audio('assets/background.mp3');
    backgroundMusic.loop = true;

    startButton.addEventListener('click', () => {
        playerName = playerNameInput.value.trim();
        if (playerName === '') {
            alert('אנא הזן את שמך.');
            return;
        }
        document.getElementById('start-screen').style.display = 'none';
        document.getElementById('game-area').style.display = 'flex';
        resetGame();
        updateScore();
        updateLevel();
        backgroundMusic.play(); // ניגון מוזיקת הרקע
        update();
    });

    restartButton.addEventListener('click', () => {
        document.getElementById('end-screen').style.display = 'none';
        document.getElementById('start-screen').style.display = 'block';
    });

    function createMatrix(w, h) {
        const matrix = [];
        while (h--) {
            matrix.push(new Array(w).fill(0));
        }
        return matrix;
    }

    function createPiece(type) {
        switch (type) {
            case 'T':
                return [
                    [0, 0, 0],
                    [1, 1, 1],
                    [0, 1, 0],
                ];
            case 'O':
                return [
                    [2, 2],
                    [2, 2],
                ];
            case 'L':
                return [
                    [0, 3, 0],
                    [0, 3, 0],
                    [0, 3, 3],
                ];
            case 'J':
                return [
                    [0, 4, 0],
                    [0, 4, 0],
                    [4, 4, 0],
                ];
            case 'I':
                return [
                    [0, 0, 5, 0],
                    [0, 0, 5, 0],
                    [0, 0, 5, 0],
                    [0, 0, 5, 0],
                ];
            case 'S':
                return [
                    [0, 6, 6],
                    [6, 6, 0],
                    [0, 0, 0],
                ];
            case 'Z':
                return [
                    [7, 7, 0],
                    [0, 7, 7],
                    [0, 0, 0],
                ];
        }
    }

    function drawMatrix(matrix, offset, ctx) {
        matrix.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value !== 0) {
                    ctx.fillStyle = colors[value];
                    ctx.fillRect(
                        x + offset.x,
                        y + offset.y,
                        1, 1
                    );
                    // הוספת גבולות לבלוקים
                    ctx.strokeStyle = '#000';
                    ctx.lineWidth = 0.05;
                    ctx.strokeRect(
                        x + offset.x,
                        y + offset.y,
                        1, 1
                    );
                }
            });
        });
    }

    function draw() {
        context.clearRect(0, 0, canvas.width, canvas.height);

        drawMatrix(grid, { x: 0, y: 0 }, context);
        drawMatrix(player.matrix, player.pos, context);

        // ציור הצורה הבאה
        nextContext.clearRect(0, 0, nextCanvas.width, nextCanvas.height);
        drawMatrix(player.next, { x: 1, y: 1 }, nextContext);
    }

    function merge(grid, player) {
        player.matrix.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value !== 0) {
                    grid[y + player.pos.y][x + player.pos.x] = value;
                }
            });
        });
    }

    function playerDrop() {
        player.pos.y++;
        if (collide(grid, player)) {
            player.pos.y--;
            merge(grid, player);
            playerReset();
            gridSweep();
            updateScore();
            updateLevel();
            if (gameOver) {
                endGame();
                return;
            }
        }
        dropCounter = 0;
    }

    function playerMove(dir) {
        player.pos.x += dir;
        if (collide(grid, player)) {
            player.pos.x -= dir;
        }
    }

    function playerReset() {
        if (player.next === null) {
            player.next = createPiece(pieces[Math.floor(Math.random() * pieces.length)]);
        }
        player.matrix = player.next;
        player.next = createPiece(pieces[Math.floor(Math.random() * pieces.length)]);
        player.pos.y = 0;
        player.pos.x = (grid[0].length / 2 | 0) - (player.matrix[0].length / 2 | 0);
        if (collide(grid, player)) {
            gameOver = true;
        }
    }

    function playerRotate(dir) {
        const pos = player.pos.x;
        let offset = 1;
        rotate(player.matrix, dir);
        while (collide(grid, player)) {
            player.pos.x += offset;
            offset = -(offset + (offset > 0 ? 1 : -1));
            if (offset > player.matrix[0].length) {
                rotate(player.matrix, -dir);
                player.pos.x = pos;
                return;
            }
        }
    }

    function rotate(matrix, dir) {
        for (let y = 0; y < matrix.length; ++y) {
            for (let x = 0; x < y; ++x) {
                [
                    matrix[x][y],
                    matrix[y][x],
                ] = [
                    matrix[y][x],
                    matrix[x][y],
                ];
            }
        }
        if (dir > 0) {
            matrix.forEach(row => row.reverse());
        } else {
            matrix.reverse();
        }
    }

    // פונקציה מתוקנת לבדיקת התנגשות
    function collide(grid, player) {
        const m = player.matrix;
        const o = player.pos;
        for (let y = 0; y < m.length; ++y) {
            for (let x = 0; x < m[y].length; ++x) {
                if (m[y][x] !== 0) {
                    const gridY = y + o.y;
                    const gridX = x + o.x;
                    if (
                        gridY >= grid.length || // מעבר לתחתית הלוח
                        gridX < 0 || gridX >= grid[0].length || // מעבר לצדדים
                        grid[gridY][gridX] !== 0 // התנגשות עם בלוק קיים
                    ) {
                        return true;
                    }
                }
            }
        }
        return false;
    }

    function gridSweep() {
        let rowCount = 0;
        outer: for (let y = grid.length -1; y >= 0; --y) {
            for (let x = 0; x < grid[y].length; ++x) {
                if (grid[y][x] === 0) {
                    continue outer;
                }
            }
            const row = grid.splice(y, 1)[0].fill(0);
            grid.unshift(row);
            ++y;

            rowCount++;
            player.lines++;
        }

        if (rowCount > 0) {
            player.score += rowCount * 10;
            // ניגון צליל מחיקת שורה
            playSound('assets/line-clear.mp3');
        }
    }

    function update(time = 0) {
        const deltaTime = time - lastTime;
        lastTime = time;

        dropCounter += deltaTime;
        if (dropCounter > dropInterval) {
            playerDrop();
        }

        draw();
        if (!gameOver) {
            requestAnimationFrame(update);
        }
    }

    function updateScore() {
        document.getElementById('score').innerText = 'ניקוד: ' + player.score;
    }

    function updateLevel() {
        player.level = Math.floor(player.lines / 10) + 1;
        dropInterval = 1000 - (player.level - 1) * 100;
        if (dropInterval < 100) {
            dropInterval = 100;
        }
        document.getElementById('level').innerText = 'דרגה: ' + player.level;
    }

    function resetGame() {
        grid.forEach(row => row.fill(0));
        player.score = 0;
        player.level = 1;
        player.lines = 0;
        gameOver = false;
        player.next = null;
        playerReset();
        lastTime = 0;
        dropCounter = 0;
    }

    function endGame() {
        document.getElementById('game-area').style.display = 'none';
        playerNameDisplay.innerText = playerName;
        finalScoreDisplay.innerText = player.score;
        document.getElementById('end-screen').style.display = 'block';
        backgroundMusic.pause(); // עצירת מוזיקת הרקע
        backgroundMusic.currentTime = 0; // אתחול לזמן ההתחלה
        applauseSound.play();
    }

    // קלט מהמקלדת
    document.addEventListener('keydown', event => {
        if (event.keyCode === 37) {
            // חץ שמאלה
            playerMove(-1);
            playSound('assets/move.mp3');
        } else if (event.keyCode === 39) {
            // חץ ימינה
            playerMove(1);
            playSound('assets/move.mp3');
        } else if (event.keyCode === 40) {
            // חץ למטה
            playerDrop();
            playSound('assets/drop.mp3');
        } else if (event.keyCode === 38) {
            // חץ למעלה
            playerRotate(1);
            playSound('assets/rotate.mp3');
        } else if (event.keyCode === 32) {
            // מקש רווח - נפילה מהירה
            while (!collide(grid, player)) {
                player.pos.y++;
            }
            player.pos.y--;
            playerDrop();
            playSound('assets/drop.mp3');
        }
    });

    // קלט מכפתורים למכשירים ניידים
    leftButton.addEventListener('click', () => {
        playerMove(-1);
        playSound('assets/move.mp3');
    });
    rightButton.addEventListener('click', () => {
        playerMove(1);
        playSound('assets/move.mp3');
    });
    downButton.addEventListener('click', () => {
        playerDrop();
        playSound('assets/drop.mp3');
    });
    rotateButton.addEventListener('click', () => {
        playerRotate(1);
        playSound('assets/rotate.mp3');
    });

    // פונקציה לניגון קולות
    function playSound(src) {
        const sound = new Audio(src);
        sound.play();
    }

    // התאמת הקנבס לגודל התאים
    const scale = 30;
    context.scale(scale, scale);
    nextContext.scale(scale / 2, scale / 2);
});
