const express = require("express");
const http = require("http");
const fs = require("fs");
const path = require("path");
const { Server } = require("socket.io");
const QUESTIONS = require("./questions");
const SENTENCES = require("./sentences");

const HIGHSCORE_FILE = path.join(__dirname, "highscore.json");

function loadHighscore() {
  try {
    const hs = JSON.parse(fs.readFileSync(HIGHSCORE_FILE, "utf8"));
    return { bestAvg: hs.bestAvg || 0, date: hs.date || null };
  } catch {
    return { bestAvg: 0, date: null };
  }
}

function saveHighscore(hs) {
  try {
    fs.writeFileSync(HIGHSCORE_FILE, JSON.stringify(hs));
  } catch (e) {
    console.error("highscore save failed:", e.message);
  }
}

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(path.join(__dirname, "public")));

const TOTAL_QUESTIONS = 20;
const rooms = {}; // roomCode -> room state

function makeRoomCode() {
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 4; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return rooms[code] ? makeRoomCode() : code;
}

function pickQuestions() {
  const shuffled = [...QUESTIONS].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, TOTAL_QUESTIONS);
}

function publicPlayers(room) {
  return Object.entries(room.players).map(([id, p]) => ({
    id,
    name: p.name,
    correct: p.correct,
    wrong: p.wrong,
    net: p.correct - p.wrong,
    answered: p.answeredCurrent,
  }));
}

function sendQuestion(roomCode) {
  const room = rooms[roomCode];
  if (!room || room.phase !== "playing") return;
  const q = room.questions[room.currentIndex];
  for (const p of Object.values(room.players)) p.answeredCurrent = false;
  io.to(roomCode).emit("question", {
    index: room.currentIndex,
    total: TOTAL_QUESTIONS,
    sentence: q.sentence,
    hint: q.hint,
    ja: q.ja,
    coins: room.coins,
    deadline: room.deadline,
    players: publicPlayers(room),
  });
}

function endGame(roomCode, timedOut) {
  const room = rooms[roomCode];
  if (!room || room.phase !== "playing") return;
  room.phase = "finished";
  clearTimeout(room.timer);

  const players = publicPlayers(room);
  const topContributors = [...players]
    .sort((a, b) => b.net - a.net || b.correct - a.correct)
    .slice(0, 3);

  // 記録は「1人あたり平均コイン数」で人数差を吸収して比較する
  const playerCount = Object.keys(room.players).length;
  const avgCoins = playerCount > 0 ? room.coins / playerCount : 0;
  const hs = loadHighscore();
  const isNewRecord = avgCoins > hs.bestAvg;
  const prevBestAvg = hs.bestAvg;
  if (isNewRecord) saveHighscore({ bestAvg: avgCoins, date: new Date().toISOString() });

  io.to(roomCode).emit("gameOver", {
    coins: room.coins,
    maxCoins: TOTAL_QUESTIONS * playerCount,
    questionsCompleted: room.currentIndex,
    totalQuestions: TOTAL_QUESTIONS,
    timedOut,
    players,
    topContributors,
    avgCoins,
    prevBestAvg,
    isNewRecord,
  });
}

function maybeAdvance(roomCode) {
  const room = rooms[roomCode];
  if (!room) return;
  const allAnswered = Object.values(room.players).every((p) => p.answeredCurrent);
  if (!allAnswered) return;

  const q = room.questions[room.currentIndex];
  setTimeout(() => {
    if (!rooms[roomCode] || room.phase !== "playing") return;
    room.currentIndex++;
    if (room.currentIndex >= TOTAL_QUESTIONS) {
      endGame(roomCode, false);
    } else {
      io.to(roomCode).emit("reveal", { answer: q.answer });
      setTimeout(() => sendQuestion(roomCode), 2000);
    }
  }, 800);
}

