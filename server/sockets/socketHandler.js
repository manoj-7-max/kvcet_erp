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
      if (role) {
        socket.join(role);
        console.log(`Socket ${socket.id} joined role-based room: ${role}`);
      }
    });

    // --- Chat Features ---
    socket.on('message:new', (data) => {
      // Broadcast message to receiver room
      if (data.receiverId) {
        io.to(data.receiverId).emit('message:new', data);
      }
    });

    socket.on('typing:start', (data) => {
      if (data.receiverId) {
        socket.to(data.receiverId).emit('typing:start', data);
      }
    });

    socket.on('typing:stop', (data) => {
      if (data.receiverId) {
        socket.to(data.receiverId).emit('typing:stop', data);
      }
    });

    // --- Standard Notification Event ---
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

    // --- Standard Action Events ---
    socket.on('request:updated', (data) => {
      if (data.studentId) {
        io.to(data.studentId.toString()).emit('request:updated', data);
      }
    });

    socket.on('circular:new', (data) => {
      io.emit('circular:new', data);
    });

    socket.on('complaint:updated', (data) => {
      if (data.submittedBy) {
        io.to(data.submittedBy.toString()).emit('complaint:updated', data);
      }
    });

    socket.on('user:updated', (data) => {
      if (data.userId) {
        io.to(data.userId.toString()).emit('user:updated', data);
      }
    });

    socket.on('password:reset', (data) => {
      if (data.userId) {
        io.to(data.userId.toString()).emit('password:reset', data);
      }
    });

    socket.on('disconnect', () => {
      console.log(`Socket disconnected: ${socket.id}`);
    });
  });
};
