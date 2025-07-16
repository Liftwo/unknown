
const players = [
  { id: 1, name: "玩家1", x: undefined, y: undefined, cube: null, ready: false, type: 'human' },
  { id: 2, name: "玩家2", x: undefined, y: undefined, cube: null, ready: false, type: 'ai' },
  { id: 3, name: "玩家3", x: undefined, y: undefined, cube: null, ready: false, type: 'ai' },
  { id: 4, name: "玩家4", x: undefined, y: undefined, cube: null, ready: false, type: 'ai' }
];

let boardData = [...]; // 你原本的 board 格子矩陣
let colorMap = {...}; // 格子號碼對應顏色



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

function awaitStartPositionSelection(player) {
  const board = document.getElementById("board");

  const validStarts = [];

  for (let y = 0; y < 17; y++) {
    for (let x = 0; x < 17; x++) {
      const val = boardData[y][x];
      if (val && colorMap[val] === "gray") {
        validStarts.push({ x, y });

        const idx = y * 17 + x;
        const cell = board.children[idx];

        cell.classList.add("selectable-start");
        cell.onclick = () => {
          player.x = x;
          player.y = y;
          drawBoard();

          // 清除樣式與 handler
          for (const vs of validStarts) {
            const i = vs.y * 17 + vs.x;
            const c = board.children[i];
            c.classList.remove("selectable-start");
            c.onclick = null;
          }

          // 通知流程回來繼續
          if (window.afterStartSelected) {
            window.afterStartSelected();
            window.afterStartSelected = null;
          }
        };
      }
    }
  }
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
