type Position = {
  x: number;
  y: number;
};

type FallingBlocks = {
  positions: [Position, Position, Position, Position];
  color: [string, string];
  type: 'normal' | 'explosive';
};

type Colors = 'orange' | 'blue' | 'green' | 'yellow' | 'red' | 'magenta';

const colors: { [key in Colors]: [string, string] } = {
  blue: ['#0077ff', '#00263b'],
  orange: ['#ff7700', '#3b2600'],
  green: ['#18b522', '#0c3d0c'],
  yellow: ['#f0e40a ', '#38320d'],
  red: ['#aa1300', '#450803'],
  magenta: ['#870cc9', '#1f052e'],
};

const allColors = Object.values(colors) as [string, string][];

const blockExplosion: Position[] = [
  { x: -1, y: 0 },
  { x: -2, y: 0 },
  { x: 1, y: 0 },
  { x: 2, y: 0 },
  { x: -1, y: -1 },
  { x: -1, y: 1 },
  { x: 1, y: 1 },
  { x: 1, y: -1 },
  { x: 0, y: 1 },
  { x: 0, y: 2 },
  { x: 0, y: -1 },
  { x: 0, y: -2 },

  { x: -3, y: 0 },
  { x: 3, y: 0 },
  { x: 0, y: 3 },
  { x: 0, y: -3 },
  { x: -1, y: 2 },
  { x: -2, y: 1 },
  { x: 2, y: 1 },
  { x: 1, y: 2 },
  { x: 2, y: -1 },
  { x: 1, y: -2 },
  { x: -1, y: -2 },
  { x: -2, y: -1 },
];

interface Difficulty {
  scoreMultiplier: number;
  updateSpeed: number;
  minUpdateSpeed: number;
  updateSpeedIncrease: number;
}

type DifficultyLevel = 'easy' | 'normal' | 'hard' | 'extreme';

type Cell = {
  element: HTMLDivElement;
  /**if its not full then its the color of the cell. */
  isFull: false | [string, string];
};

type Difficulties = {
  element: HTMLButtonElement;
  current: DifficultyLevel;
  isOpen: boolean;
  canChange: boolean;
  levels: {
    [key in DifficultyLevel]: Difficulty;
  };
};

export class Tetris {
  cells: Cell[];

  board = document.createElement('div');
  header = document.createElement('div');
  pauseBtn = document.createElement('button');
  menu = document.createElement('div');
  gameOverText = document.createElement('span');
  menuScore = document.createElement('span');

  blocks: FallingBlocks;

  keyMappings = {
    moveLeft: 'ArrowLeft',
    moveRight: 'ArrowRight',
    moveDown: 'ArrowDown',
    rotate: ' ',
  };

  score = {
    element: document.createElement('span'),
    value: 0,
  };
  highScore = {
    element: document.createElement('span'),
    value: 0,
  };

  difficulty: Difficulties = {
    element: document.createElement('button'),
    current: 'normal',
    isOpen: false,
    canChange: true,
    levels: {
      easy: {
        updateSpeed: 1000,
        minUpdateSpeed: 1000,
        scoreMultiplier: 0.75,
        updateSpeedIncrease: 0,
      },
      normal: {
        updateSpeed: 750,
        minUpdateSpeed: 500,
        scoreMultiplier: 1,
        updateSpeedIncrease: 5,
      },
      hard: {
        updateSpeed: 500,
        minUpdateSpeed: 300,
        scoreMultiplier: 1.5,
        updateSpeedIncrease: 10,
      },
      extreme: {
        updateSpeed: 250,
        minUpdateSpeed: 100,
        scoreMultiplier: 2,
        updateSpeedIncrease: 10,
      },
    },
  };
  updateSpeed = this.currentDifficulty.updateSpeed;

  public get currentDifficulty(): Difficulty {
    return this.difficulty.levels[this.difficulty.current];
  }

  timeout: NodeJS.Timeout | null = null;
  isInPause = false;

