

export const checkWinner = (board: any) => {
  // hàng ngang
  for (let i = 0; i < 3; i++) {
    if (board[i][0] && board[i][0] === board[i][1] && board[i][1] === board[i][2]) {
      return board[i][0];
    }
  }

  //  hàng dọc
  for (let i = 0; i < 3; i++) {
    if (board[0][i] && board[0][i] === board[1][i] && board[1][i] === board[2][i]) {
      return board[0][i];
    }
  }

  // đường chéo
  if (board[0][0] && board[0][0] === board[1][1] && board[1][1] === board[2][2]) {
    return board[0][0];
  }

  if (board[0][2] && board[0][2] === board[1][1] && board[1][1] === board[2][0]) {
    return board[0][2];
  }

  return null;
};


export function isBoardFull(board: any[]) {
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      if (board[i][j] === null) {
        return false;
      }
    }
  }
  return true;
}

function evaluate(board: any[]) {
  const winner = checkWinner(board);
  if (winner === 'X') {
    return 10;
  } else if (winner === 'O') {
    return -10;
  }
  return 0;
}

function minimax(board: any[], depth: number, isMaximizing: boolean): number {
  const score = evaluate(board);

  if (score === 10 || score === -10) return score;

  if (isBoardFull(board)) return 0;

  if (isMaximizing) {
    let best = -Infinity;
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        if (board[i][j] === null) {
          board[i][j] = 'X';
          best = Math.max(best, minimax(board, depth + 1, false));
          board[i][j] = null;
        }
      }
    }
    return best;
  } else {
    let best = Infinity;
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        if (board[i][j] === null) {
          board[i][j] = 'O';
          best = Math.min(best, minimax(board, depth + 1, true));
          board[i][j] = null;
        }
      }
    }
    return best;
  }
}


export function findBestMove(board: any[]): { row: number; col: number } {
  let bestVal = -Infinity;
  let bestMove = { row: -1, col: -1 };

  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      if (board[i][j] === null) {
        board[i][j] = 'X';
        let moveVal = minimax(board, 0, false);
        board[i][j] = null;

        if (moveVal > bestVal) {
          bestMove.row = i;
          bestMove.col = j;
          bestVal = moveVal;
        }
      }
    }
  }

  return bestMove;
}



export const editBlock = (blocks: any[], row: number, col: number, type: String): any[][] => {

  const newBlocks = blocks.map((el, rIdx) =>
    el.map((item: any, cIdx: any) => {
      if (rIdx === row && cIdx === col && item === null) {
        return type;
      }
      return item;
    })
  );


  return newBlocks

}


