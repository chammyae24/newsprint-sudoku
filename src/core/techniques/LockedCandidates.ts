import {
  Grid,
  TechniqueFunction,
  TechniqueResult,
  TechniqueType,
} from '../types';

/**
 * Locked Candidates (Type 1): Pointing
 * If in a box, a candidate only appears in a single row/col,
 * then that candidate can be removed from the rest of that row/col outside the box.
 *
 * Locked Candidates (Type 2): Claiming
 * If in a row/col, a candidate only appears in a single box,
 * then that candidate can be removed from the rest of that box outside the row/col.
 */
export const findLockedCandidates: TechniqueFunction = (
  grid: Grid
): TechniqueResult | null => {
  // 1. Pointing (Box -> Line)
  for (let boxRow = 0; boxRow < 9; boxRow += 3) {
    for (let boxCol = 0; boxCol < 9; boxCol += 3) {
      for (let n = 1; n <= 9; n++) {
        // Collect positions of candidate 'n' in this box
        const positions: { r: number; c: number }[] = [];
        for (let r = 0; r < 3; r++) {
          for (let c = 0; c < 3; c++) {
            const row = boxRow + r;
            const col = boxCol + c;
            if (
              grid[row][col].value === null &&
              grid[row][col].notes.includes(n)
            ) {
              positions.push({ r: row, c: col });
            }
          }
        }

        if (positions.length < 2) continue;

        // Check if all are in same row
        const sameRow = positions.every((p) => p.r === positions[0].r);
        if (sameRow) {
          const row = positions[0].r;

          // Check for eliminations in the rest of the row
          const eliminations = [];
          for (let c = 0; c < 9; c++) {
            // Skip if in the current box
            if (c >= boxCol && c < boxCol + 3) continue;

            if (grid[row][c].value === null && grid[row][c].notes.includes(n)) {
              eliminations.push({ row, col: c, value: n });
            }
          }

          if (eliminations.length > 0) {
            return {
              technique: TechniqueType.LOCKED_POINTING,
              primaryCells: positions.map((p) => ({ row: p.r, col: p.c })),
              eliminations,
              explanation: `In Box ${Math.floor(boxRow / 3) * 3 + Math.floor(boxCol / 3) + 1}, candidate ${n} is locked in Row ${row + 1}. It can be removed from other cells in that row.`,
            };
          }
        }

        // Check if all are in same column
        const sameCol = positions.every((p) => p.c === positions[0].c);
        if (sameCol) {
          const col = positions[0].c;

          // Check for eliminations in the rest of the column
          const eliminations = [];
          for (let r = 0; r < 9; r++) {
            // Skip if in the current box
            if (r >= boxRow && r < boxRow + 3) continue;

            if (grid[r][col].value === null && grid[r][col].notes.includes(n)) {
              eliminations.push({ row: r, col, value: n });
            }
          }

          if (eliminations.length > 0) {
            return {
              technique: TechniqueType.LOCKED_POINTING,
              primaryCells: positions.map((p) => ({ row: p.r, col: p.c })),
              eliminations,
              explanation: `In Box ${Math.floor(boxRow / 3) * 3 + Math.floor(boxCol / 3) + 1}, candidate ${n} is locked in Column ${col + 1}. It can be removed from other cells in that column.`,
            };
          }
        }
      }
    }
  }

  // 2. Claiming (Line -> Box)
  // Check Rows
  for (let r = 0; r < 9; r++) {
    for (let n = 1; n <= 9; n++) {
      const positions: { r: number; c: number }[] = [];
      for (let c = 0; c < 9; c++) {
        if (grid[r][c].value === null && grid[r][c].notes.includes(n)) {
          positions.push({ r, c });
        }
      }

      if (positions.length < 2) continue;

      // Check if all in same box
      const firstBoxRow = Math.floor(positions[0].r / 3) * 3;
      const firstBoxCol = Math.floor(positions[0].c / 3) * 3;

      const sameBox = positions.every(
        (p) =>
          Math.floor(p.r / 3) * 3 === firstBoxRow &&
          Math.floor(p.c / 3) * 3 === firstBoxCol
      );

      if (sameBox) {
        // Check for eliminations in the rest of the box
        const eliminations = [];
        for (let br = 0; br < 3; br++) {
          for (let bc = 0; bc < 3; bc++) {
            const row = firstBoxRow + br;
            const col = firstBoxCol + bc;

            // Skip if in the current row (where we found them)
            if (row === r) continue;

            if (
              grid[row][col].value === null &&
              grid[row][col].notes.includes(n)
            ) {
              eliminations.push({ row, col, value: n });
            }
          }
        }

        if (eliminations.length > 0) {
          return {
            technique: TechniqueType.LOCKED_CLAIMING,
            primaryCells: positions.map((p) => ({ row: p.r, col: p.c })),
            eliminations,
            explanation: `In Row ${r + 1}, candidate ${n} is locked in Box ${Math.floor(firstBoxRow / 3) * 3 + Math.floor(firstBoxCol / 3) + 1}. It can be removed from other cells in that box.`,
          };
        }
      }
    }
  }

  // Check Columns
  for (let c = 0; c < 9; c++) {
    for (let n = 1; n <= 9; n++) {
      const positions: { r: number; c: number }[] = [];
      for (let r = 0; r < 9; r++) {
        if (grid[r][c].value === null && grid[r][c].notes.includes(n)) {
          positions.push({ r, c });
        }
      }

      if (positions.length < 2) continue;

      // Check if all in same box
      const firstBoxRow = Math.floor(positions[0].r / 3) * 3;
      const firstBoxCol = Math.floor(positions[0].c / 3) * 3;

      const sameBox = positions.every(
        (p) =>
          Math.floor(p.r / 3) * 3 === firstBoxRow &&
          Math.floor(p.c / 3) * 3 === firstBoxCol
      );

      if (sameBox) {
        // Check for eliminations in the rest of the box
        const eliminations = [];
        for (let br = 0; br < 3; br++) {
          for (let bc = 0; bc < 3; bc++) {
            const row = firstBoxRow + br;
            const col = firstBoxCol + bc;

            // Skip if in the current column
            if (col === c) continue;

            if (
              grid[row][col].value === null &&
              grid[row][col].notes.includes(n)
            ) {
              eliminations.push({ row, col, value: n });
            }
          }
        }

        if (eliminations.length > 0) {
          return {
            technique: TechniqueType.LOCKED_CLAIMING,
            primaryCells: positions.map((p) => ({ row: p.r, col: p.c })),
            eliminations,
            explanation: `In Column ${c + 1}, candidate ${n} is locked in Box ${Math.floor(firstBoxRow / 3) * 3 + Math.floor(firstBoxCol / 3) + 1}. It can be removed from other cells in that box.`,
          };
        }
      }
    }
  }

  return null;
};
