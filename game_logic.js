
const players = [
  { id: 1, name: "玩家1", x: undefined, y: undefined, cube: null, ready: false, type: 'human' },
  { id: 2, name: "玩家2", x: undefined, y: undefined, cube: null, ready: false, type: 'ai' },
  { id: 3, name: "玩家3", x: undefined, y: undefined, cube: null, ready: false, type: 'ai' },
  { id: 4, name: "玩家4", x: undefined, y: undefined, cube: null, ready: false, type: 'ai' }
];

let boardData = [[null, null, null, null, null, null, null, null, 4, null, null, null, null, null, null, null, null],
      [null, null, null, null, null, null, null, null, 20, null, null, null, null, null, null, null, null],
      [null, null, null, null, null, null, null, 14, 24, null, null, null, null, null, null, null, null],
      [null, null, null, null, null, null, null, 34, 35, 36, 8, null, null, null, null, null, null],
      [null, null, null, null, null, 16, 52, 53, 54, 55, 56, null, null, null, null, null, null],
      [null, null, null, null, null, 75, 76, 77, 78, 79, 80, 57, 9, null, null, null, null],
      [null, null, null, 11, 51, 74, 93, 94, 95, 96, 81, 58, 37, null, null, null, null],
      [null, null, null, 33, 50, 73, 92, 103, 104, 97, 82, 59, 38, 25, 10, null, null],
      [3, 19, 23, 32, 49, 72, 91, 102, "G", 98, 83, 60, 39, 26, 21, 17, 2],
      [null, null,6, 31, 48, 71, 90, 101, 100, 99, 84, 61, 40, 27, null, null, null],
      [null, null, null,null, 47, 70, 89, 88, 87, 86, 85, 62, 41, 5, null, null, null],
      [null, null, null, null,12, 69, 68, 67, 66, 65, 64, 63, null, null, null, null, null],
      [null, null, null, null, null, 46, 45, 44, 43, 42, 7, null, null, null, null, null, null],
      [null, null, null, null, null, 15, 30, 29, 28, null, null, null, null, null, null, null, null],
      [null, null, null, null, null, null, null, 22, 13, null, null, null, null, null, null, null, null],
      [null, null, null, null, null, null, null, 18, null, null, null, null, null, null, null, null, null],
      [null, null, null, null, null, null, null, 1, null, null, null, null, null, null, null, null, null]]; // 你原本的 board 格子矩陣