  constructor(public readonly columns: number, public readonly rows: number, public cellSize = 30) {
    const highScore = localStorage.getItem('highScore');
    if (highScore) {
      this.highScore.value = +highScore;
    }
    const difficulty = localStorage.getItem('difficulty');
    if (difficulty && difficulty in this.difficulty.levels) {
      this.changeDifficulty(difficulty as DifficultyLevel);
    }

    this.createHeader();
    this.createMenu();
    this.initBoard();

    this.cells = this.createCells(columns, rows);

    this.blocks = createFallingBlock(columns);

    window.addEventListener('keydown', this.keyListener.bind(this));

    this.update();
    this.loop();

    this.playPause();
  }

  private createCells(width: number, height: number): Cell[] {
    return Array(width * height + width)
      .fill(null)
      .map<Cell>(() => {
        const element = document.createElement('div');
        element.className = 'cell';
        element.style.width = `${this.cellSize}px`;
        element.style.height = `${this.cellSize}px`;
        this.board.appendChild(element);
        return {
          isFull: false,
          element,
        };
      });
  }

  private initBoard() {
    this.board.className = 'board';
    this.board.style.gridTemplateColumns = `${this.cellSize}px `.repeat(this.columns);
    document.body.appendChild(this.board);
  }

  private loop() {
    if (this.timeout) {
      clearTimeout(this.timeout);
    }
    this.timeout = setTimeout(() => {
      if (!this.isInPause) {
        this.update();
        this.loop();
      }
    }, this.updateSpeed);
  }

  private playPause() {
    if (this.timeout) clearTimeout(this.timeout);
    if (!this.isInPause) {
      this.timeout = null;
      this.isInPause = true;
      this.menu.style.display = 'flex';
      this.highScore.element.textContent = this.highScore.value.toString();
      this.menuScore.textContent = this.score.value.toString();
      this.pauseBtn.innerHTML = '<i class="fas fa-play"></i>';
    } else {
      this.gameOverText.textContent = '';
      this.isInPause = false;
      this.menu.style.display = 'none';
      this.pauseBtn.innerHTML = '<i class="fas fa-pause"></i>';
      this.loop();
    }
  }

  private createMenu() {
    const menuText = document.createElement('span');
    menuText.textContent = 'Menu';
    menuText.className = 'menu-text';
    this.menu.appendChild(menuText);

    this.board.appendChild(this.menu);
    this.menu.className = 'menu';
    this.menu.style.display = 'none';

    this.gameOverText.className = 'game-over';
    this.menu.appendChild(this.gameOverText);

    const highScoreDiv = document.createElement('div');
    highScoreDiv.className = 'high-score';
    highScoreDiv.textContent = 'High Score: ';
    this.highScore.element.textContent = this.highScore.value.toString();
    highScoreDiv.appendChild(this.highScore.element);
    this.menu.appendChild(highScoreDiv);

    const scoreDiv = document.createElement('div');
    scoreDiv.className = 'text';
    scoreDiv.textContent = 'Your Score: ';

    scoreDiv.appendChild(this.menuScore);
    this.menu.appendChild(scoreDiv);

    const playBtn = document.createElement('button');
    playBtn.innerHTML = '<i class="fas fa-play"></i> Play';

    playBtn.addEventListener('click', () => {
      this.playPause();
      this.difficulty.canChange = false;
      this.difficulty.element.disabled = true;
      this.difficulty.element.style.cursor = 'default';
      playBtn.blur();
    });
    this.menu.appendChild(playBtn);

    this.difficulty.element.textContent = capitalize(this.difficulty.current);
    this.difficulty.element.className = 'difficulty-select';
    this.difficulty.element.style.cursor = 'pointer';

    this.difficulty.element.addEventListener('click', () => {
      this.difficulty.element.style.cursor = 'default';

      if (!this.difficulty.isOpen && this.difficulty.canChange) {
        this.difficulty.element.textContent = '';
        for (const key in this.difficulty.levels) {
          if (this.difficulty.levels.hasOwnProperty(key)) {
            const element = document.createElement('div');
            element.className = 'difficulty-select-button';
            element.textContent = capitalize(key);
            element.addEventListener('click', () => {
              this.changeDifficulty(key as DifficultyLevel);
              setTimeout(() => this.closeDifficultySelect(), 0);
            });
            this.difficulty.element.appendChild(element);
          }
        }
        this.difficulty.isOpen = true;
      }
    });
    this.difficulty.element.addEventListener('blur', () => this.closeDifficultySelect());
    this.menu.appendChild(this.difficulty.element);
  }

