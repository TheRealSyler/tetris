type Position = {
  x: number;
  y: number;
};

type FallingBlocks = {
  positions: [Position, Position, Position, Position];
  color: [string, string];
};

type Colors = 'orange' | 'blue';

const colors: { [key in Colors]: [string, string] } = {
  blue: ['#0077ff', '#00263b'],
  orange: ['#ff7700', '#3b2600'],
};

const allColors = Object.values(colors) as [string, string][];

type Cell = {
  element: HTMLDivElement;
  /**if its not full then its the color of the cell. */
  isFull: false | [string, string];
};

export class Tetris {
  cells: Cell[];

  board = document.createElement('div');

  blocks: FallingBlocks;

  keyMappings = {
    moveLeft: 'ArrowLeft',
    moveRight: 'ArrowRight',
    moveDown: 'ArrowDown',
    rotate: ' ',
  };

  constructor(public width: number, public height: number) {
    this.cells = Array(width * height)
      .fill(null)
      .map<Cell>(() => {
        const element = document.createElement('div');
        element.className = 'cell';
        element.style.width = '30px';
        element.style.height = '30px';
        this.board.appendChild(element);
        return {
          isFull: false,
          element,
        };
      });
    this.board.className = 'board';
    this.board.style.display = 'grid';
    this.board.style.gridGap = '2px';
    this.board.style.position = 'absolute';
    this.board.style.left = '50%';
    this.board.style.transform = 'translate(-50%)';
    this.board.style.top = '80px';
    this.board.style.gridTemplateColumns = `${30}px `.repeat(width);

    document.body.appendChild(this.board);

    this.blocks = createFallingBlock(width);

    window.addEventListener('keydown', this.keyListener.bind(this));

    this.update();
    // setInterval(() => {
    //   this.update();
    // }, 1000);

    const resetBtn = document.createElement('button');
    resetBtn.addEventListener('click', () => {
      this.resetBoard(), this.resetBlocks();
      this.update();
    });
    resetBtn.textContent = 'Reset';
    document.body.appendChild(resetBtn);
    console.log(this.cells);
  }

  resetBoard() {
    for (let i = 0; i < this.cells.length; i++) {
      const cell = this.cells[i];
      cell.element.style.color = 'gray';
      cell.isFull = false;
    }
  }

  keyListener(e: KeyboardEvent) {
    console.log(e.key);
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
        if (mostRight < this.width - 1) {
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

  rotateBlocks() {
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

  update(moveDown = true) {
    let blocksCollided = false;

    const firstBlock = positionToIndex(this.blocks.positions[0], this.width);
    const secondBlock = positionToIndex(this.blocks.positions[1], this.width);
    const thirdBlock = positionToIndex(this.blocks.positions[2], this.width);
    const fourthBlock = positionToIndex(this.blocks.positions[3], this.width);
    const lowestPoint = this.blockBounds('max', 'y');
    if (lowestPoint === this.height) {
      blocksCollided = true;
    }
    this.checkFullRows();
    for (let i = 0; i < this.cells.length; i++) {
      const element = this.cells[i].element;
      const isFull = this.cells[i].isFull;
      const isNextCellFull = this.cells[Math.max(i + this.width, this.height)]?.isFull;

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
      this.blocks.positions.forEach((pos) => {
        this.cells[positionToIndex(pos, this.width)].isFull = this.blocks.color;
      });
      this.resetBlocks();
    } else if (moveDown) {
      this.blocks.positions.forEach((pos) => pos.y++);
    }
  }

  private checkFullRows() {
    for (let i = 0; i < this.cells.length; i += this.width) {
      const row = this.cells.slice(i, i + this.width);
      let isRowFull = true;
      for (let j = 0; j < row.length; j++) {
        const cell = row[j];
        if (!cell.isFull) {
          isRowFull = false;
        }
      }
      if (isRowFull) {
        row.forEach((cell) => (cell.isFull = false));
        for (let k = i + this.width - 1; k > 0; k--) {
          const cell = this.cells[k];
          console.log(cell, k, i);
          const nextCell = this.cells[k - this.width];
          if (nextCell) {
            cell.isFull = nextCell.isFull;
          } else {
            cell.isFull = false;
          }
        }
      }
    }
  }

  convertColor(color: [string, string]) {
    return `radial-gradient(circle, ${color[0]} 10%, ${color[1]} 100%)`;
  }

  resetBlocks() {
    this.blocks = createFallingBlock(this.width);
  }
}

function createFallingBlock(width: number): FallingBlocks {
  const xOffset = Math.floor(Math.random() * (width - 3));

  return {
    positions: shapes[Math.floor(Math.random() * shapes.length)](xOffset),
    color: allColors[Math.floor(Math.random() * allColors.length)],
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

function positionToIndex({ x, y }: Position, width: number) {
  return x + width * y - width;
}

function radians(degrees: number) {
  return degrees * (Math.PI / 180);
}
