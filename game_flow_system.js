class GameFlowManager {
  constructor() {
    this.actionQueue = [];
    this.isProcessing = false;
    this.currentTurnPlayer = 0;
    this.turnPhase = 'NORMAL'; // NORMAL, EXTRA_MOVE, RULE6_TARGET, RULE8_TARGET
    this.extraMoveUsed = false;
    this.aiThinking = false;

  }

  enqueueAction(action, delayMs = 0) {
  // 避免連續加入兩個 END_TURN
  if (
    action.type === 'END_TURN' &&
    this.actionQueue.length > 0 &&
    this.actionQueue[this.actionQueue.length - 1].type === 'END_TURN'
  ) {
    console.warn('⚠️ 嘗試重複加入 END_TURN，略過');
    return;
  }

  this.actionQueue.push({ ...action, _delayMs: delayMs });
  if (!this.isProcessing) this.processQueue();
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
    this.isProcessing = false;
  }

  async executeAction(action) {
    switch (action.type) {
      case 'NORMAL_MOVE': await this.handleNormalMove(action); break;
      case 'EXTRA_MOVE': await this.handleExtraMove(action); break;
      case 'RULE6_FORCE_MOVE': await this.handleRule6ForceMove(action); break;
      case 'RULE8_DESIGNATE_MOVE': await this.handleRule8DesignateMove(action); break;
      case 'END_TURN': this.handleEndTurn(); break;
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
  player.cube = rotateCube(player.cube, direction);
  console.log(`🏃‍♂️ 玩家移動後位置：(${player.x}, ${player.y})，頂面：${player.cube.top}`);

  const rules = this.checkTriggeredRules(player);
  const wasExtraMove = this.turnPhase === 'EXTRA_MOVE';

  if (rules.length > 0) {
    this.handleTriggeredRules(player, rules);
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


  checkTriggeredRules(player) {
    console.log(`檢查 ${player.name} 的觸發規則...`);
    const color = player.cube.top;
    const nearby = [];

    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        const nx = player.x + dx, ny = player.y + dy;
        if ((dx || dy) && nx >= 0 && ny >= 0 && nx < 17 && ny < 17) {
          const num = boardData[ny][nx];
          if (num && colorMap[num] === color) nearby.push(num);
        }
      }
    }

    const result = [];
    if (nearby.length >= 2) result.push({ type: 'RULE6' });

    const isStraightLineThree = () => {
      for (const [dx, dy] of [[1, 0], [0, 1], [1, 1], [1, -1]]) {
        let count = 1; // 包含自己

        // 向正方向找
        let nx = player.x + dx;
        let ny = player.y + dy;
        while (inBounds(nx, ny)) {
          const p = players.find(p => p.x === nx && p.y === ny && p.cube?.top === color);
          if (p) {
            count++;
            nx += dx;
            ny += dy;
          } else break;
        }

        // 向反方向找
        nx = player.x - dx;
        ny = player.y - dy;
        while (inBounds(nx, ny)) {
          const p = players.find(p => p.x === nx && p.y === ny && p.cube?.top === color);
          if (p) {
            count++;
            nx -= dx;
            ny -= dy;
          } else break;
        }

        if (count >= 3) return true; // 找到連線 ≥ 3
      }

      return false;
    };

    if (isStraightLineThree()) {
      result.push({ type: 'RULE8' });
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
    console.log('✅ 觸發 Rule6 移動完成，執行 END_TURN');
    this.enqueueAction({ type: 'END_TURN' })
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

  this.enqueueAction({ type: 'EXTRA_MOVE', playerId: initiatorId });
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
  return x >= 0 && y >= 0 && x < 17 && y < 17;
}

window.move = move;