let colorMap = {   1: 'gray', 2: 'gray', 3: 'gray', 4: 'gray', 5: 'gray',
  6: 'gray', 7: 'gray', 8: 'gray', 9: 'gray', 10: 'gray',
  11: 'gray', 12: 'gray', 13: 'gray', 14: 'gray', 15: 'gray',
  16: 'gray', 17: 'white', 18: 'yellow', 19: 'blue', 20: 'green',
  21: 'yellow', 22: 'green', 23: 'red', 24: 'blue', 25: 'red',
  26: 'blue', 27: 'red', 28: 'purple', 29: 'white', 30: 'purple',
  31: 'purple', 32: 'blue', 33: 'white', 34: 'red', 35: 'green',
  36: 'white', 37: 'purple', 38: 'yellow',39: 'white', 40: 'blue', 41: 'green',
  42: 'white', 43: 'red', 44: 'blue', 45: 'blue', 46: 'yellow',
  47: 'white', 48: 'yellow', 49: 'green', 50: 'blue', 51: 'purple',
  52: 'yellow', 53: 'purple', 54: 'yellow', 55: 'red', 56: 'blue',
  57: 'white', 58: 'green', 59: 'blue', 60: 'green', 61: 'white',
  62: 'white', 63: 'purple', 64: 'green', 65: 'yellow', 66: 'purple',67: 'white',68: 'green',
  69: 'red', 70: 'purple', 71: 'red', 72: 'white', 73: 'yellow',
  74: 'red', 75: 'yellow', '76': 'white', 77: 'green', 78: 'red', 79: 'white',
  80: 'purple', 81: 'green', 82: 'white', 83: 'red', 84: 'yellow',
  85: 'purple', 86: 'white', 87: 'red', 88: 'red', 89: 'blue',
  90: 'white', 91: 'purple', 92:'green',93: 'purple', 94: 'yellow', 95: 'blue',
  96: 'purple', 97: 'yellow', 98: 'green', 99: 'green', 100: 'yellow',
  101: 'blue', 102: 'red', 103: 'white', 104: 'blue', 105: 'black',
  'G': 'black' }; // 格子號碼對應顏色



  function createCube(topColor, facing = "front") {
    const cubeMap = {
    blue: {
    bottom: "red",
    front: { front: "purple", back: "green", left: "yellow", right: "white" },
    back: { front: "green", back: "purple", left: "white", right: "yellow" },
    right: { front: "yellow", back: "white", left: "green", right: "purple" },
    left: { front: "white", back: "yellow", left: "purple", right: "green" }
    },
    red: {
    bottom: "blue",
    right: { front: "yellow", back: "white", left: "purple", right: "green" },
    left: { front: "white", back: "yellow", left: "green", right: "purple" },
    front: { front: "green", back: "purple", left: "yellow", right: "white" },
    back: { front: "purple", back: "green", left: "white", right: "yellow" }
    },
    green: {
    bottom: "purple",
    back: { front: "red", back: "blue", left: "white", right: "yellow" },
    front: { front: "blue", back: "red", left: "yellow", right: "white" },
    right: { front: "yellow", back: "white", left: "red", right: "blue" },
    left: { front: "white", back: "yellow", left: "blue", right: "red" }
    },
    yellow: {
    bottom: "white",
    right: { front: "purple", back: "green", left: "red", right: "blue" },
    left: { front: "green", back: "purple", left: "blue", right: "red" },
    back: { front: "red", back: "blue", left: "green", right: "purple" },
    front: { front: "blue", back: "red", left: "purple", right: "green" }
    },
    purple: {
    bottom: "green",
    right: { front: "white", back: "yellow", left: "red", right: "blue" },
    left: { front: "yellow", back: "white", left: "blue", right: "red" },
    front: { front: "blue", back: "red", left: "white", right: "yellow" },
    back: { front: "red", back: "blue", left: "yellow", right: "white" }
    },
    white: {
    bottom: "yellow",
    front: { front: "purple", back: "green", left: "blue", right: "red" },
    back: { front: "green", back: "purple", left: "red", right: "blue" },
    left: { front: "blue", back: "red", left: "green", right: "purple" },
    right: { front: "red", back: "blue", left: "purple", right: "green" }
    }
    };

    const faceConfig = cubeMap[topColor]?.[facing];
    const bottom = cubeMap[topColor]?.bottom;

    if (!faceConfig || !bottom) {
    alert("createCube 配置錯誤，請檢查頂面顏色與朝向是否正確");
    return null;
    }

    return {
    top: topColor,
    bottom: bottom,
    front: faceConfig.front,
    back: faceConfig.back,
    left: faceConfig.left,
    right: faceConfig.right,
    facing: facing
    };
    }

function findPositionByNumber(n) {
  for (let y = 0; y < boardData.length; y++) {
    for (let x = 0; x < boardData[y].length; x++) {
      if (boardData[y][x] === n) return { x, y };
    }
  }
  return null;
}

function allPlayersReady() {
  return players.every(p => p.ready);
}

async function autoSetAIStart(playerIdx) {
  const player = players[playerIdx];
  const grayChoices = [];

  for (let y = 0; y < 17; y++) {
    for (let x = 0; x < 17; x++) {
      const num = boardData[y][x];
      if (num && colorMap[num] === "gray") {
        grayChoices.push({ x, y, num });
      }
    }
  }

  const pos = grayChoices[Math.floor(Math.random() * grayChoices.length)];
  const topColors = ["blue", "red", "green", "yellow", "purple", "white"];
  const facings = ["front", "back", "left", "right"];

  const topColor = topColors[Math.floor(Math.random() * topColors.length)];
  const facing = facings[Math.floor(Math.random() * facings.length)];

  player.x = pos.x;
  player.y = pos.y;
  player.cube = createCube(topColor, facing);
  player.ready = true;

  drawBoard();

  if (allPlayersReady()) {
    gameFlow.currentTurnPlayer = 0;
    updateTurnInfo();
    if (players[0].type === 'ai') gameFlow.startAITurn();
  }
}

