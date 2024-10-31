import { checkWinner, editBlock, findBestMove, isBoardFull } from './botAi';
import { createServer } from "http";
import { Server } from "socket.io";

interface User {
  socket: any;
  online: boolean;
  playing: boolean;
  playerName: string;
}

interface Room {
  player1: User;
  player2: User;
}

interface MoveData {
  newBlocks: string[][];
  isStyle: string;
}


const httpServer = createServer();
const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const allUsers: Record<string, User> = {};
const allRooms: Room[] = [];

io.on("connection", (socket) => {
  const currentUser: User = {
    socket,
    online: true,
    playing: false,
    playerName: "",
  };

  allUsers[socket.id] = currentUser;

  socket.on("request_to_play", (data: { playerName: string; type: string }) => {
    currentUser.playerName = data.playerName;

    if (data.type === "people") {
      let opponentPlayer: User | undefined;

      for (const key in allUsers) {
        const user = allUsers[key];
        if (user.online && !user.playing && socket.id !== key) {
          user.playing = true;
          opponentPlayer = user;
          break;
        }
      }

      if (opponentPlayer) {
        currentUser.playing = true;
        allRooms.push({ player1: opponentPlayer, player2: currentUser });

        currentUser.socket.emit("OpponentFound", { opponentName: opponentPlayer.playerName });
        opponentPlayer.socket.emit("OpponentFound", { opponentName: currentUser.playerName });

        currentUser.socket.on("playerMoveClient", (data: MoveData) => handleMove({
          playerSocket: currentUser.socket,
          opponentSocket: opponentPlayer.socket,
          playerName: currentUser.playerName,
          data,
          type: "people"
        }));

        opponentPlayer.socket.on("playerMoveClient", (data: MoveData) => handleMove({
          playerSocket: opponentPlayer.socket,
          opponentSocket: currentUser.socket,
          playerName: opponentPlayer.playerName,
          data,
          type: "people"
        }));
      } else {
        currentUser.socket.emit("OpponentNotFound");
      }
    }

    if (data.type === "ai") {
      currentUser.playing = true;
      currentUser.socket.on("playerMoveClient", (data: MoveData) => handleMove({
        playerSocket: currentUser.socket,
        playerName: currentUser.playerName,
        data,
        type: "ai"
      }));
    }
  });

  const handleMove = ({
    playerSocket,
    opponentSocket,
    playerName,
    data,
    type
  }: {
    playerSocket: any;
    opponentSocket?: any;
    playerName: string;
    data: MoveData;
    type: string;
  }) => {

    if (type === "people") {

      const result = checkWinner(data.newBlocks);
      const win = result ? { playerWin: playerName, result: "win" } : { result: isBoardFull(data?.newBlocks) ? "hòa" : "lost" };
      playerSocket.emit("playerMoveServer", { ...data, ...win });
      opponentSocket?.emit("playerMoveServer", { ...data, ...win });
    }

    if (type === "ai") {
      const moveAi = findBestMove(data.newBlocks);
      const newBlocks = editBlock(data.newBlocks, moveAi.row, moveAi.col, data.isStyle === "X" ? "O" : "X");
      const result = checkWinner(newBlocks);
      const win = result ? { playerWin: result === "O" ? "Bot" : playerName, result: "win" } : { result: isBoardFull(newBlocks) ? "hòa" : "lost" };
      playerSocket.emit("playerMoveServer", { newBlocks, ...win });
    }
  };

  socket.on("disconnect", () => {
    currentUser.online = false;
    currentUser.playing = false;

    for (let index = 0; index < allRooms.length; index++) {
      const { player1, player2 } = allRooms[index];
      if (player1.socket.id === socket.id || player2.socket.id === socket.id) {
        allRooms.splice(index, 1);
        break;
      }
    }
    delete allUsers[socket.id];
  });
});

httpServer.listen(5000);
