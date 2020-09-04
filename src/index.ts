import './index.sass';
import { Tetris } from './tetris';
const version = '1.0.3';

const rows = 20;
const cellSize = () =>
  Math.round(
    Math.min(
      35,
      Math.max(16, (window.innerHeight - (window.innerHeight <= 800 ? 200 : 300)) / rows)
    )
  );
new Tetris(10, rows, cellSize());

console.log(
  `%cv${version}`,
  `
background: #1b0a1baa;
padding: 3rem;
border-radius: 20px;
font-size: 4rem;
font-weight: bold;
text-align: center;
color: white;
text-shadow: 1.5px 1.5px 1px red, -1.5px -1.5px 1px blue;
`
);
