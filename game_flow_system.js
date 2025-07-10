class GameFlowManager {
  constructor() {
    this.actionQueue = [];
    this.isProcessing = false;
    this.currentTurnPlayer = 0;
    this.turnPhase = 'NORMAL'; // NORMAL, EXTRA_MOVE, RULE6_TARGET, RULE8_TARGET
    this.extraMoveUsed = false;
    this.aiThinking = false;
    this.gameStarted = false;

  }

  enqueueAction(action, delayMs = 0) {
  // 避免連續加入兩個 END_TURN
  console.log('🌀 enqueueAction()', action);
  if (
    action.type === 'END_TURN' &&
    this.actionQueue.length > 0 &&
    this.actionQueue[this.actionQueue.length - 1].type === 'END_TURN'
  ) {
    console.warn('⚠️ 嘗試重複加入 END_TURN，略過');
    return;
  }
  this.actionQueue.push({ ...action, _delayMs: delayMs });
  if (!this.isProcessing) {
    console.log('🚀 queue not processing → start');
    this.processQueue();
  } else {
    console.log('⏳ queue already processing → skip start');
  }
}


  async processQueue() {
    console.log('🔁 畫面刷新');
    this.isProcessing = true;
    while (this.actionQueue.length > 0) {
      const action = this.actionQueue.shift();
      if (action._delayMs) {
      console.log(`⏳ 等待 ${action._delayMs}ms 再執行動作`, action);
      await this.delay(action._delayMs);
    }
      await this.executeAction(action);
      drawBoard();
      updateTurnInfo();
      await this.delay(800);
    }
    console.log('✅ 所有動作處理完成，isProcessing 設為 false');
    this.isProcessing = false;
  }

  async executeAction(action) {
    switch (action.type) {
      case 'NORMAL_MOVE': await this.handleNormalMove(action); break;
      case 'EXTRA_MOVE': await this.handleExtraMove(action); break;
      case 'RULE6_FORCE_MOVE': await this.handleRule6ForceMove(action); break;
      case 'RULE8_DESIGNATE_MOVE': await this.handleRule8DesignateMove(action); break;
      case 'END_TURN': this.handleEndTurn(); break;
      case 'BANISH_PLAYER': await this.handleBanishPlayer(action); break;

    }
  }

    async handleBanishPlayer(action) {
    const player = players[action.playerId];
    console.log(`🚨 ${player.name} 被放逐，需要重新選擇起始位置`);

    if (player.type === 'ai') {
      // AI 玩家自動選擇新位置
      await this.resetAIPlayerToBanishmentArea(player);
    } else {
      // 人類玩家手動選擇
      alert(`${player.name} 被放逐，請點選起始區域重新放置`);
      await this.resetHumanPlayerToBanishmentArea(player);
    }

    console.log(`✅ ${player.name} 已重新放置，結束當前回合`);

    // 放逐處理完成後，結束當前回合
    this.enqueueAction({ type: 'END_TURN' });
  }

    async resetAIPlayerToBanishmentArea(player) {
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

    console.log(`🤖 AI ${player.name} 重新放置到 (${pos.x}, ${pos.y})，頂面：${topColor}`);

    // 等待一下讓玩家看到重置過程
    await this.delay(1000);
  }

  // 新增：人類玩家放逐重置
   async resetHumanPlayerToBanishmentArea(player) {
    return new Promise(resolve => {
      window.afterStartSelected = () => {
        // 透過小視窗選擇頂面顏色和朝向
        const topColor = prompt("請選擇頂面顏色（blue/red/green/yellow/purple/white）：").toLowerCase();
        const facing = prompt("請輸入朝向（front/back/left/right）：").toLowerCase();

        // 設定玩家的方塊
        player.cube = createCube(topColor, facing);

        console.log(`👤 人類玩家 ${player.name} 重新放置到 (${player.x}, ${player.y})，頂面：${topColor}，朝向：${facing}`);
        resolve();
      };
      awaitStartPositionSelection(player);
    });
  }


  getTopColorAt(x, y) {
  const player = players.find(p => p.x === x && p.y === y);
  if (player?.cube?.top) {
    return player.cube.top; // 玩家方塊頂面
  }

  const cell = boardData[y]?.[x];
  return cell != null ? colorMap[cell] : null; // 該格子的顏色
}


  needsToChangeTopColor(player) {
  const px = player.x, py = player.y;
  const topColor = player.cube.top;

  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      const nx = px + dx, ny = py + dy;
      if (!inBounds(nx, ny)) continue;

      const color = this.getTopColorAt(nx, ny);
      if (color === topColor) {
        return false; // 有其他相同顏色，無需換色
      }
    }
  }

  return true; // 九宮格內（除自己）沒有其他同色
}


  getAvailableTopColorsInNineGrid(player) {
  const px = player.x, py = player.y;
  const colorSet = new Set();

  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      const nx = px + dx, ny = py + dy;
      if (!inBounds(nx, ny)) continue;

      const color = this.getTopColorAt(nx, ny);
      if (color && color !== 'white' && color !== 'gray') {
        colorSet.add(color);
      }
    }
  }
  const standingCellValue = boardData[py]?.[px];
  const standingColor = standingCellValue != null ? colorMap[standingCellValue] : null;
  if (standingColor) {
  colorSet.add(standingColor);}

  return Array.from(colorSet);
  }

  async forceChangeTopColor(player) {
  const availableColors = this.getAvailableTopColorsInNineGrid(player);
  const currentTop = player.cube.top;

  const choices = availableColors.filter(c => c !== currentTop);
  if (choices.length === 0) return;

  if (player.type === 'ai') {
    const newColor = choices[Math.floor(Math.random() * choices.length)];
    const facings = ["front", "back", "left", "right"];
    const newFacing = facings[Math.floor(Math.random() * facings.length)];
    player.cube = createCube(newColor, newFacing);
    console.log(`🤖 AI ${player.name} 強制換頂面為 ${newColor}，朝向 ${newFacing}`);
  } else {
    let newColor = null;
    while (!newColor || !choices.includes(newColor)) {
      newColor = prompt(`⚠️ ${player.name} 須更換頂面顏色。\n可選顏色：${choices.join(', ')}`).toLowerCase();
    }
    let newFacing = null;
    while (!["front", "back", "left", "right"].includes(newFacing)) {
      newFacing = prompt(`請輸入新的朝向（front/back/left/right）：`).toLowerCase();
    }
    player.cube = createCube(newColor, player.newfacing);
    console.log(`👤 ${player.name} 換頂面為 ${newColor}，朝向 ${newFacing}`);
  }
}


  async handleNormalMove(action) {
  const { playerId, direction } = action;
  const player = players[playerId];
  const dx = direction === 'left' ? -1 : direction === 'right' ? 1 : 0;
  const dy = direction === 'up' ? -1 : direction === 'down' ? 1 : 0;
  const newX = player.x + dx, newY = player.y + dy;

  if (newX < 0 || newX > 16 || newY < 0 || newY > 16 || boardData[newY][newX] == null) return;

  const pushed = players.find(p => p.x === newX && p.y === newY);
  if (pushed) {
    const px = newX + dx, py = newY + dy;
    if (px < 0 || px > 16 || py < 0 || py > 16 || boardData[py][px] == null || players.some(p => p.x === px && p.y === py)) {
      alert("無法推開其他玩家，移動取消"); return;
    }
    pushed.cube = rotateCube(pushed.cube, direction);
    pushed.x = px; pushed.y = py;
  }

  player.x = newX;
  player.y = newY;

  const cellValue = boardData[newY][newX];
  const cellColor = colorMap[cellValue];
  player.cube = rotateCube(player.cube, direction);
  console.log(`🏃‍♂️ 玩家移動後位置：(${player.x}, ${player.y})，頂面：${player.cube.top}`);

  if (player.cube.top === 'white' || cellColor === 'white') {
      console.log(`⚪ ${player.name} 觸發放逐條件：頂面=${player.cube.top}, 格子顏色=${cellColor}`);
      this.enqueueAction({ type: 'BANISH_PLAYER', playerId });
      return; // 放逐後直接結束該次移動處理，不檢查其他規則
    }

  const rules = this.checkTriggeredRules(player) ?? [];

  const wasExtraMove = this.turnPhase === 'EXTRA_MOVE';

  if (rules.length > 0) {
    this.handleTriggeredRules(player, rules);
  }

  if (this.needsToChangeTopColor(player)) {

  await this.forceChangeTopColor(player);

  const newRules = this.checkTriggeredRules(player) ?? [];
  if (newRules.length > 0) {
    this.handleTriggeredRules(player, newRules);
    return;
  }
}

  // 如果是額外移動，不管有沒有觸發規則都要結束回合
  if (wasExtraMove) {
    this.turnPhase = 'NORMAL';
    this.enqueueAction({ type: 'END_TURN' });
  } else if (rules.length === 0) {
    // 正常移動且沒觸發規則才結束回合
    this.enqueueAction({ type: 'END_TURN' });
  }
}


  handleTriggeredRules(player, rules) {
  const ruleTypes = rules.map(r => r.type);
  console.log('🧠 本回合觸發規則：', ruleTypes);

  if (ruleTypes.includes('RULE8')) {
    this.handleRule8Trigger(player);
  } else if (ruleTypes.includes('RULE6')) {
    this.handleRule6Trigger(player);
  }
}

  checkRule6Flexible(player) {
  const color = player.cube.top;
  const px = player.x;
  const py = player.y;

  // 掃描所有可能包含玩家的 3x3 區塊
  for (let offsetY = -2; offsetY <= 0; offsetY++) {
    for (let offsetX = -2; offsetX <= 0; offsetX++) {

      // 先收集該 3x3 區塊內的所有方塊資訊（是否同色、是否是玩家）
      const zone = []; // 存入每格的資訊
      let containsSelf = false;

      for (let dy = 0; dy < 3; dy++) {
        for (let dx = 0; dx < 3; dx++) {
          const nx = px + offsetX + dx;
          const ny = py + offsetY + dy;
          if (!inBounds(nx, ny)) continue;

          const cellValue = boardData[ny]?.[nx];
          const cube = players.find(p => p.x === nx && p.y === ny)?.cube;
          const colorHere = cube?.top ?? colorMap[cellValue];
          const isSelf = (nx === px && ny === py);

          if (isSelf) containsSelf = true;

          zone.push({
            x: nx,
            y: ny,
            color: colorHere,
            isSelf: isSelf,
            visited: false,
            cellValue:cellValue
          });
        }
      }
      // console.log(zone)
      if (!containsSelf) continue;

      // 找出玩家自己在 zone 中的位置
      const start = zone.find(cell => cell.isSelf && cell.color === color);
      if (!start) continue;

      // flood fill（4 向連通）開始統計同色區塊
      let stack = [start];
      start.visited = true;
      let connectedCount = 1;

      while (stack.length > 0) {
        const current = stack.pop();

        const neighbors = zone.filter(cell => {
          if (cell.visited || cell.color !== color) return false;

          // 判斷是否與 current 是上下左右相鄰（4 向）
          const dx = Math.abs(cell.x - current.x);
          const dy = Math.abs(cell.y - current.y);
          return dx <= 1 && dy <= 1 && (dx + dy !== 0);
          });

        for (const neighbor of neighbors) {
          const cellvalue_n = boardData[neighbor.y]?.[neighbor.x];
          console.log(`🌟 統計同色區塊：`,cellvalue_n);
          neighbor.visited = true;
          stack.push(neighbor);
          connectedCount++;
          console.log('rule6統計數量',connectedCount)
        }
      }

      if (connectedCount >= 3) {
        console.log(`✅ Rule 6 成功觸發：有連通的 ${connectedCount} 枚同色（含自己）`);
        return true;
      }
    }
  }

  return false;
}


  checkTriggeredRules(player) {
    if (!player || !player.cube) return [];

    console.log(`🧪 檢查 ${player.name} 的觸發規則，頂面：${player.cube.top}`);

    const result = [];
    const color = player.cube.top;

    // === Rule 8 判斷：是否有一直線連續 3 枚同頂面色 ===
    const isStraightLineThree = () => {
      const directions = [
        [1, 0],   // →
        [0, 1],   // ↓
        [1, 1],   // ↘
        [1, -1]   // ↗
      ];

      for (const [dx, dy] of directions) {
        let count = 1;

        // 正方向延伸
        let nx = player.x + dx;
        let ny = player.y + dy;
        while (inBounds(nx, ny)) {
          const cellValue = boardData[ny][nx]; // 該格子編號
            const cube = players.find(p => p.x === nx && p.y === ny)?.cube;

            // 🎯 優先看 cube 的顏色，沒有 cube 就看該格子的顏色
            const colorHere = cube?.top ?? colorMap[cellValue];

          if (colorHere === color) {
            console.log('rule8一樣顏色的格子', colorHere, cellValue);
            count++;
            nx += dx;
            ny += dy;
          } else break;
        }

        // 反方向延伸
        nx = player.x - dx;
        ny = player.y - dy;
        while (inBounds(nx, ny)) {
            const cellValue = boardData[ny][nx]; // 該格子編號
            const cube = players.find(p => p.x === nx && p.y === ny)?.cube;

            // 🎯 優先看 cube 的顏色，沒有 cube 就看該格子的顏色
            const colorHere = cube?.top ?? colorMap[cellValue];

          if (colorHere === color) {
            console.log('rule8一樣顏色的格子', colorHere, cellValue);
            count++;
            console.log('統計數量',count)
            nx -= dx;
            ny -= dy;
          } else break;
        }

        if (count >= 3) {
          console.log(`✅ ${player.name} 成功觸發 Rule8（方向 [${dx}, ${dy}] 連線數：${count}）`);
          return true;
        }
      }

      return false;
    };

    const rule8Matched = isStraightLineThree();
    if (rule8Matched) {
      result.push({type: 'RULE8'});
      console.log('注意這裡', result);
    }

    // === Rule 6 判斷：九宮格內（不含自己）有同頂面色達 2 枚以上，且不屬於直線 ===
    if (!rule8Matched) {
      const rule6Matched = this.checkRule6Flexible(player);
      if (rule6Matched) {
        result.push({type: 'RULE6'});
      }
    }

      return result;
  }


  getRule6Candidates(player) {
    const color = player.cube.top;
    return players.filter(p => p !== player && (color === 'yellow' || p.cube.top === color));
  }

  getRule8Candidates(player) {
    return players.filter(p => p !== player && p.cube.top === player.cube.top);
  }

  handleRule6Trigger(player) {
  const candidates = this.getRule6Candidates(player);

  if (candidates.length === 0) {
    console.log(`⚠️ ${player.name} 觸發 Rule 6，但找不到可移動對象 → 結束回合`);
    this.enqueueAction({ type: 'END_TURN' }); // ✅ 加這行！
    return;
  }

  if (player.type === 'ai') {
    const target = candidates[Math.floor(Math.random() * candidates.length)];
    const dir = this.getRandomDirection();
    this.enqueueAction({
      type: 'RULE6_FORCE_MOVE',
      initiatorId: players.indexOf(player),
      targetId: players.indexOf(target),
      direction: dir
    });
  } else {
    this.waitForRule6Input(player, candidates);
  }
}


  handleRule8Trigger(player) {
    console.log(`🎯 觸發 Rule 8 by ${player.name}`);
    const sameColor = this.getRule8Candidates(player);
    if (sameColor.length === 0) {
      this.extraMoveUsed = true;
      this.enqueueAction({ type: 'EXTRA_MOVE', playerId: players.indexOf(player) });
      return;
    }

    if (player.type === 'ai') {
      const target = sameColor[Math.floor(Math.random() * sameColor.length)];
      const dir = this.getRandomDirection();
      this.enqueueAction({ type: 'RULE8_DESIGNATE_MOVE', initiatorId: players.indexOf(player), targetId: players.indexOf(target), direction: dir });
    } else {
      this.waitForRule8Input(player, sameColor);
    }
  }

  async handleExtraMove(action) {
  const { playerId } = action;
  const player = players[playerId];

  if (player.type === 'ai') {
    const dir = await getAIMove(player);
    this.enqueueAction({ type: 'NORMAL_MOVE', playerId, direction: dir });
  } else {
    this.currentTurnPlayer = playerId;
    this.turnPhase = 'EXTRA_MOVE';
    this.extraMoveUsed = false;
    alert(`${player.name} 可進行額外移動！請按方向鍵`);
  }
}


  async waitForRule6Input(player, list) {
    this.isProcessing = false;
    this.turnPhase = 'RULE6_TARGET';
    const idx = prompt(`觸發Rule6：選擇目標玩家\n${list.map((p,i)=>`${i+1}:${p.name}`).join('\n')}`);
    const target = list[parseInt(idx)-1];
    const dir = prompt("選擇方向（up/down/left/right）：");
    if (target) this.enqueueAction({ type: 'RULE6_FORCE_MOVE', initiatorId: players.indexOf(player), targetId: players.indexOf(target), direction: dir });
  }

  async waitForRule8Input(player, list) {
    this.isProcessing = false;
    this.turnPhase = 'RULE8_TARGET';
    const idx = prompt(`觸發Rule8：選擇玩家\n${list.map((p,i)=>`${i+1}:${p.name}`).join('\n')}`);
    const target = list[parseInt(idx)-1];
    const dir = prompt("選擇方向（up/down/left/right）：");
    if (target) this.enqueueAction({ type: 'RULE8_DESIGNATE_MOVE', initiatorId: players.indexOf(player), targetId: players.indexOf(target), direction: dir });
  }

  async handleRule6ForceMove({ initiatorId, targetId, direction }) {
    const target = players[targetId];
    const dx = direction === 'left' ? -1 : direction === 'right' ? 1 : 0;
    const dy = direction === 'up' ? -1 : direction === 'down' ? 1 : 0;
    const nx = target.x + dx, ny = target.y + dy;
    const px = nx + dx, py = ny + dy;

    const push = players.find(p => p.x === nx && p.y === ny);
    if (push && boardData[py]?.[px] != null && !players.some(p => p.x === px && p.y === py)) {
      push.x = px;
      push.y = py;
      push.cube = rotateCube(push.cube, direction);
    }

    target.x = nx;
    target.y = ny;
    target.cube = rotateCube(target.cube, direction);
    console.log('✅ 檢查被指定移動的玩家是否有觸發規則');
    // this.enqueueAction({ type: 'END_TURN' })
    const rules = this.checkTriggeredRules(target) ?? [];
    if (rules.length > 0) {
    this.handleTriggeredRules(target, rules);
    }
    else {
      if (this.needsToChangeTopColor(target)) {
        await this.forceChangeTopColor(target);

        const rules = this.checkTriggeredRules(target) ?? [];
        if (rules.length > 0) {
          this.handleTriggeredRules(target, rules);
          return;
        }
      }

      this.enqueueAction({ type: 'END_TURN' });
}
}


  async handleRule8DesignateMove({ initiatorId, targetId, direction }) {
  const target = players[targetId];
  const dx = direction === 'left' ? -1 : direction === 'right' ? 1 : 0;
  const dy = direction === 'up' ? -1 : direction === 'down' ? 1 : 0;
  const nx = target.x + dx, ny = target.y + dy;

  if (boardData[ny]?.[nx] != null && !players.some(p => p.x === nx && p.y === ny)) {
    target.x = nx;
    target.y = ny;
    target.cube = rotateCube(target.cube, direction);
  }
  console.log('✅ 檢查被指定移動的玩家是否有觸發規則');

  if (this.needsToChangeTopColor(target)) {
  await this.forceChangeTopColor(target);


  const triggered = this.checkTriggeredRules(target) ?? [];
  if (triggered.length > 0) {
    this.handleTriggeredRules(target, triggered);
    return;
  }
  }

  const triggered = this.checkTriggeredRules(target) ?? [];
  if (triggered.length > 0) {
    this.handleTriggeredRules(target, triggered);
  } else {
    // ✅ 若無新規則觸發 → 回到原始 initiator 拿 EXTRA_MOVE
    this.enqueueAction({ type: 'EXTRA_MOVE', playerId: initiatorId });
  }
}


  handleEndTurn() {
    console.log('🔁 結束回合：切換至下一位玩家');
    this.currentTurnPlayer = (this.currentTurnPlayer + 1) % players.length;
    this.turnPhase = 'NORMAL';
    if (players[this.currentTurnPlayer].type === 'ai') this.startAITurn();
  }

  async startAITurn() {
  const player = players[this.currentTurnPlayer];

  // 防止重複排入
  const alreadyQueued = this.actionQueue.some(
    act => act.type === 'NORMAL_MOVE' && act.playerId === this.currentTurnPlayer
  );
  if (alreadyQueued) return;

  const dir = await getAIMove(player);
  console.log(`🤖 ${player.name} 思考完成，決定方向：${dir}`);

  // ✅ 這裡延遲 1500ms 再執行，但先排進 queue（不會被跳過）
  this.enqueueAction({
    type: 'NORMAL_MOVE',
    playerId: this.currentTurnPlayer,
    direction: dir
  }, 10000);
}




  getRandomDirection() {
    const d = ['up', 'down', 'left', 'right'];
    return d[Math.floor(Math.random() * d.length)];
  }

  delay(ms) {
    return new Promise(res => setTimeout(res, ms));
  }
}

const gameFlow = new GameFlowManager();

  function move(direction) {
    if (gameFlow.isProcessing && gameFlow.turnPhase !== 'EXTRA_MOVE') {
      alert("請等待當前動作完成");
      return;
    }

  // 不管是什麼階段，玩家按方向鍵都是執行 NORMAL_MOVE
  gameFlow.enqueueAction({
    type: 'NORMAL_MOVE',
    playerId: gameFlow.currentTurnPlayer,
    direction: direction
  });

  // 如果是額外移動階段，移動完後直接結束回合
  if (gameFlow.turnPhase === 'EXTRA_MOVE') {
    gameFlow.turnPhase = 'NORMAL';
    // 不需要額外的動作，讓 handleNormalMove 中的邏輯處理回合結束
  }
}



function inBounds(x, y) {
  return y >= 0 && y < boardData.length &&
         x >= 0 && x < boardData[0].length;
}


window.move = move;