io.on("connection", (socket) => {
  socket.on("createRoom", ({ name }, cb) => {
    const roomCode = makeRoomCode();
    rooms[roomCode] = {
      host: socket.id,
      phase: "lobby",
      coins: 0,
      currentIndex: 0,
      questions: pickQuestions(),
      players: {},
    };
    joinRoom(socket, roomCode, name, cb);
  });

  socket.on("joinRoom", ({ roomCode, name }, cb) => {
    const code = (roomCode || "").toUpperCase().trim();
    const room = rooms[code];
    if (!room) return cb({ error: "ルームが見つかりません" });
    if (room.phase !== "lobby") return cb({ error: "ゲームはすでに開始しています" });
    joinRoom(socket, code, name, cb);
  });

  socket.on("startGame", (opts) => {
    const roomCode = socket.data.roomCode;
    const room = rooms[roomCode];
    if (!room || room.host !== socket.id || room.phase !== "lobby") return;
    const sec = Math.min(600, Math.max(10, Number(opts && opts.timeLimitSec) || 180));
    room.phase = "playing";
    room.deadline = Date.now() + sec * 1000;
    room.timer = setTimeout(() => endGame(roomCode, true), sec * 1000);
    sendQuestion(roomCode);
  });

  socket.on("answer", ({ text }) => {
    const roomCode = socket.data.roomCode;
    const room = rooms[roomCode];
    if (!room || room.phase !== "playing") return;
    const player = room.players[socket.id];
    if (!player || player.answeredCurrent) return;

    const q = room.questions[room.currentIndex];
    const correct = (text || "").trim().toLowerCase() === q.answer;
    player.answeredCurrent = true;
    if (correct) {
      player.correct++;
      room.coins++;
    } else {
      player.wrong++;
      room.coins = Math.max(0, room.coins - 1);
    }

    socket.emit("answerResult", { correct, answer: correct ? undefined : null });
    io.to(roomCode).emit("coinsUpdate", {
      coins: room.coins,
      players: publicPlayers(room),
      lastEvent: { name: player.name, correct },
    });
    maybeAdvance(roomCode);
  });

  socket.on("disconnect", () => {
    const roomCode = socket.data.roomCode;
    const room = rooms[roomCode];
    if (!room) return;
    delete room.players[socket.id];
    if (Object.keys(room.players).length === 0) {
      clearTimeout(room.timer);
      delete rooms[roomCode];
      return;
    }
    if (room.host === socket.id) room.host = Object.keys(room.players)[0];
    io.to(roomCode).emit("playersUpdate", {
      hostId: room.host,
      players: publicPlayers(room),
      hostName: room.players[room.host].name,
    });
    if (room.phase === "playing") maybeAdvance(roomCode);
  });

  function joinRoom(sock, roomCode, name, cb) {
    const room = rooms[roomCode];
    sock.join(roomCode);
    sock.data.roomCode = roomCode;
    room.players[sock.id] = {
      name: (name || "名無し").slice(0, 12),
      correct: 0,
      wrong: 0,
      answeredCurrent: false,
    };
    cb({ roomCode, isHost: room.host === sock.id });
    io.to(roomCode).emit("playersUpdate", {
      hostId: room.host,
      players: publicPlayers(room),
      hostName: room.players[room.host].name,
    });
  }
});

/* ========== 並べ替えバトル（チーム対抗） ========== */

const ORDER_ROUNDS = 5;
const ROUND_TIME_MS = 60000;
const FREEZE_MS = 3000;
const orderRooms = {}; // roomCode -> room state