  private closeDifficultySelect() {
    this.difficulty.element.style.cursor = 'pointer';
    this.difficulty.element.innerHTML = capitalize(this.difficulty.current);
    this.difficulty.isOpen = false;
  }

  private changeDifficulty(level: DifficultyLevel) {
    this.difficulty.current = level;
    this.updateSpeed = this.currentDifficulty.updateSpeed;
    localStorage.setItem('difficulty', this.difficulty.current);
  }

  private createHeader() {
    this.board.appendChild(this.header);
    this.header.className = 'header';

    this.pauseBtn.addEventListener('click', () => {
      this.playPause();
      this.pauseBtn.blur();
    });
    this.pauseBtn.innerHTML = '<i class="fas fa-pause"></i>';
    this.header.appendChild(this.pauseBtn);
    const resetBtn = document.createElement('button');
    resetBtn.addEventListener('click', () => {
      this.reset();
      resetBtn.blur();
    });
    resetBtn.innerHTML = '<i class="fas fa-redo"></i>';
    this.header.appendChild(resetBtn);

    this.header.appendChild(this.score.element);
    this.score.element.className = 'score';
  }

  private resetBoard() {
    for (let i = 0; i < this.cells.length; i++) {
      const cell = this.cells[i];
      cell.isFull = false;
    }
  }

  private keyListener(e: KeyboardEvent) {
    // console.log(e.key);
    if (!this.isInPause) {
      switch (e.key) {
        case this.keyMappings.moveLeft:
          const mostLeft = this.blockBounds('min', 'x');
          if (mostLeft > 0) {
            // TODO Check for collisions
            this.blocks.positions.forEach((pos) => pos.x--);
            this.update(false);
          }

          break;
        case this.keyMappings.moveRight:
          const mostRight = this.blockBounds('max', 'x');
          // TODO Check for collisions
          if (mostRight < this.columns - 1) {
            this.blocks.positions.forEach((pos) => pos.x++);
            this.update(false);
          }

          break;
        case this.keyMappings.moveDown:
          this.update(true);
          break;
        case this.keyMappings.rotate:
          this.rotateBlocks();
          this.update(false);
          break;
        default:
          break;
      }
    }
  }

  private rotateBlocks() {
    // TODO check for collision
    const sin = Math.sin(radians(90));
    const cos = Math.cos(radians(90));
    const xMax = this.blockBounds('max', 'x');
    const xMin = this.blockBounds('min', 'x');
    const yMax = this.blockBounds('max', 'y');
    const yMin = this.blockBounds('min', 'y');
    const center: Position = {
      x: Math.floor(xMin + (xMax - xMin) / 2),
      y: Math.floor(yMin + (yMax - yMin) / 2),
    };

    this.blocks.positions.forEach((pos, i) => {
      pos.x -= center.x;
      pos.y -= center.y;
      const xNew = pos.x * cos - pos.y * sin;
      const yNew = pos.x * sin + pos.y * cos;
      pos.x = xNew + center.x;
      pos.y = yNew + center.y;
    });
    const newMinX = this.blockBounds('min', 'x');
    // TODO fix rotation, the if below is just a hack to not let the blocks go through the wall.
    if (newMinX < 0) {
      this.blocks.positions.forEach((pos, i) => (pos.x += 2));
    }
  }

