const boardElement = document.getElementById('game-board');
const timerElement = document.getElementById('time');
const messageElement = document.getElementById('message');
const levelElement = document.getElementById('level');
const playerStatsElement = document.getElementById('player-stats');
const startButton = document.getElementById('start-game');

let gridSize = 10;  // Размер поля
let timeLeft = 30;
let interval;
let playerPosition = { x: 0, y: 0 };
let endPosition = { x: gridSize - 1, y: gridSize - 1 };
let walls = [];
let grid = [];
let enemies = [];
let keys = [];
let speedBoosts = [];
let slowBoosts = [];
let dynamicWalls = [];
let level = 1;
let playerSpeed = 1; // Начальная скорость
let health = 100; // Здоровье игрока

startButton.addEventListener('click', startGame);

// Генерация лабиринта
function generateMaze() {
  grid = [];
  walls = [];
  enemies = [];
  keys = [];
  speedBoosts = [];
  slowBoosts = [];
  dynamicWalls = [];

  for (let y = 0; y < gridSize; y++) {
    const row = [];
    for (let x = 0; x < gridSize; x++) {
      if (Math.random() < 0.3 && (x !== 0 || y !== 0) && (x !== gridSize - 1 || y !== gridSize - 1)) {
        row.push('wall');
        walls.push({ x, y });
      } else {
        row.push('empty');
      }
    }
    grid.push(row);
  }

  grid[0][0] = 'start';  // Начало
  grid[gridSize - 1][gridSize - 1] = 'end';  // Конец

  // Добавление врагов
  for (let i = 0; i < Math.min(level, 5); i++) {
    let enemyPosition;
    do {
      enemyPosition = { x: Math.floor(Math.random() * gridSize), y: Math.floor(Math.random() * gridSize) };
    } while (grid[enemyPosition.y][enemyPosition.x] !== 'empty');
    
    enemies.push(enemyPosition);
    grid[enemyPosition.y][enemyPosition.x] = 'enemy';
  }

  // Добавление ключей
  for (let i = 0; i < Math.min(level, 3); i++) {
    let keyPosition;
    do {
      keyPosition = { x: Math.floor(Math.random() * gridSize), y: Math.floor(Math.random() * gridSize) };
    } while (grid[keyPosition.y][keyPosition.x] !== 'empty');
    
    keys.push(keyPosition);
    grid[keyPosition.y][keyPosition.x] = 'key';
  }

  // Добавление усилений
  for (let i = 0; i < Math.min(level, 2); i++) {
    let speedUpPosition;
    do {
      speedUpPosition = { x: Math.floor(Math.random() * gridSize), y: Math.floor(Math.random() * gridSize) };
    } while (grid[speedUpPosition.y][speedUpPosition.x] !== 'empty');
    
    speedBoosts.push(speedUpPosition);
    grid[speedUpPosition.y][speedUpPosition.x] = 'speedup';
  }

  for (let i = 0; i < Math.min(level, 2); i++) {
    let slowDownPosition;
    do {
      slowDownPosition = { x: Math.floor(Math.random() * gridSize), y: Math.floor(Math.random() * gridSize) };
    } while (grid[slowDownPosition.y][slowDownPosition.x] !== 'empty');
    
    slowBoosts.push(slowDownPosition);
    grid[slowDownPosition.y][slowDownPosition.x] = 'slow';
  }

  // Динамические стены (они будут исчезать и появляться через период времени)
  for (let i = 0; i < Math.min(level, 3); i++) {
    let dynamicWallPosition;
    do {
      dynamicWallPosition = { x: Math.floor(Math.random() * gridSize), y: Math.floor(Math.random() * gridSize) };
    } while (grid[dynamicWallPosition.y][dynamicWallPosition.x] !== 'empty');
    
    dynamicWalls.push(dynamicWallPosition);
    grid[dynamicWallPosition.y][dynamicWallPosition.x] = 'dynamic-wall';
  }
}

