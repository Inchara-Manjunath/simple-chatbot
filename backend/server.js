const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
app.use(cors());

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"]
  }
});

// Simple bot replies
function botReply(message) {
  message = message.toLowerCase();

  if (message.includes("hello") || message.includes("hi")) return "Hello! How can I help you today?";
  if (message.includes("who are you")) return "I'm a simple web chatbot 😊";
  if (message.includes("name")) return "I'm your friendly chatbot!";

  return "I'm not trained for that yet, but I'm learning! 🤖";
}

io.on("connection", (socket) => {
  socket.on("message", (msg) => {
    const reply = botReply(msg);
    socket.emit("bot-message", reply);
  });
});

server.listen(5000, () => console.log("✅ Backend running on port 5000"));
