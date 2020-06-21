import './index.sass';
import { Tetris } from './tetris';
const version = '1.0.1';
new Tetris(10, 20, 30);
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
