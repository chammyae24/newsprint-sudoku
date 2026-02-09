import {
  Grid,
  TechniqueFunction,
  TechniqueResult,
  TechniqueType,
} from '../types';

/**
 * Generic function to find Fish patterns (X-Wing, Swordfish, Jellyfish).
 * A Fish of size N exists for a candidate C if:
 * - There are N rows where C appears only in the same N columns.
 * - Then C can be eliminated from those N columns in all other rows.
 * (And symmetrically for Cols -> Rows)
 */
const findFish = (
  grid: Grid,
  size: number,
  type: TechniqueType
): TechniqueResult | null => {
  // Check Rows -> Cols (Rows are "Base Sets", Cols are "Cover Sets")
  const rowResult = findFishInDirection(grid, size, type, true);
  if (rowResult) return rowResult;

  // Check Cols -> Rows
  const colResult = findFishInDirection(grid, size, type, false);
  if (colResult) return colResult;

  return null;
};

const findFishInDirection = (
  grid: Grid,
  size: number,
  type: TechniqueType,
  isRowBase: boolean // true = Base Sets are Rows; false = Base Sets are Cols
): TechniqueResult | null => {
  // 1. Identify valid base sets (rows/cols where candidate appears 2..size times? No, just appearing is enough, count restriction is loose but usually 2-N)
  // Actually, for a valid Fish, the candidate must appear at least twice in the base set to be useful?
  // Not necessarily, but minimal useful constraint is usually used.
  // X-Wing: 2 rows, candidate in exactly 2 positions in each row (same 2 cols).
  // Swordfish: 3 rows, candidate in 2 or 3 positions, union of cols has size 3.

  for (let n = 1; n <= 9; n++) {
    // Find all potential base sets (rows or cols)
    const baseSets: { index: number; positions: number[] }[] = [];

    for (let i = 0; i < 9; i++) {
      const positions: number[] = [];
      for (let j = 0; j < 9; j++) {
        const r = isRowBase ? i : j;
        const c = isRowBase ? j : i;

        if (grid[r][c].value === null && grid[r][c].notes.includes(n)) {
          positions.push(j); // Store the index of the "other" dimension
        }
      }
      // Optimization: A base set must have at least 2 candidates to form a proper fish structure usually
      // but strict definition allows 1? No, usually 2.
      if (positions.length >= 2 && positions.length <= 9) {
        // Upper bound doesn't matter much but strictly <= size? No, Swordfish rows can have 2 or 3.
        baseSets.push({ index: i, positions });
      }
    }

    if (baseSets.length < size) continue;

    // Try all combinations of 'size' base sets
    const combinations = getCombinations(baseSets, size);

    for (const baseSetCombo of combinations) {
      // Check cover sets (columns if base is rows)
      const coverSetIndices = new Set<number>();
      baseSetCombo.forEach((bs) =>
        bs.positions.forEach((p) => coverSetIndices.add(p))
      );

      if (coverSetIndices.size === size) {
        // Found a Fish!
        // We can eliminate candidate n from the cover sets (cols) in all OTHER rows (non-base).

        const baseIndices = baseSetCombo.map((bs) => bs.index);
        const coverIndices = Array.from(coverSetIndices).sort();
        const eliminations: { row: number; col: number; value: number }[] = [];

        // Iterate over cover sets (e.g. columns)
        coverIndices.forEach((coverIdx) => {
          // Check all "other" base sets (e.g. rows)
          for (let otherBaseIdx = 0; otherBaseIdx < 9; otherBaseIdx++) {
            if (baseIndices.includes(otherBaseIdx)) continue;

            const r = isRowBase ? otherBaseIdx : coverIdx;
            const c = isRowBase ? coverIdx : otherBaseIdx;

            if (grid[r][c].value === null && grid[r][c].notes.includes(n)) {
              eliminations.push({ row: r, col: c, value: n });
            }
          }
        });

        if (eliminations.length > 0) {
          const baseType = isRowBase ? 'Rows' : 'Columns';
          const coverType = isRowBase ? 'Columns' : 'Rows';

          // Construct primary cells
          const primaryCells: { row: number; col: number }[] = [];
          baseSetCombo.forEach((bs) => {
            bs.positions.forEach((pos) => {
              const r = isRowBase ? bs.index : pos;
              const c = isRowBase ? pos : bs.index;
              primaryCells.push({ row: r, col: c });
            });
          });

          return {
            technique: type,
            primaryCells,
            eliminations,
            explanation: `${type} found for candidate ${n} in ${baseType} ${baseIndices.map((i) => i + 1).join(',')}. It can be removed from ${coverType} ${coverIndices.map((i) => i + 1).join(',')} elsewhere.`,
          };
        }
      }
    }
  }

  return null;
};

function getCombinations<T>(arr: T[], size: number): T[][] {
  if (size === 1) return arr.map((item) => [item]);
  const result: T[][] = [];
  for (let i = 0; i < arr.length - size + 1; i++) {
    const head = arr[i];
    const tail = getCombinations(arr.slice(i + 1), size - 1);
    tail.forEach((combo) => result.push([head, ...combo]));
  }
  return result;
}

export const findXWing: TechniqueFunction = (grid) =>
  findFish(grid, 2, TechniqueType.X_WING);
export const findSwordfish: TechniqueFunction = (grid) =>
  findFish(grid, 3, TechniqueType.SWORDFISH);