// Отображение лабиринта
function renderBoard() {
  boardElement.innerHTML = '';
  boardElement.style.gridTemplateColumns = `repeat(${gridSize}, 30px)`;
  boardElement.style.gridTemplateRows = `repeat(${gridSize}, 30px)`;

  for (let y = 0; y < gridSize; y++) {
    for (let x = 0; x < gridSize; x++) {
      const cell = document.createElement('div');
      cell.classList.add('cell');

      if (grid[y][x] === 'wall') {
        cell.classList.add('wall');
      } else if (grid[y][x] === 'start') {
        cell.classList.add('start');
      } else if (grid[y][x] === 'end') {
        cell.classList.add('end');
      } else if (grid[y][x] === 'enemy') {
        cell.classList.add('enemy');
      } else if (grid[y][x] === 'key') {
        cell.classList.add('key');
      } else if (grid[y][x] === 'speedup') {
        cell.classList.add('speedup');
      } else if (grid[y][x] === 'slow') {
        cell.classList.add('slow');
      } else if (grid[y][x] === 'dynamic-wall') {
        cell.classList.add('dynamic-wall');
      }

      if (playerPosition.x === x && playerPosition.y === y) {
        cell.classList.add('player');
      }

      cell.addEventListener('click', () => movePlayer(x, y));
      boardElement.appendChild(cell);
    }
  }
}

// Движение игрока
function movePlayer(x, y) {
  if (Math.abs(x - playerPosition.x) + Math.abs(y - playerPosition.y) === 1) {
    if (grid[y][x] !== 'wall') {
      playerPosition = { x, y };

      // Столкновение с врагами
      if (grid[y][x] === 'enemy') {
        health -= 20;
        if (health <= 0) {
          clearInterval(interval);
          messageElement.textContent = 'Вы проиграли! Здоровье иссякло.';
        }
        updatePlayerStats();
      }

      // Собрать ключ
      if (grid[y][x] === 'key') {
        keys = keys.filter(key => !(key.x === x && key.y === y));
        messageElement.textContent = 'Вы собрали ключ!';
      }

      // Собрать усиление скорости
      if (grid[y][x] === 'speedup') {
        playerSpeed = 2; // Увеличиваем скорость
        setTimeout(() => {
          playerSpeed = 1; // Восстанавливаем нормальную скорость
        }, 5000); // Эффект длится 5 секунд
        messageElement.textContent = 'Вы увеличили скорость!';
      }

      // Собрать замедление
      if (grid[y][x] === 'slow') {
        playerSpeed = 0.5; // Замедляем игрока
        setTimeout(() => {
          playerSpeed = 1; // Восстанавливаем нормальную скорость
        }, 5000); // Эффект длится 5 секунд
        messageElement.textContent = 'Вы замедлились!';
      }

      // Динамическая стена
      if (grid[y][x] === 'dynamic-wall') {
        // Убираем стену, если она есть
        setTimeout(() => {
          grid[y][x] = 'empty'; 
          renderBoard(); 
        }, 3000); 
        messageElement.textContent = 'Динамическая стена исчезла!';
      }

      // Проверка на выход
      if (x === endPosition.x && y === endPosition.y) {
        levelUp();
      }

      renderBoard();
    }
  }
}

// Таймер
function startTimer() {
  interval = setInterval(() => {
    timeLeft--;
    timerElement.textContent = timeLeft;

    if (timeLeft === 0) {
      clearInterval(interval);
      messageElement.textContent = 'Время вышло! Попробуйте снова.';
    }
  }, 1000);
}

// Переход на следующий уровень
function levelUp() {
  level++;
  levelElement.textContent = `Уровень: ${level}`;

  if (level <= 5) {
    gridSize++;
    timeLeft = 30 - level * 2;  // Уменьшаем время на каждом уровне
  }

  messageElement.textContent = `Поздравляем! Вы прошли уровень ${level - 1}. Начинаем следующий уровень!`;
  setTimeout(startGame, 2000);
}

// Обновление статистики игрока
function updatePlayerStats() {
  playerStatsElement.textContent = `Скорость: ${playerSpeed}x | Здоровье: ${health}%`;
}

// Запуск игры
function startGame() {
  timeLeft = 30;
  playerPosition = { x: 0, y: 0 };
  health = 100;
  playerSpeed = 1;
  generateMaze();
  renderBoard();
  startTimer();
  messageElement.textContent = '';
  levelElement.textContent = `Уровень: 1`;
}