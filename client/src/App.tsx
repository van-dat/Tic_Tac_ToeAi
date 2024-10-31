import { useEffect, useState } from "react";
import { io } from "socket.io-client";
import Swal from "sweetalert2";

const App = () => {
  const [blocks, setBlocks] = useState(Array(3).fill(Array(3).fill(null)));
  const [currentPlayer, setCurrentPlayer] = useState("X");
  const [isBtn, setIsBtn] = useState<boolean>(true);
  const [playerName, setPlayerName] = useState<string>("");
  const [opponentName, setOpponentName] = useState<string>();
  const [socket, setSocket] = useState<any>();
  const [isPlay, setIsPlay] = useState<boolean>(false);
  const [isPlayerTurn, setIsPlayerTurn] = useState(true);

  useEffect(() => {
    if (socket) {
      socket?.on("OpponentFound", function (data: any) {
        setIsBtn(false);
        setOpponentName(data.opponentName);
      });
      socket?.on("playerMoveServer", function (data: any) {
        if (data?.result === "win") {
          Swal.fire(` ${data.playerWin} ${data.result}!`);
          setBlocks(Array(3).fill(Array(3).fill(null)));
        } else if (data?.result === "hòa") {
          Swal.fire(`${data.result}!`);
          setBlocks(Array(3).fill(Array(3).fill(null)));
        } else {
          setBlocks(data.newBlocks);
          setCurrentPlayer(data.isStyle === "X" ? "O" : "X");
          setIsPlayerTurn(true);
        }
      });
    }
  }, [socket]);

  const handleClick = (rowIndex: number, colIndex: number) => {
    if (!isPlayerTurn || blocks[rowIndex][colIndex] !== null) return;

    const newBlocks = blocks.map((row, rIdx) =>
      row.map((item: any, cIdx: any) => {
        if (rIdx === rowIndex && cIdx === colIndex) {
          return currentPlayer;
        }
        return item;
      })
    );

    setBlocks(newBlocks);
    setCurrentPlayer(currentPlayer === "X" ? "O" : "X");
    setIsPlayerTurn(false);
    socket.emit("playerMoveClient", {
      newBlocks,
      isStyle: currentPlayer,
      opponentName: opponentName,
    });
  };

  const connectSocket = async (type: string) => {
    const result = await takePlayerName();

    if (!result.isConfirmed) return;

    const username = result.value;
    setPlayerName(username);
    const newSocket = io("http://localhost:5000", {
      autoConnect: true,
    });

    newSocket?.emit("request_to_play", {
      playerName: username,
      type,
    });
    setSocket(newSocket);
    if (type === "people") setIsPlay(true);
  };

  const handleClickPeople = async () => {
    connectSocket("people");
  };

  const handleClickAi = async () => {
    connectSocket("ai");
    setIsBtn(false);
  };

  const takePlayerName = async () => {
    const result = await Swal.fire({
      title: "Enter your name",
      input: "text",
      showCancelButton: true,
      inputValidator: (value) => {
        if (!value) {
          return "You need to write something!";
        }
      },
    });

    return result;
  };

  if (isBtn) {
    return (
      <div className="mx-auto h-screen">
        {!isPlay && (
          <div className="flex justify-center items-center gap-8 flex-col h-screen">
            <h2 className="text-[#ddd] text-6xl">Tic Tac Toe</h2>
            <button
              onClick={handleClickPeople}
              className="bg-slate-700 text-[#ddd] max-w-[200px] text-center w-full px-4 py-2 rounded-xl"
            >
              Play with people
            </button>
            <button
              onClick={handleClickAi}
              className="bg-slate-700 text-[#ddd] max-w-[200px] w-full px-4 py-2 rounded-xl"
            >
              Play with bot
            </button>
          </div>
        )}
        {isPlay && (
          <div className="flex justify-center items-center h-screen">
            <h4 className="text-[#ddd]">Please wait for players to enter...</h4>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col max-w-[600px] justify-center items-center h-screen mx-auto gap-4">
      <div className="flex justify-between w-full px-[100px]">
        <button className="bg-ddd text-[#ddd] px-4 py-2 rounded-xl">
          {playerName}
        </button>
        <button className="bg-ddd text-[#ddd] px-4 py-2 rounded-xl">
          {opponentName ? opponentName : "Play Ai"}
        </button>
      </div>

      <div className="bg-ddd text-[#ddd] max-w-[400px] w-full py-2 rounded-xl">
        <h3 className="text-center text-xl font-bold">Tic Tac Toe</h3>
      </div>

      <div className="grid grid-cols-3 gap-6 max-w-[300px] w-full justify-center mt-3">
        {blocks &&
          blocks.length > 0 &&
          blocks?.map((row: number[], rowIndex: number) =>
            row.map((item: any, colIndex: number) => (
              <div
                key={`${rowIndex}-${colIndex}`}
                onClick={() => handleClick(rowIndex, colIndex)}
                className={`flex justify-center items-center h-20 bg-ddd
                ${item === "X" ? "text-blue-500" : "text-red-500"} 
                text-3xl font-bold cursor-pointer `}
              >
                {item}
              </div>
            ))
          )}
      </div>
      <div>
        <h4 className="text-[#ddd]">
          You are playing against {opponentName ? opponentName : "Bot"}
        </h4>
      </div>
    </div>
  );
};

export default App;
