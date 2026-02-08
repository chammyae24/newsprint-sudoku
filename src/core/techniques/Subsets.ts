import {
  Grid,
  TechniqueFunction,
  TechniqueResult,
  TechniqueType,
} from '../types';

/**
 * Generic function to find Naked Subsets (Pairs, Triples, Quads).
 * A Naked Subset of size N exists in a unit (row, col, box) if N cells in that unit
 * contain ONLY candidates from a set of N digits.
 */
const findNakedSubsetsInRange = (
  grid: Grid,
  cells: { r: number; c: number }[],
  size: number,
  type: TechniqueType,
  unitName: string
): TechniqueResult | null => {
  // Filter for cells that have candidates, limit to max candidates = size (optimization)
  // Actually, for a pure Naked Subset of size N, the cells MUST have <= N candidates.
  const candidatesCells = cells.filter((cell) => {
    const notes = grid[cell.r][cell.c].notes;
    return (
      grid[cell.r][cell.c].value === null &&
      notes.length > 0 &&
      notes.length <= size
    );
  });

  if (candidatesCells.length < size) return null;

  // Generate combinations of 'size' cells
  const combinations = getCombinations(candidatesCells, size);

  for (const combo of combinations) {
    // Collect all unique candidates in this combination
    const unionCandidates = new Set<number>();
    combo.forEach((cell) => {
      grid[cell.r][cell.c].notes.forEach((n) => unionCandidates.add(n));
    });

    // If number of unique candidates equals the size (e.g. 2 candidates for a Pair), it's a Naked Subset
    if (unionCandidates.size === size) {
      // Found a Naked Subset!
      // Check if we can eliminate these candidates from OTHER cells in the unit
      const eliminations: { row: number; col: number; value: number }[] = [];
      const comboSet = new Set(combo.map((c) => `${c.r},${c.c}`));

      cells.forEach((cell) => {
        // Skip cells in the subset
        if (comboSet.has(`${cell.r},${cell.c}`)) return;

        // Check if this cell has any of the subset's candidates
        const cellNotes = grid[cell.r][cell.c].notes;
        if (grid[cell.r][cell.c].value !== null) return;

        cellNotes.forEach((n) => {
          if (unionCandidates.has(n)) {
            eliminations.push({ row: cell.r, col: cell.c, value: n });
          }
        });
      });

      if (eliminations.length > 0) {
        const candidatesStr = Array.from(unionCandidates).sort().join(',');
        return {
          technique: type,
          primaryCells: combo.map((c) => ({ row: c.r, col: c.c })),
          eliminations,
          explanation: `Naked ${type.split(' ')[1]} (${candidatesStr}) found in ${unitName}. Candidates ${candidatesStr} can be removed from other cells in this unit.`,
        };
      }
    }
  }

  return null;
};

/**
 * Generic function to find Hidden Subsets (Pairs, Triples, Quads).
 * A Hidden Subset of size N exists in a unit if N candidates appear ONLY in N cells within that unit
 * (even if those cells have other candidates).
 */
