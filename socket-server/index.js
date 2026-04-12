const { Server } = require('socket.io');
const http = require('http');

const server = http.createServer((req, res) => {
  if (req.url === '/') {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('POS Socket Server is running explicitly!');
  }
});
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  // Customer joins their order room for targeted updates
  socket.on('JOIN_ORDER', (orderId) => {
    socket.join(`order:${orderId}`);
    console.log(`Client ${socket.id} joined order room: ${orderId}`);
  });

  // Customer joins their table room
  socket.on('JOIN_TABLE', (tableId) => {
    socket.join(`table:${tableId}`);
    console.log(`Client ${socket.id} joined table room: ${tableId}`);
  });

  // POS/Customer sends new order to kitchen
  socket.on('NEW_ORDER', (data) => {
    console.log('New order:', data);
    io.emit('NEW_ORDER', data);
  });

  // Kitchen updates order status — broadcast globally AND to specific order room
  socket.on('UPDATE_ORDER_STATUS', (data) => {
    console.log('Order status update:', data);
    io.emit('UPDATE_ORDER_STATUS', data);
    // Targeted update to customer watching this order
    if (data.orderId) {
      io.to(`order:${data.orderId}`).emit('ORDER_STATUS_CHANGED', {
        orderId: data.orderId,
        status: data.status,
        timestamp: new Date().toISOString(),
      });
    }
  });

  // Item preparation toggle — targeted to order watchers
  socket.on('ITEM_PREPARED', (data) => {
    console.log('Item prepared:', data);
    if (data.orderId) {
      io.to(`order:${data.orderId}`).emit('ITEM_PREPARED', data);
    }
    io.emit('ITEM_PREPARED', data);
  });

  // Payment done
  socket.on('PAYMENT_DONE', (data) => {
    console.log('Payment done:', data);
    io.emit('PAYMENT_DONE', data);
    if (data.orderId) {
      io.to(`order:${data.orderId}`).emit('ORDER_STATUS_CHANGED', {
        orderId: data.orderId,
        status: 'PAID',
        timestamp: new Date().toISOString(),
      });
    }
  });

  // Customer display update
  socket.on('ORDER_UPDATE', (data) => {
    io.emit('ORDER_UPDATE', data);
  });

  socket.on('STAFF_REGISTERED', () => {
    console.log('New staff registered');
    io.emit('STAFF_REGISTERED');
  });

  socket.on('STAFF_APPROVED', () => {
    console.log('Staff approved');
    io.emit('STAFF_APPROVED');
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Socket.IO server running on port ${PORT} (Bound to 0.0.0.0)`);
});