  private blockBounds(type: 'min' | 'max', axis: 'y' | 'x') {
    return Math[type](
      this.blocks.positions[0][axis],
      this.blocks.positions[1][axis],
      this.blocks.positions[2][axis],
      this.blocks.positions[3][axis]
    );
  }

  private update(moveDown = true) {
    if (this.checkGameOver()) {
      this.reset(true);
      return;
    }

    let blocksCollided = false;

    const firstBlock = positionToIndex(this.blocks.positions[0], this.columns);
    const secondBlock = positionToIndex(this.blocks.positions[1], this.columns);
    const thirdBlock = positionToIndex(this.blocks.positions[2], this.columns);
    const fourthBlock = positionToIndex(this.blocks.positions[3], this.columns);
    const lowestPoint = this.blockBounds('max', 'y');
    if (lowestPoint === this.rows) {
      blocksCollided = true;
    }
    this.checkFullRows();
    for (let i = 0; i < this.cells.length; i++) {
      const element = this.cells[i].element;
      const isFull = this.cells[i].isFull;
      const isNextCellFull = this.cells[i + this.columns]?.isFull;
      // const x = i % this.width;

      // const y = (i / this.width) | 0;
      if (!isFull) {
        // set background color of empty cell.
        element.style.opacity = '0';
      } else {
        element.style.opacity = '1';
        // set background color of filled cell.
        element.style.background = this.convertColor(isFull);
      }
      switch (i) {
        case firstBlock:
        case secondBlock:
        case thirdBlock:
        case fourthBlock:
          element.style.background = this.convertColor(this.blocks.color);
          element.style.opacity = '1';
          if (isNextCellFull) {
            blocksCollided = true;
          }
          break;
      }
    }

    if (blocksCollided) {
      if (this.blocks.type === 'explosive') {
        const [pos] = this.blocks.positions;

        this.cells[positionToIndex(pos, this.columns)].isFull = false;

        for (const offPos of blockExplosion) {
          const x = pos.x + offPos.x;
          const y = pos.y + offPos.y;
          const newY = y >= 0 && y <= this.rows ? y : pos.y;
          const newX = x >= 0 && x < this.columns ? x : pos.x;
          const index = positionToIndex({ x: newX, y: newY }, this.columns);
          if (index < this.cells.length) {
            this.cells[index].isFull = false;
          }
        }
      } else {
        this.blocks.positions.forEach((pos) => {
          const index = positionToIndex(pos, this.columns);

          this.cells[index].isFull = this.blocks.color;
        });
      }
      this.resetBlocks();
    } else if (moveDown) {
      this.blocks.positions.forEach((pos) => pos.y++);
    }
  }
  private checkGameOver() {
    for (let i = 0; i < this.columns; i++) {
      const cell = this.cells[i];
      if (cell.isFull) {
        return true;
      }
    }
    return false;
  }

  private checkFullRows() {
    let score = 0;
    let scoreMultiplier = 0;
    for (let i = this.columns; i < this.cells.length; i += this.columns) {
      const row = this.cells.slice(i, i + this.columns);
      let isRowFull = true;
      for (let j = 0; j < row.length; j++) {
        const cell = row[j];
        if (!cell.isFull) {
          isRowFull = false;
        }
      }
      if (isRowFull) {
        score += 100;
        scoreMultiplier++;
        row.forEach((cell) => (cell.isFull = false));
        for (let k = i + this.columns - 1; k > 0; k--) {
          const cell = this.cells[k];
          const nextCell = this.cells[k - this.columns];
          if (nextCell) {
            cell.isFull = nextCell.isFull;
          } else {
            cell.isFull = false;
          }
        }
      }
    }

    this.score.value += score * scoreMultiplier * this.currentDifficulty.scoreMultiplier;
    this.score.element.textContent = this.score.value.toString();

    this.updateSpeed = Math.max(
      this.currentDifficulty.minUpdateSpeed,
      this.updateSpeed - this.currentDifficulty.updateSpeedIncrease * scoreMultiplier
    );
  }

