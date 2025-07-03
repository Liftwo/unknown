async function askOpenAI(promptText) {
  const OPENAI_API_KEY = 'sk-Mjd7hcdyCxDktN6XGyapqfj12eCKOmsYvVpgcz1psY0R8cMn';
  const OPENAI_MODEL = 'gpt-4.1-mini';
  // console.log("傳送的prompt",promptText)
  try {
    const response = await fetch('https://api.chatanywhere.tech/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        messages: [{ role: 'user', content: promptText }]
      })
    });

    const data = await response.json();
    return data.choices[0].message.content.trim();
  } catch (err) {
    console.error("OpenAI 請求錯誤:", err);
    return null;
  }
}

    async function getAIMove(player, boardState) {
    function getDirectionInfo(player) {
      const x = player.x;
      const y = player.y;
      const directions = {
        up:    { dx: 0, dy: -1 },
        down:  { dx: 0, dy: 1 },
        left:  { dx: -1, dy: 0 },
        right: { dx: 1, dy: 0 }
      };

      let result = "From your current position, the adjacent tiles are:\n";
      for (const [dir, {dx, dy}] of Object.entries(directions)) {
        const nx = x + dx;
        const ny = y + dy;
        let desc = "null";
        if (nx >= 0 && nx < 17 && ny >= 0 && ny < 17) {
          const num = boardData[ny][nx];
          desc = num !== null ? colorMap[num] : "null";
        }
        result += `- ${dir}: ${desc}\n`;
      }

      result += "Reminder: Do not move to directions where the tile is null or white.\n";
      return result;
    }

      function getCubeFaceInfo(player) {
       const faceMap = player.cube;
       return `Your cube orientation is: top=${faceMap.top}, bottom=${faceMap.bottom}, front=${faceMap.front}, back=${faceMap.back}, left=${faceMap.left}, right=${faceMap.right}`;
      }


      try {
        const gameContext = {
          currentPlayer: player,
          board: boardData,
          players: players,
          colorMap: colorMap
        };

        const prompt = `You are playing Unknown game as player ${player.name}.
        Your current position is (x=${player.x}, y=${player.y}) and and your cube orientation is as follows:${getCubeFaceInfo(player)}
        ${getDirectionInfo(player)}


        Please consider the following rules:
        1. You must not move to tiles that are NULL (nonexistent) or white.
        2. If your cube's TOP color becomes white after moving, you will also be banished back to a gray square
        3. Prefer moving to squares that match your top color (${player.cube.top})



        You can move in these directions: up, down, left, right

        What is your recommended move? Please respond with just one word: up/down/left/right`;

        // console.log("傳送的prompt",prompt)
        const fullText = await askOpenAI(prompt);
        // const fullText = data.choices[0].message.content.trim().toLowerCase();
        console.log("AI回復的資料:", fullText);

        // 從文字中擷取方向

        const match = fullText.match(/\b(up|down|left|right)\b/);
        const move = match ? match[1] : null;

        if (!move) {
          console.log('未能從回應中擷取方向，使用預設策略');
          return 'down'; // fallback
        }

        return move;

      } catch (error) {
        console.error('Error getting AI move:', error);
        return 'down';
      }
    }

window.getAIMove = getAIMove;