const findHiddenSubsetsInRange = (
  grid: Grid,
  cells: { r: number; c: number }[],
  size: number,
  type: TechniqueType,
  unitName: string
): TechniqueResult | null => {
  // Map candidates to cells where they appear
  const candidateMap = new Map<number, { r: number; c: number }[]>();
  for (let n = 1; n <= 9; n++) {
    const positions: { r: number; c: number }[] = [];
    cells.forEach((cell) => {
      if (
        grid[cell.r][cell.c].value === null &&
        grid[cell.r][cell.c].notes.includes(n)
      ) {
        positions.push(cell);
      }
    });
    if (positions.length > 0) candidateMap.set(n, positions);
  }

  // Filter candidates that appear <= size times (optimization, but technically redundant if we check union size)
  // Actually, strictly speaking, for hidden subset size N, each candidate MUST appear <= N times in the unit?
  // No, but the union of positions for N candidates must have size N.

  const possibleCandidates = Array.from(candidateMap.keys()).sort();
  if (possibleCandidates.length < size) return null;

  const combinations = getCombinations(possibleCandidates, size);

  for (const candidateCombo of combinations) {
    // Find the union of cells where these candidates appear
    const cellUnion = new Set<string>();
    candidateCombo.forEach((n) => {
      candidateMap
        .get(n)
        ?.forEach((cell) => cellUnion.add(`${cell.r},${cell.c}`));
    });

    if (cellUnion.size === size) {
      // Found a Hidden Subset!
      // Confirmed that 'size' candidates are confined to 'size' cells.
      // We can eliminate OTHER candidates from these cells.

      const eliminations: { row: number; col: number; value: number }[] = [];
      const candidateSet = new Set(candidateCombo);

      Array.from(cellUnion).forEach((cellKey) => {
        const [r, c] = cellKey.split(',').map(Number);
        const notes = grid[r][c].notes;

        notes.forEach((note) => {
          // If note is NOT part of the hidden subset, eliminate it
          if (!candidateSet.has(note)) {
            eliminations.push({ row: r, col: c, value: note });
          }
        });
      });

      if (eliminations.length > 0) {
        const candidatesStr = candidateCombo.join(',');
        // Reconstruct cell objects for return
        const primaryCells = Array.from(cellUnion).map((k) => {
          const [r, c] = k.split(',').map(Number);
          return { row: r, col: c };
        });

        return {
          technique: type,
          primaryCells,
          eliminations,
          explanation: `Hidden ${type.split(' ')[1]} (${candidatesStr}) found in ${unitName}. Other candidates can be removed from these cells.`,
        };
      }
    }
  }

  return null;
};

// Helper for combinations
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

export const findSubsets: TechniqueFunction = (
  grid: Grid
): TechniqueResult | null => {
  const ranges = [
    {
      size: 2,
      nakedType: TechniqueType.NAKED_PAIR,
      hiddenType: TechniqueType.HIDDEN_PAIR,
    },
    {
      size: 3,
      nakedType: TechniqueType.NAKED_TRIPLE,
      hiddenType: TechniqueType.HIDDEN_TRIPLE,
    },
    {
      size: 4,
      nakedType: TechniqueType.NAKED_QUAD,
      hiddenType: TechniqueType.HIDDEN_QUAD,
    },
  ];

  for (const { size, nakedType, hiddenType } of ranges) {
    // defined units: rows, cols, boxes

    // Rows
    for (let r = 0; r < 9; r++) {
      const cells = Array.from({ length: 9 }, (_, c) => ({ r, c }));
      const naked = findNakedSubsetsInRange(
        grid,
        cells,
        size,
        nakedType,
        `Row ${r + 1}`
      );
      if (naked) return naked;
      const hidden = findHiddenSubsetsInRange(
        grid,
        cells,
        size,
        hiddenType,
        `Row ${r + 1}`
      );
      if (hidden) return hidden;
    }

    // Cols
    for (let c = 0; c < 9; c++) {
      const cells = Array.from({ length: 9 }, (_, r) => ({ r, c }));
      const naked = findNakedSubsetsInRange(
        grid,
        cells,
        size,
        nakedType,
        `Column ${c + 1}`
      );
      if (naked) return naked;
      const hidden = findHiddenSubsetsInRange(
        grid,
        cells,
        size,
        hiddenType,
        `Column ${c + 1}`
      );
      if (hidden) return hidden;
    }

    // Boxes
    for (let br = 0; br < 3; br++) {
      for (let bc = 0; bc < 3; bc++) {
        const cells: { r: number; c: number }[] = [];
        for (let r = 0; r < 3; r++) {
          for (let c = 0; c < 3; c++) {
            cells.push({ r: br * 3 + r, c: bc * 3 + c });
          }
        }
        const boxName = `Box ${br * 3 + bc + 1}`;
        const naked = findNakedSubsetsInRange(
          grid,
          cells,
          size,
          nakedType,
          boxName
        );
        if (naked) return naked;
        const hidden = findHiddenSubsetsInRange(
          grid,
          cells,
          size,
          hiddenType,
          boxName
        );
        if (hidden) return hidden;
      }
    }
  }

  return null;
};
