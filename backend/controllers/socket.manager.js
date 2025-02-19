import { Server } from 'socket.io';

let connections = {};
let messages = {};
let timeOnline = {};

const connectToSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
      allowedHeaders: ["*"],
      credentials: true,
    },
  });

  io.on('connection', (socket) => {
    socket.on('join-call', (path) => {
      if (!connections[path]) {
        connections[path] = [];
      }

      connections[path].push(socket.id);
      timeOnline[socket.id] = new Date();

      connections[path].forEach((id) => {
        io.to(id).emit('user-joined', socket.id, connections[path]);
      });

      // Send existing messages to the new user
      if (messages[path]) {
        messages[path].forEach((message) => {
          io.to(socket.id).emit('chat-message', message.data, message.sender, message['socket-id-sender']);
        });
      }
    });

    // Event: Send signaling data to a specific user
    socket.on('signal', (toId, message) => {
      io.to(toId).emit('signal', socket.id, message);
    });

    // Event: Handle chat messages
    socket.on('chat-message', (data, sender) => {
      const matchingRoomEntry = Object.entries(connections).find(
        ([roomKey, roomValue]) => roomValue.includes(socket.id)
      );

      if (!matchingRoomEntry) return;

      const [matchingRoom] = matchingRoomEntry;

      if (!messages[matchingRoom]) {
        messages[matchingRoom] = [];
      }

      messages[matchingRoom].push({ sender, data, 'socket-id-sender': socket.id });

      // Broadcast the message to all users in the room
      connections[matchingRoom].forEach((id) => {
        io.to(id).emit('chat-message', data, sender, socket.id);
      });
    }
    );

    socket.on('disconnect', () => {
      const disconnectTime = new Date();
      const onlineDuration = Math.abs(timeOnline[socket.id] - disconnectTime);

      Object.entries(connections).forEach(([roomKey, roomValue]) => {
        if (roomValue.includes(socket.id)) {
          roomValue.forEach((id) => {
            io.to(id).emit('user-left', socket.id);
          });

          connections[roomKey] = roomValue.filter((id) => id !== socket.id);

          // Delete the room if it's empty
          if (connections[roomKey].length === 0) {
            delete connections[roomKey];
          }
        }
      });

      // Clean up user-specific data
      delete timeOnline[socket.id];
    });

    return io;
  });
};

export default connectToSocket;