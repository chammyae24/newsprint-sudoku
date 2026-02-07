import { SudokuGenerator } from './SudokuGenerator';
import { SudokuSolver } from './SudokuSolver';
import { Difficulty, SudokuCell } from './types';

// Helper to print grid
function printGrid(grid: SudokuCell[][]) {
  console.log('-------------------------');
  for (let i = 0; i < 9; i++) {
    let rowStr = '| ';
    for (let j = 0; j < 9; j++) {
      const val = grid[i][j].value;
      rowStr += (val === null ? '.' : val.toString()) + ' ';
      if ((j + 1) % 3 === 0) rowStr += '| ';
    }
    console.log(rowStr);
    if ((i + 1) % 3 === 0) console.log('-------------------------');
  }
}

function printNumberGrid(grid: number[][]) {
  console.log('-------------------------');
  for (let i = 0; i < 9; i++) {
    let rowStr = '| ';
    for (let j = 0; j < 9; j++) {
      const val = grid[i][j];
      rowStr += val.toString() + ' ';
      if ((j + 1) % 3 === 0) rowStr += '| ';
    }
    console.log(rowStr);
    if ((i + 1) % 3 === 0) console.log('-------------------------');
  }
}

const difficulty = Difficulty.EXPERT;

console.log('Generating ' + difficulty + ' puzzle...');
const { grid, solution } = SudokuGenerator.generate(difficulty);

console.log('\nGenerated Puzzle (Points indicate empty cells):');
printGrid(grid);

console.log('\nGenerated Solution:');
printNumberGrid(solution);

console.log('\nSolving (Logical)...');
const solved = SudokuSolver.solve(grid);

if (solved) {
  console.log('\nSolved Successfully (Logically)!');
  printGrid(grid);
} else {
  console.log('\nLogical Solver failed (Expected for Hard/Expert).');
  console.log('Attempting Brute Force to verify validity...');

  if (SudokuSolver.solveBruteForce(grid)) {
    console.log('\nSolved Successfully (Brute Force)!');
    printGrid(grid);
  } else {
    console.log('\nFAILED: Puzzle is invalid!');
  }
}
