document.addEventListener('DOMContentLoaded', () => {
    // 游戏配置
    const config = {
        gridSize: 4,
        startTiles: 2,
        animationSpeed: 150
    };

    // 游戏状态
    let grid = [];
    let score = 0;
    let bestScore = localStorage.getItem('2048-best-score') || 0;
    let gameOver = false;
    let won = false;
    let moved = false;
    let moveCount = 0;
    let startTime = null;
    let timerInterval = null;
    let gameTime = 0;
    let maxTile = 0;
    let history = [];
    let gameMode = '4x4';

    // DOM元素
    const gridContainer = document.getElementById('grid');
    const scoreElement = document.getElementById('score');
    const bestScoreElement = document.getElementById('best-score');
    const finalScoreElement = document.getElementById('final-score');
    const moveCountElement = document.getElementById('move-count');
    const gameTimeElement = document.getElementById('game-time');
    const maxTileElement = document.getElementById('max-tile');
    const gameOverMessage = document.getElementById('game-over');
    const winMessage = document.getElementById('win-message');
    const newGameButton = document.getElementById('new-game');
    const undoButton = document.getElementById('undo');
    const tryAgainButton = document.getElementById('try-again');
    const keepPlayingButton = document.getElementById('keep-playing');
    const newGameWinButton = document.getElementById('new-game-win');
    const modeButtons = document.querySelectorAll('.mode-btn');
    const touchButtons = document.querySelectorAll('.touch-btn');

    // 初始化游戏
    function initGame() {
        // 根据模式设置网格大小
        switch(gameMode) {
            case '5x5':
                config.gridSize = 5;
                config.startTiles = 3;
                break;
            case '6x6':
                config.gridSize = 6;
                config.startTiles = 4;
                break;
            default:
                config.gridSize = 4;
                config.startTiles = 2;
        }

        // 重置游戏状态
        grid = createEmptyGrid();
        score = 0;
        gameOver = false;
        won = false;
        moved = false;
        moveCount = 0;
        gameTime = 0;
        maxTile = 0;
        history = [];
        
        // 更新UI
        updateScore();
        moveCountElement.textContent = moveCount;
        maxTileElement.textContent = maxTile;
        
        // 隐藏游戏结束和胜利消息
        gameOverMessage.style.display = 'none';
        winMessage.style.display = 'none';
        
        // 清空网格
        gridContainer.innerHTML = '';
        gridContainer.className = `grid grid-${gameMode}`;
        
        // 创建网格单元格
        createGridCells();
        
        // 添加初始方块
        for (let i = 0; i < config.startTiles; i++) {
            addRandomTile();
        }
        
        // 开始计时器
        startTimer();
        
        // 更新网格显示
        updateGrid();
        
        // 保存初始状态到历史记录
        saveState();
    }

    // 创建空网格
    function createEmptyGrid() {
        const newGrid = [];
        for (let i = 0; i < config.gridSize; i++) {
            newGrid[i] = [];
            for (let j = 0; j < config.gridSize; j++) {
                newGrid[i][j] = 0;
            }
        }
        return newGrid;
    }

    // 创建网格单元格
    function createGridCells() {
        const cellSize = 100 / config.gridSize;
        
        // 设置网格容器样式
        gridContainer.style.display = 'grid';
        gridContainer.style.gridTemplateColumns = `repeat(${config.gridSize}, 1fr)`;
        gridContainer.style.gridTemplateRows = `repeat(${config.gridSize}, 1fr)`;
        gridContainer.style.gap = '15px';
        
        // 创建单元格
        for (let i = 0; i < config.gridSize * config.gridSize; i++) {
            const cell = document.createElement('div');
            cell.className = 'grid-cell';
            cell.style.width = `calc((100% - ${15 * (config.gridSize - 1)}px) / ${config.gridSize})`;
            cell.style.height = cell.style.width;
            cell.style.paddingBottom = cell.style.width; // 保持正方形
            gridContainer.appendChild(cell);
        }
    }

    // 添加随机方块
    function addRandomTile() {
        const emptyCells = [];
        
        // 查找所有空单元格
        for (let i = 0; i < config.gridSize; i++) {
            for (let j = 0; j < config.gridSize; j++) {
                if (grid[i][j] === 0) {
                    emptyCells.push({x: i, y: j});
                }
            }
        }
        
        if (emptyCells.length > 0) {
            // 随机选择一个空单元格
            const randomCell = emptyCells[Math.floor(Math.random() * emptyCells.length)];
            
            // 90%概率生成2，10%概率生成4
            const value = Math.random() < 0.9 ? 2 : 4;
            
            // 设置方块值
            grid[randomCell.x][randomCell.y] = value;
            
            // 创建方块元素
            createTile(randomCell.x, randomCell.y, value);
            
            return true;
        }
        
        return false;
    }

    // 创建方块元素
    function createTile(x, y, value, isNew = true) {
        const tile = document.createElement('div');
        tile.className = `tile tile-${value}`;
        tile.textContent = value;
        tile.dataset.x = x;
        tile.dataset.y = y;
        tile.dataset.value = value;
        
        // 计算位置
        const cellSize = 100 / config.gridSize;
        const gap = 15;
        const size = `calc(${cellSize}% - ${gap}px)`;
        
        tile.style.width = size;
        tile.style.height = size;
        tile.style.left = `calc(${y * cellSize}% + ${y * gap}px)`;
        tile.style.top = `calc(${x * cellSize}% + ${x * gap}px)`;
        
        // 新方块添加动画
        if (isNew) {
            tile.style.opacity = '0';
            tile.style.transform = 'scale(0)';
            
            setTimeout(() => {
                tile.style.opacity = '1';
                tile.style.transform = 'scale(1)';
            }, 50);
        }
        
        gridContainer.appendChild(tile);
    }

    // 更新网格显示
    function updateGrid() {
        // 移除所有现有的方块
        const tiles = document.querySelectorAll('.tile');
        tiles.forEach(tile => tile.remove());
        
        // 重新创建所有方块
        for (let i = 0; i < config.gridSize; i++) {
            for (let j = 0; j < config.gridSize; j++) {
                if (grid[i][j] !== 0) {
                    createTile(i, j, grid[i][j], false);
                    
                    // 更新最大方块
                    if (grid[i][j] > maxTile) {
                        maxTile = grid[i][j];
                        maxTileElement.textContent = maxTile;
                    }
                }
            }
        }
    }

    // 移动方块
    function move(direction) {
        if (gameOver) return false;
        
        // 保存移动前的状态
        const prevGrid = JSON.parse(JSON.stringify(grid));
        const prevScore = score;
        
        moved = false;
        
        switch(direction) {
            case 'up':
                moveUp();
                break;
            case 'down':
                moveDown();
                break;
            case 'left':
                moveLeft();
                break;
            case 'right':
                moveRight();
                break;
        }
        
        // 如果发生了移动
        if (moved) {
            // 添加新方块
            addRandomTile();
            
            // 更新移动次数
            moveCount++;
            moveCountElement.textContent = moveCount;
            
            // 更新分数显示
            updateScore();
            
            // 更新网格显示
            updateGrid();
            
            // 检查游戏状态
            checkGameState();
            
            // 保存状态到历史记录
            saveState(prevGrid, prevScore);
            
            return true;
        }
        
        return false;
    }

    // 向上移动
    function moveUp() {
        for (let j = 0; j < config.gridSize; j++) {
            for (let i = 1; i < config.gridSize; i++) {
                if (grid[i][j] !== 0) {
                    let newRow = i;
                    while (newRow > 0 && grid[newRow - 1][j] === 0) {
                        newRow--;
                    }
                    
                    if (newRow !== i) {
                        grid[newRow][j] = grid[i][j];
                        grid[i][j] = 0;
                        moved = true;
                    }
                    
                    // 合并相同数字
                    if (newRow > 0 && grid[newRow - 1][j] === grid[newRow][j]) {
                        grid[newRow - 1][j] *= 2;
                        grid[newRow][j] = 0;
                        score += grid[newRow - 1][j];
                        moved = true;
                    }
                }
            }
        }
    }

    // 向下移动
    function moveDown() {
        for (let j = 0; j < config.gridSize; j++) {
            for (let i = config.gridSize - 2; i >= 0; i--) {
                if (grid[i][j] !== 0) {
                    let newRow = i;
                    while (newRow < config.gridSize - 1 && grid[newRow + 1][j] === 0) {
                        newRow++;
                    }
                    
                    if (newRow !== i) {
                        grid[newRow][j] = grid[i][j];
                        grid[i][j] = 0;
                        moved = true;
                    }
                    
                    // 合并相同数字
                    if (newRow < config.gridSize - 1 && grid[newRow + 1][j] === grid[newRow][j]) {
                        grid[newRow + 1][j] *= 2;
                        grid[newRow][j] = 0;
                        score += grid[newRow + 1][j];
                        moved = true;
                    }
                }
            }
        }
    }

    // 向左移动
    function moveLeft() {
        for (let i = 0; i < config.gridSize; i++) {
            for (let j = 1; j < config.gridSize; j++) {
                if (grid[i][j] !== 0) {
                    let newCol = j;
                    while (newCol > 0 && grid[i][newCol - 1] === 0) {
                        newCol--;
                    }
                    
                    if (newCol !== j) {
                        grid[i][newCol] = grid[i][j];
                        grid[i][j] = 0;
                        moved = true;
                    }
                    
                    // 合并相同数字
                    if (newCol > 0 && grid[i][newCol - 1] === grid[i][newCol]) {
                        grid[i][newCol - 1] *= 2;
                        grid[i][newCol] = 0;
                        score += grid[i][newCol - 1];
                        moved = true;
                    }
                }
            }
        }
    }

    // 向右移动
    function moveRight() {
        for (let i = 0; i < config.gridSize; i++) {
            for (let j = config.gridSize - 2; j >= 0; j--) {
                if (grid[i][j] !== 0) {
                    let newCol = j;
                    while (newCol < config.gridSize - 1 && grid[i][newCol + 1] === 0) {
                        newCol++;
                    }
                    
                    if (newCol !== j) {
                        grid[i][newCol] = grid[i][j];
                        grid[i][j] = 0;
                        moved = true;
                    }
                    
                    // 合并相同数字
                    if (newCol < config.gridSize - 1 && grid[i][newCol + 1] === grid[i][newCol]) {
                        grid[i][newCol + 1] *= 2;
                        grid[i][newCol] = 0;
                        score += grid[i][newCol + 1];
                        moved = true;
                    }
                }
            }
        }
    }

    // 检查游戏状态
    function checkGameState() {
        // 检查是否获胜（达到2048）
        if (!won) {
            for (let i = 0; i < config.gridSize; i++) {
                for (let j = 0; j < config.gridSize; j++) {
                    if (grid[i][j] === 2048) {
                        won = true;
                        winMessage.style.display = 'flex';
                        return;
                    }
                }
            }
        }
        
        // 检查是否还有空单元格
        for (let i = 0; i < config.gridSize; i++) {
            for (let j = 0; j < config.gridSize; j++) {
                if (grid[i][j] === 0) {
                    return; // 还有空位，游戏继续
                }
            }
        }
        
        // 检查是否还有可能的合并
        for (let i = 0; i < config.gridSize; i++) {
            for (let j = 0; j < config.gridSize; j++) {
                const current = grid[i][j];
                
                // 检查右侧
                if (j < config.gridSize - 1 && grid[i][j + 1] === current) {
                    return; // 可以向右合并
                }
                
                // 检查下方
                if (i < config.gridSize - 1 && grid[i + 1][j] === current) {
                    return; // 可以向下合并
                }
            }
        }
        
        // 游戏结束
        gameOver = true;
        gameOverMessage.style.display = 'flex';
        finalScoreElement.textContent = score;
        clearInterval(timerInterval);
    }

    // 更新分数显示
    function updateScore() {
        scoreElement.textContent = score;
        
        // 更新最高分
        if (score > bestScore) {
            bestScore = score;
            localStorage.setItem('2048-best-score', bestScore);
            bestScoreElement.textContent = bestScore;
        }
    }

    // 开始计时器
    function startTimer() {
        if (timerInterval) {
            clearInterval(timerInterval);
        }
        
        startTime = Date.now();
        
        timerInterval = setInterval(() => {
            gameTime = Math.floor((Date.now() - startTime) / 1000);
            const minutes = Math.floor(gameTime / 60);
            const seconds = gameTime % 60;
            gameTimeElement.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }, 1000);
    }

    // 保存游戏状态
    function saveState(prevGrid = null, prevScore = null) {
        const state = {
            grid: JSON.parse(JSON.stringify(grid)),
            score: score,
            moveCount: moveCount,
            gameTime: gameTime,
            maxTile: maxTile
        };
        
        history.push(state);
        
        // 限制历史记录长度
        if (history.length > 10) {
            history.shift();
        }
    }

    // 撤销上一步
    function undo() {
        if (history.length > 1) {
            // 移除当前状态
            history.pop();
            
            // 获取上一个状态
            const prevState = history[history.length - 1];
            
            // 恢复状态
            grid = JSON.parse(JSON.stringify(prevState.grid));
            score = prevState.score;
            moveCount = prevState.moveCount;
            gameTime = prevState.gameTime;
            maxTile = prevState.maxTile;
            
            // 更新UI
            updateScore();
            updateGrid();
            moveCountElement.textContent = moveCount;
            maxTileElement.textContent = maxTile;
            
            // 隐藏游戏结束和胜利消息
            gameOverMessage.style.display = 'none';
            winMessage.style.display = 'none';
            
            gameOver = false;
            won = false;
        }
    }

    // 键盘控制
    document.addEventListener('keydown', (e) => {
        if (gameOver && !won) return;
        
        switch(e.key) {
            case 'ArrowUp':
                e.preventDefault();
                move('up');
                break;
            case 'ArrowDown':
                e.preventDefault();
                move('down');
                break;
            case 'ArrowLeft':
                e.preventDefault();
                move('left');
                break;
            case 'ArrowRight':
                e.preventDefault();
                move('right');
                break;
            case 'r':
            case 'R':
                if (e.ctrlKey) {
                    e.preventDefault();
                    initGame();
                }
                break;
            case 'z':
            case 'Z':
                if (e.ctrlKey) {
                    e.preventDefault();
                    undo();
                }
                break;
        }
    });

    // 触摸控制
    touchButtons.forEach(button => {
        button.addEventListener('click', () => {
            const direction = button.id;
            move(direction);
        });
        
        // 添加触摸事件防止滚动
        button.addEventListener('touchstart', (e) => {
            e.preventDefault();
            button.style.transform = 'scale(0.95)';
        });
        
        button.addEventListener('touchend', (e) => {
            e.preventDefault();
            button.style.transform = '';
        });
    });

    // 按钮事件
    newGameButton.addEventListener('click', initGame);
    undoButton.addEventListener('click', undo);
    tryAgainButton.addEventListener('click', initGame);
    keepPlayingButton.addEventListener('click', () => {
        winMessage.style.display = 'none';
    });
    newGameWinButton.addEventListener('click', initGame);

    // 游戏模式切换
    modeButtons.forEach(button => {
        button.addEventListener('click', () => {
            // 移除所有按钮的active类
            modeButtons.forEach(btn => btn.classList.remove('active'));
            
            // 给当前按钮添加active类
            button.classList.add('active');
            
            // 设置游戏模式
            gameMode = button.id.replace('mode-', '');
            
            // 重新开始游戏
            initGame();
        });
    });

    // 初始化游戏
    initGame();
    
    // 初始化最高分显示
    bestScoreElement.textContent = bestScore;
});