export const setupSocketHandlers = (io) => {
  io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    // User joins their personal room
    socket.on('join', (userId) => {
      if (userId) {
        socket.join(userId);
        console.log(`User ${userId} joined their personal room`);
      }
    });

    // User joins a role-based room
    socket.on('join_role', (role) => {
      socket.join(role);
    });

    // --- Chat Features ---
    socket.on('message:new', (data) => {
      // Broadcast message to receiver
      socket.to(data.receiverId).emit('message:new', data);
    });

    socket.on('typing:start', (data) => {
      socket.to(data.receiverId).emit('typing:start', data);
    });

    socket.on('typing:stop', (data) => {
      socket.to(data.receiverId).emit('typing:stop', data);
    });

    // Generic broadcaster for new notifications
    // A client can emit this, or the backend can use io.to().emit directly
    // If a client emits this (e.g. sending a message), we broadcast it
    socket.on('notification:new', (data) => {
      const { recipientId, role } = data;
      if (recipientId) {
        io.to(recipientId).emit('notification:new', data);
      } else if (role) {
        io.to(role).emit('notification:new', data);
      } else {
        io.emit('notification:new', data);
      }
    });

    // Specific events mentioned in requirements
    socket.on('message:new', (data) => {
      if (data.recipientId) {
        io.to(data.recipientId).emit('message:new', data);
      }
    });

    socket.on('request:updated', (data) => {
      if (data.userId) {
        io.to(data.userId).emit('request:updated', data);
      }
    });

    socket.on('circular:new', (data) => {
      if (data.targetRole) {
        io.to(data.targetRole).emit('circular:new', data);
      } else {
        io.emit('circular:new', data); // broadcast to all
      }
    });

    socket.on('complaint:updated', (data) => {
      if (data.userId) {
        io.to(data.userId).emit('complaint:updated', data);
      }
    });

    socket.on('user:updated', (data) => {
      if (data.userId) {
        io.to(data.userId).emit('user:updated', data);
      }
    });

    socket.on('disconnect', () => {
      console.log(`Socket disconnected: ${socket.id}`);
    });
  });
};
