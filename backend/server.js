const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');

// Routes
const agentsRouter = require('./routes/agents');
const messagesRouter = require('./routes/messages');
const groupsRouter = require('./routes/groups');
const workspacesRouter = require('./routes/workspaces');
const sessionsRouter = require('./routes/sessions');
const llmRouter = require('./routes/llm');
const runtimeRouter = require('./routes/runtime');
const capabilitiesRouter = require('./routes/capabilities');
const memoryRouter = require('./routes/memory');

// Workspace Manager
const WorkspaceManager = require('./utils/workspaceManager');
const workspaceManager = new WorkspaceManager(path.join(__dirname, 'workspaces'));

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Middleware
app.use(cors());
app.use(express.json());

// API Routes
app.use('/api/agents', agentsRouter);
app.use('/api/messages', messagesRouter);
app.use('/api/groups', groupsRouter);
app.use('/api/workspaces', workspacesRouter);
app.use('/api/sessions', sessionsRouter);
app.use('/api/llm', llmRouter);
app.use('/api/runtime', runtimeRouter);
app.use('/api/capabilities', capabilitiesRouter);
app.use('/api/memory', memoryRouter);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// WebSocket connection management
const connectedAgents = new Map(); // agentId -> { socketId, metadata }
const agentSockets = new Map();    // socketId -> agentId

io.on('connection', (socket) => {
  console.log(`[WS] Client connected: ${socket.id}`);

  // Agent registers itself
  socket.on('register', (data) => {
    const { agentId, name, capabilities } = data;
    connectedAgents.set(agentId, {
      socketId: socket.id,
      name,
      capabilities,
      connectedAt: new Date().toISOString()
    });
    agentSockets.set(socket.id, agentId);
    console.log(`[WS] Agent registered: ${agentId} (${name})`);
    io.emit('agent:online', { agentId, name, capabilities });
  });

  // Agent sends a message to a target (group or agent)
  socket.on('message:send', (data) => {
    const { from, to, content, targetType } = data; // targetType: 'agent' | 'group'
    if (targetType === 'group') {
      // Broadcast to all agents in the group
      io.to(`group:${to}`).emit('message:received', {
        from,
        groupId: to,
        content,
        timestamp: new Date().toISOString()
      });
    } else {
      // Send to specific agent
      const targetAgent = connectedAgents.get(to);
      if (targetAgent) {
        io.to(targetAgent.socketId).emit('message:received', {
          from,
          to,
          content,
          timestamp: new Date().toISOString()
        });
      }
    }
  });

  // Agent joins a group
  socket.on('group:join', ({ agentId, groupId }) => {
    socket.join(`group:${groupId}`);
    console.log(`[WS] Agent ${agentId} joined group ${groupId}`);
    socket.to(`group:${groupId}`).emit('agent:joined', { agentId, groupId });
  });

  // Agent leaves a group
  socket.on('group:leave', ({ agentId, groupId }) => {
    socket.leave(`group:${groupId}`);
    console.log(`[WS] Agent ${agentId} left group ${groupId}`);
    socket.to(`group:${groupId}`).emit('agent:left', { agentId, groupId });
  });

  // Ping/pong for heartbeat
  socket.on('ping', (cb) => {
    if (typeof cb === 'function') cb();
  });

  // Disconnect
  socket.on('disconnect', () => {
    const agentId = agentSockets.get(socket.id);
    if (agentId) {
      connectedAgents.delete(agentId);
      agentSockets.delete(socket.id);
      console.log(`[WS] Agent disconnected: ${agentId}`);
      io.emit('agent:offline', { agentId });
    }
    console.log(`[WS] Client disconnected: ${socket.id}`);
  });
});

// API: Get connected agents (for debugging/admin)
app.get('/api/connected-agents', (req, res) => {
  const agents = Array.from(connectedAgents.entries()).map(([id, info]) => ({
    agentId: id,
    ...info
  }));
  res.json({ count: agents.length, agents });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`🚀 Agent Collab Platform Backend running on port ${PORT}`);
  console.log(`📡 WebSocket ready`);
  console.log(`🔗 REST API: http://localhost:${PORT}/api`);
});