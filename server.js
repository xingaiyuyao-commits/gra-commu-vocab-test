const express = require("express");
const http = require("http");
const fs = require("fs");
const path = require("path");
const { Server } = require("socket.io");
const QUESTIONS = require("./questions");

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
      players: publicPlayers(room),
      hostName: room.players[room.host].name,
    });
  }
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
