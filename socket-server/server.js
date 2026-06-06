const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors()); // Cross-Origin Resource Sharing (taki tera frontend connect kar sake)

const server = http.createServer(app);

// Initialize Socket.io with CORS enabled for frontend connection
const io = new Server(server, {
  cors: {
    origin: "*", // Development ke liye open rakha hai. Production mein isko Vercel URL se replace karenge.
    methods: ["GET", "POST"]
  }
});

io.on('connection', (socket) => {
  console.log('A stealth connection established:', socket.id);

  // Both users will automatically join a hidden room
  socket.join('stealth_room_007');

  // Listen for incoming encrypted messages
  socket.on('send_message', (data) => {
    // Instantly forward the message to the other person in the room
    socket.to('stealth_room_007').emit('receive_message', data);
  });

  // Handle sudden disconnects (Panic button, tab closed, screen locked)
  socket.on('disconnect', () => {
    console.log('Connection wiped:', socket.id);
  });
});

// Run server on port 3001 to avoid clashing with Next.js (port 3000)
const PORT = 3001;
server.listen(PORT, () => {
  console.log(`Stealth node running completely in RAM on port ${PORT}`);
});