function setPlayerStart() {
  const player = players[0]; // 玩家1為人類

  const startNumber = parseInt(document.getElementById("startNumber").value);
  const topColor = document.getElementById("startTop").value.toLowerCase();
  const facing = prompt("請輸入朝向（front/back/left/right）").toLowerCase();

  const pos = findPositionByNumber(startNumber);
  if (!pos || colorMap[startNumber] !== "gray") {
    alert("無效的起始格子（必須為灰色）");
    return;
  }

  player.x = pos.x;
  player.y = pos.y;
  player.cube = createCube(topColor, facing);
  player.ready = true;

  drawBoard();

  // 設定 AI 玩家
  autoSetAIStart(1);
  autoSetAIStart(2);
  autoSetAIStart(3);
}

function updateTurnInfo() {
  document.getElementById("turnInfo").textContent = "輪到「" + players[gameFlow.currentTurnPlayer].name + "」移動。";
}

function updateCubeVisuals() {
  const container = document.getElementById("cube-visuals");
  let html = "<h3>玩家方塊視覺顯示</h3><div style='display: flex; gap: 20px; flex-wrap: wrap;'>";

  for (const p of players) {
    if (!p.cube) continue;
    const c = p.cube;

    html += `<div style="text-align:center;"><div style="font-weight:bold; margin-bottom: 5px;">${p.name}</div>
      <div style="width: 40px; height: 40px; margin: auto; background-color: ${c.top};
      border-left: 5px solid ${c.left}; border-right: 5px solid ${c.right};
      border-top: 5px solid ${c.front}; border-bottom: 5px solid ${c.back}; box-sizing: border-box;">
      </div></div>`;
  }

  html += "</div>";
  container.innerHTML = html;
}

function drawBoard() {
  updateCubeVisuals();

  const board = document.getElementById("board");
  board.innerHTML = "";

  for (let y = 0; y < 17; y++) {
    for (let x = 0; x < 17; x++) {
      const val = boardData[y][x];
      const cell = document.createElement("div");
      cell.className = "cell";
      if (val !== null && val !== undefined) {
        cell.textContent = String(val);
        const color = colorMap[val];
        cell.classList.add(typeof color === "string" ? color : "gray");

        players.forEach(p => {
          if (p.x === x && p.y === y && p.cube) {
            const div = document.createElement("div");
            div.className = 'playerCube';
            div.innerHTML = `${p.name}<br>${p.cube.top}`;
            cell.appendChild(div);
          }
        });
      } else {
        cell.classList.add('empty');
      }
      board.appendChild(cell);
    }
  }
}


function rotateCube(cube, dir) {
  const { top, bottom, front, back, left, right } = cube;
  let newCube = { ...cube };

  switch (dir) {
  case "down":
  newCube.top = front;
  newCube.front = bottom;
  newCube.bottom = back;
  newCube.back = top;
  newCube.facing = "down";
  break;
  case "up":
  newCube.top = back;
  newCube.back = bottom;
  newCube.bottom = front;
  newCube.front = top;
  newCube.facing = "up";
  break;
  case "left":
  newCube.top = right;
  newCube.right = bottom;
  newCube.bottom = left;
  newCube.left = top;
  newCube.facing = "left";
  break;
  case "right":
  newCube.top = left;
  newCube.left = bottom;
  newCube.bottom = right;
  newCube.right = top;
  newCube.facing = "right";
  break;
  }

  return newCube;
  }

window.players = players;
window.boardData = boardData;
window.colorMap = colorMap;

window.createCube = createCube;
window.rotateCube = rotateCube;
window.findPositionByNumber = findPositionByNumber;
window.allPlayersReady = allPlayersReady;
window.autoSetAIStart = autoSetAIStart;
window.setPlayerStart = setPlayerStart;

window.drawBoard = drawBoard;
window.updateTurnInfo = updateTurnInfo;
window.updateCubeVisuals = updateCubeVisuals;

drawBoard();