function makeOrderRoomCode() {
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 4; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return orderRooms[code] ? makeOrderRoomCode() : code;
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function orderTeamMembers(room, team) {
  return Object.entries(room.players).filter(([, p]) => p.team === team);
}

function orderPublicState(room) {
  return {
    scores: room.scores,
    teams: {
      red: orderTeamMembers(room, "red").map(([, p]) => p.name),
      blue: orderTeamMembers(room, "blue").map(([, p]) => p.name),
    },
  };
}

function orderStartRound(roomCode) {
  const room = orderRooms[roomCode];
  if (!room || room.phase !== "playing") return;
  const sentence = room.sentences[room.round];
  room.progress = { red: 0, blue: 0 };
  room.roundActive = true;
  room.deadline = Date.now() + ROUND_TIME_MS;

  for (const team of ["red", "blue"]) {
    const members = orderTeamMembers(room, team);
    members.forEach(([, p]) => { p.hand = []; p.frozenUntil = 0; });
    shuffle(sentence.words).forEach((word, i) => {
      members[i % members.length][1].hand.push(word);
    });
    members.forEach(([id, p]) => {
      io.to(id).emit("order:roundStart", {
        round: room.round,
        totalRounds: ORDER_ROUNDS,
        ja: sentence.ja,
        wordCount: sentence.words.length,
        hand: p.hand,
        yourTeam: team,
        deadline: room.deadline,
        ...orderPublicState(room),
      });
    });
  }

  clearTimeout(room.timer);
  room.timer = setTimeout(() => orderEndRound(roomCode, "timeout"), ROUND_TIME_MS);
}

function orderEndRound(roomCode, reason) {
  const room = orderRooms[roomCode];
  if (!room || !room.roundActive) return;
  room.roundActive = false;
  clearTimeout(room.timer);

  let winner;
  if (reason === "complete") {
    winner = room.progress.red >= room.sentences[room.round].words.length ? "red" : "blue";
  } else {
    winner =
      room.progress.red > room.progress.blue ? "red" :
      room.progress.blue > room.progress.red ? "blue" : "draw";
  }
  if (winner !== "draw") room.scores[winner]++;

  const sentence = room.sentences[room.round];
  io.to(roomCode).emit("order:roundResult", {
    winner,
    reason,
    sentence: sentence.words.join(" "),
    ja: sentence.ja,
    round: room.round,
    totalRounds: ORDER_ROUNDS,
    ...orderPublicState(room),
  });

  room.round++;
  setTimeout(() => {
    if (!orderRooms[roomCode]) return;
    if (room.round >= ORDER_ROUNDS) orderEndGame(roomCode, null);
    else orderStartRound(roomCode);
  }, 4000);
}

function orderEndGame(roomCode, forcedWinner) {
  const room = orderRooms[roomCode];
  if (!room || room.phase !== "playing") return;
  room.phase = "finished";
  clearTimeout(room.timer);
  const { red, blue } = room.scores;
  const winner = forcedWinner || (red > blue ? "red" : blue > red ? "blue" : "draw");
  io.to(roomCode).emit("order:gameOver", {
    winner,
    forced: !!forcedWinner,
    ...orderPublicState(room),
    contributions: Object.values(room.players)
      .map((p) => ({ name: p.name, team: p.team, placed: p.placed }))
      .sort((a, b) => b.placed - a.placed),
  });
}

io.on("connection", (socket) => {
  socket.on("order:createRoom", ({ name }, cb) => {
    const roomCode = makeOrderRoomCode();
    orderRooms[roomCode] = {
      host: socket.id,
      phase: "lobby",
      players: {},
      scores: { red: 0, blue: 0 },
      sentences: shuffle(SENTENCES).slice(0, ORDER_ROUNDS),
      round: 0,
      progress: { red: 0, blue: 0 },
      roundActive: false,
    };
    orderJoin(socket, roomCode, name, cb);
  });

  socket.on("order:joinRoom", ({ roomCode, name }, cb) => {
    const code = (roomCode || "").toUpperCase().trim();
    const room = orderRooms[code];
    if (!room) return cb({ error: "ルームが見つかりません" });
    if (room.phase !== "lobby") return cb({ error: "ゲームはすでに開始しています" });
    orderJoin(socket, code, name, cb);
  });

  socket.on("order:startGame", () => {
    const roomCode = socket.data.orderRoomCode;
    const room = orderRooms[roomCode];
    if (!room || room.host !== socket.id || room.phase !== "lobby") return;
    if (Object.keys(room.players).length < 2) {
      socket.emit("order:error", { message: "2人以上で開始できます" });
      return;
    }
    const ids = shuffle(Object.keys(room.players));
    ids.forEach((id, i) => { room.players[id].team = i % 2 === 0 ? "red" : "blue"; });
    room.phase = "playing";
    orderStartRound(roomCode);
  });

  socket.on("order:place", ({ word }) => {
    const roomCode = socket.data.orderRoomCode;
    const room = orderRooms[roomCode];
    if (!room || room.phase !== "playing" || !room.roundActive) return;
    const player = room.players[socket.id];
    if (!player || Date.now() < player.frozenUntil) return;

    const idx = player.hand.indexOf(word);
    if (idx === -1) return;

    const team = player.team;
    const sentence = room.sentences[room.round];
    const expected = sentence.words[room.progress[team]];

    if (word === expected) {
      player.hand.splice(idx, 1);
      player.placed++;
      room.progress[team]++;
      socket.emit("order:placeOk", { word });
      const placedWords = sentence.words.slice(0, room.progress[team]);
      for (const [id, p] of Object.entries(room.players)) {
        io.to(id).emit("order:progress", {
          team,
          count: room.progress[team],
          wordCount: sentence.words.length,
          words: p.team === team ? placedWords : undefined,
          by: p.team === team ? player.name : undefined,
        });
      }
      if (room.progress[team] >= sentence.words.length) orderEndRound(roomCode, "complete");
    } else {
      player.frozenUntil = Date.now() + FREEZE_MS;
      socket.emit("order:frozen", { until: player.frozenUntil, word });
      for (const [id, p] of Object.entries(room.players)) {
        if (p.team === team && id !== socket.id) {
          io.to(id).emit("order:teammateMiss", { name: player.name });
        }
      }
    }
  });

  socket.on("disconnect", () => {
    const roomCode = socket.data.orderRoomCode;
    const room = orderRooms[roomCode];
    if (!room) return;
    const leaving = room.players[socket.id];
    delete room.players[socket.id];

    if (Object.keys(room.players).length === 0) {
      clearTimeout(room.timer);
      delete orderRooms[roomCode];
      return;
    }
    if (room.host === socket.id) room.host = Object.keys(room.players)[0];

    if (room.phase === "playing" && leaving && leaving.team) {
      const members = orderTeamMembers(room, leaving.team);
      if (members.length === 0) {
        // チームが全滅したら相手チームの勝ち
        orderEndGame(roomCode, leaving.team === "red" ? "blue" : "red");
        return;
      }
      // 抜けた人の持ち札を残ったチームメイトに配り直す
      if (room.roundActive && leaving.hand.length > 0) {
        leaving.hand.forEach((word, i) => {
          members[i % members.length][1].hand.push(word);
        });
        members.forEach(([id, p]) => io.to(id).emit("order:handUpdate", { hand: p.hand }));
      }
    }
    io.to(roomCode).emit("order:playersUpdate", {
      hostId: room.host,
      players: Object.values(room.players).map((p) => p.name),
      hostName: room.players[room.host].name,
      ...orderPublicState(room),
    });
  });

  function orderJoin(sock, roomCode, name, cb) {
    const room = orderRooms[roomCode];
    sock.join(roomCode);
    sock.data.orderRoomCode = roomCode;
    room.players[sock.id] = {
      name: (name || "名無し").slice(0, 12),
      team: null,
      hand: [],
      placed: 0,
      frozenUntil: 0,
    };
    cb({ roomCode, isHost: room.host === sock.id });
    io.to(roomCode).emit("order:playersUpdate", {
      hostId: room.host,
      players: Object.values(room.players).map((p) => p.name),
      hostName: room.players[room.host].name,
      ...orderPublicState(room),
    });
  }
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
