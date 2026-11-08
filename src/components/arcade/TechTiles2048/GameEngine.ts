export interface GameState {
  grid: number[][];
  score: number;
  bestScore: number;
  isGameOver: boolean;
  hasWon: boolean;
  hasContinuedPastWin: boolean;
  mergedCells: Set<string>;
  spawnedCell: string | null;
}

export type MoveDirection = 'up' | 'down' | 'left' | 'right';

export function createEmptyGrid(): number[][] {
  return [
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
  ];
}

export function spawnRandomTile(grid: number[][]): { grid: number[][]; cell: string | null } {
  const empty: [number, number][] = [];
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      if (grid[r][c] === 0) {
        empty.push([r, c]);
      }
    }
  }

  if (empty.length === 0) return { grid, cell: null };

  const [row, col] = empty[Math.floor(Math.random() * empty.length)];
  const val = Math.random() < 0.9 ? 2 : 4;

  const newGrid = grid.map((r) => [...r]);
  newGrid[row][col] = val;

  return { grid: newGrid, cell: `${row}-${col}` };
}

export function initNewGame(bestScore: number = 0): GameState {
  let grid = createEmptyGrid();
  const s1 = spawnRandomTile(grid);
  const s2 = spawnRandomTile(s1.grid);

  return {
    grid: s2.grid,
    score: 0,
    bestScore,
    isGameOver: false,
    hasWon: false,
    hasContinuedPastWin: false,
    mergedCells: new Set(),
    spawnedCell: s2.cell,
  };
}

// Slide and merge a single 1D row to the left
function slideRowLeft(row: number[]): { newRow: number[]; scoreGained: number; mergedIndices: number[] } {
  const filtered = row.filter((v) => v !== 0);
  const newRow: number[] = [];
  let scoreGained = 0;
  const mergedIndices: number[] = [];

  let i = 0;
  while (i < filtered.length) {
    if (i + 1 < filtered.length && filtered[i] === filtered[i + 1]) {
      const mergedVal = filtered[i] * 2;
      newRow.push(mergedVal);
      scoreGained += mergedVal;
      mergedIndices.push(newRow.length - 1);
      i += 2;
    } else {
      newRow.push(filtered[i]);
      i += 1;
    }
  }

  while (newRow.length < 4) {
    newRow.push(0);
  }

  return { newRow, scoreGained, mergedIndices };
}

// Slide 4x4 grid in any of the 4 directions
export function moveGrid(state: GameState, direction: MoveDirection): GameState {
  if (state.isGameOver) return state;

  const prevGrid = state.grid;
  let newGrid = createEmptyGrid();
  let totalScoreGained = 0;
  const mergedCells = new Set<string>();

  if (direction === 'left') {
    for (let r = 0; r < 4; r++) {
      const { newRow, scoreGained, mergedIndices } = slideRowLeft(prevGrid[r]);
      newGrid[r] = newRow;
      totalScoreGained += scoreGained;
      mergedIndices.forEach((c) => mergedCells.add(`${r}-${c}`));
    }
  } else if (direction === 'right') {
    for (let r = 0; r < 4; r++) {
      const reversed = [...prevGrid[r]].reverse();
      const { newRow, scoreGained, mergedIndices } = slideRowLeft(reversed);
      newGrid[r] = newRow.reverse();
      totalScoreGained += scoreGained;
      mergedIndices.forEach((c) => mergedCells.add(`${r}-${3 - c}`));
    }
  } else if (direction === 'up') {
    for (let c = 0; c < 4; c++) {
      const col = [prevGrid[0][c], prevGrid[1][c], prevGrid[2][c], prevGrid[3][c]];
      const { newRow, scoreGained, mergedIndices } = slideRowLeft(col);
      totalScoreGained += scoreGained;
      for (let r = 0; r < 4; r++) {
        newGrid[r][c] = newRow[r];
      }
      mergedIndices.forEach((r) => mergedCells.add(`${r}-${c}`));
    }
  } else if (direction === 'down') {
    for (let c = 0; c < 4; c++) {
      const col = [prevGrid[3][c], prevGrid[2][c], prevGrid[1][c], prevGrid[0][c]];
      const { newRow, scoreGained, mergedIndices } = slideRowLeft(col);
      totalScoreGained += scoreGained;
      for (let r = 0; r < 4; r++) {
        newGrid[3 - r][c] = newRow[r];
      }
      mergedIndices.forEach((r) => mergedCells.add(`${3 - r}-${c}`));
    }
  }

  // Check if grid actually changed
  let hasChanged = false;
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      if (prevGrid[r][c] !== newGrid[r][c]) {
        hasChanged = true;
        break;
      }
    }
    if (hasChanged) break;
  }

  if (!hasChanged) {
    return state; // No movement possible in this direction
  }

  // Spawn new tile
  const { grid: finalGrid, cell: spawnedCell } = spawnRandomTile(newGrid);

  const newScore = state.score + totalScoreGained;
  const newBestScore = Math.max(state.bestScore, newScore);

  // Check 2048 win
  let reached2048 = false;
  if (!state.hasWon && !state.hasContinuedPastWin) {
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        if (finalGrid[r][c] >= 2048) {
          reached2048 = true;
          break;
        }
      }
    }
  }

  // Check if any move is possible
  const isGameOver = !canMove(finalGrid);

  return {
    grid: finalGrid,
    score: newScore,
    bestScore: newBestScore,
    isGameOver,
    hasWon: reached2048 || state.hasWon,
    hasContinuedPastWin: state.hasContinuedPastWin,
    mergedCells,
    spawnedCell,
  };
}

export function canMove(grid: number[][]): boolean {
  // Check for empty cell
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      if (grid[r][c] === 0) return true;
    }
  }

  // Check adjacent matching horizontal or vertical cells
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      const val = grid[r][c];
      if (c + 1 < 4 && grid[r][c + 1] === val) return true;
      if (r + 1 < 4 && grid[r + 1][c] === val) return true;
    }
  }

  return false;
}
