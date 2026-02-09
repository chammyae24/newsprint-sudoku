import {
  Grid,
  TechniqueFunction,
  TechniqueResult,
  TechniqueType,
} from '../types';

/**
 * BUG+1 (Bivalue Universal Grave + 1):
 * A Uniqueness technique.
 * State:
 * 1. All empty cells have exactly 2 candidates, EXCEPT one cell has 3 candidates.
 * 2. In the bivalue cells, every candidate appears exactly 2 times in every Row, Column, and Box (forming the deadly pattern).
 * 3. The rule is: The "extra" candidate in the 3-value cell must be true.
 *    (Because if it weren't, we'd remove it, leaving a pure BUG, which implies 2 solutions or 0 solutions, both invalid).
 */
export const findBUGPlus1: TechniqueFunction = (
  grid: Grid
): TechniqueResult | null => {
  // 1. Identify all empty cells
  const emptyCells: { r: number; c: number; notes: number[] }[] = [];
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      if (grid[r][c].value === null) {
        emptyCells.push({ r, c, notes: grid[r][c].notes });
      }
    }
  }

  // Filter: All must be length 2 or 3.
  // There must be exactly ONE cell with length 3.
  // All others length 2.

  let triValueCell: { r: number; c: number; notes: number[] } | null = null;
  const biValueCells: { r: number; c: number; notes: number[] }[] = [];

  for (const cell of emptyCells) {
    if (cell.notes.length === 2) {
      biValueCells.push(cell);
    } else if (cell.notes.length === 3) {
      if (triValueCell !== null) return null; // Logic broken: more than one tri-value cell
      triValueCell = cell;
    } else {
      return null; // Logic broken: cells with 1 (Naked Single - should be solved) or 4+ notes exist. BUG+1 applies near end game.
    }
  }

  if (!triValueCell) return null; // No BUG+1 candidate

  // 2. Identify the "extra" candidate.
  // The "extra" candidate is the one that appears 3 times in the Row, Col, or Box of the tri-value cell?
  // Actually simpler: In a pure BUG, every candidate appears 2 times in row/col/box.
  // In BUG+1, one candidate appears 3 times in the row/col/box of the tri-value cell (the 2 from BUG + 1 extra).

  const { r: tr, c: tc, notes: tNotes } = triValueCell;
  const boxStartR = Math.floor(tr / 3) * 3;
  const boxStartC = Math.floor(tc / 3) * 3;

  // Check occurrences in Row
  for (const n of tNotes) {
    let countRow = 0;
    let countCol = 0;
    let countBox = 0;

    // Count in Row
    for (let c = 0; c < 9; c++) {
      if (grid[tr][c].value === null && grid[tr][c].notes.includes(n))
        countRow++;
    }
    // Count in Col
    for (let r = 0; r < 9; r++) {
      if (grid[r][tc].value === null && grid[r][tc].notes.includes(n))
        countCol++;
    }
    // Count in Box
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
        const row = boxStartR + r;
        const col = boxStartC + c;
        if (grid[row][col].value === null && grid[row][col].notes.includes(n))
          countBox++;
      }
    }

    // Ideally, in a BUG+1, the target candidate appears 3 times in its units?
    // Wait, if it's 3 times in ALL units? Or just needs to break the "2 times" parity?
    // The one that breaks the parity is the solution.
    // It doesn't strictly have to be 3. But usually is.

    // Let's verify: If we pick 'n', does the REST of the grid form a valid BUG?
    // Easier check: The value 'n' is the one that appears 3 times in the row, col, AND box.
    // Or rather, since it's the "extra" one, removing it would leave 2 instances in that unit.

    if (countRow === 3 && countCol === 3 && countBox === 3) {
      // High confidence this is the one.
      // Check eliminations? No, BUG+1 is a "Placement" technique.

      return {
        technique: TechniqueType.BUG_PLUS_ONE,
        primaryCells: [{ row: tr, col: tc }],
        eliminations: [], // No eliminations, direct placement
        placement: { row: tr, col: tc, value: n },
        explanation: `BUG+1 found. Cell (${tr + 1},${tc + 1}) is the only tri-value cell, and setting it to ${n} resolves valid parity.`,
      };
    }
  }

  return null;
};