  private convertColor(color: [string, string]) {
    return `radial-gradient(circle, ${color[0]} 10%, ${color[1]} 100%)`;
  }

  private reset(gameOver = false) {
    if (gameOver) {
      if (this.score.value > this.highScore.value) {
        this.highScore.value = this.score.value;
        localStorage.setItem('highScore', this.highScore.value.toString());
      }
      this.difficulty.canChange = true;
      this.difficulty.element.disabled = false;
      this.difficulty.element.style.cursor = 'pointer';
      this.gameOverText.textContent = 'Game Over';
      this.playPause();
    }
    this.updateSpeed = this.currentDifficulty.updateSpeed;
    this.resetBlocks();
    this.resetBoard();
    this.score.value = 0;
  }

  private resetBlocks() {
    this.blocks = createFallingBlock(this.columns);
  }
}

function createFallingBlock(width: number): FallingBlocks {
  const xOffset = Math.floor(Math.random() * (width - 3));
  const explosive = Math.random() < 0.05;
  if (explosive) {
    return {
      positions: [
        { y: 0, x: xOffset },
        { y: 0, x: xOffset },
        { y: 0, x: xOffset },
        { y: 0, x: xOffset },
      ],
      color: ['#000', '#666'],
      type: 'explosive',
    };
  }
  return {
    positions: shapes[Math.floor(Math.random() * shapes.length)](xOffset),
    color: allColors[Math.floor(Math.random() * allColors.length)],
    type: 'normal',
  };
}

const shapes: ((xOffset: number) => FallingBlocks['positions'])[] = [
  /**L Shape */
  (xOffset) => [
    { y: 0, x: xOffset },
    { y: 0, x: xOffset + 1 },
    { y: 0, x: xOffset + 2 },
    { y: 1, x: xOffset + 2 },
  ],
  /**L Shape */
  (xOffset) => [
    { y: 0, x: xOffset },
    { y: 1, x: xOffset },
    { y: 0, x: xOffset + 1 },
    { y: 0, x: xOffset + 2 },
  ],
  /**Line Shape */
  (xOffset) => [
    { y: 0, x: xOffset },
    { y: 0, x: xOffset + 1 },
    { y: 0, x: xOffset + 2 },
    { y: 0, x: xOffset + 3 },
  ],
  /**Line Shape 2 */
  (xOffset) => [
    { y: 0, x: xOffset },
    { y: 1, x: xOffset },
    { y: 2, x: xOffset },
    { y: 3, x: xOffset },
  ],
  /**T Shape */
  (xOffset) => [
    { y: 0, x: xOffset },
    { y: 0, x: xOffset + 1 },
    { y: 1, x: xOffset + 1 },
    { y: 0, x: xOffset + 2 },
  ],
  /**Block Shape */
  (xOffset) => [
    { y: 0, x: xOffset },
    { y: 1, x: xOffset },
    { y: 0, x: xOffset + 1 },
    { y: 1, x: xOffset + 1 },
  ],
  /**Block Shape 2 */
  (xOffset) => [
    { y: 0, x: xOffset },
    { y: 1, x: xOffset },
    { y: 0, x: xOffset + 1 },
    { y: 1, x: xOffset + 1 },
  ],
  /**S Shape */
  (xOffset) => [
    { y: 0, x: xOffset },
    { y: 0, x: xOffset + 1 },
    { y: 1, x: xOffset + 1 },
    { y: 1, x: xOffset + 2 },
  ],
  /**S Reversed Shape */
  (xOffset) => [
    { y: 1, x: xOffset },
    { y: 1, x: xOffset + 1 },
    { y: 0, x: xOffset + 1 },
    { y: 0, x: xOffset + 2 },
  ],
];

export function positionToIndex({ x, y }: Position, width: number) {
  return x + width * y;
}

function radians(degrees: number) {
  return degrees * (Math.PI / 180);
}

function capitalize(word: string) {
  return `${word[0].toLocaleUpperCase()}${word.slice(1)}`;
}
