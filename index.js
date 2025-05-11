require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const fs = require('fs');
const path = require('path');
const app = express();
const connectDB = require('./utils/db');

connectDB();

app.use(cors());
app.use(express.json());
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir);
}
app.use('/uploads', express.static(uploadsDir));

app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'SkillSwap server is running!' });
});

const authRoutes = require('./routes/auth');
app.use('/api/auth', authRoutes);

const projectRoutes = require('./routes/project');
app.use('/api/projects', projectRoutes);

const messageRoutes = require('./routes/message');
app.use('/api/messages', messageRoutes);

const reviewRoutes = require('./routes/review');
app.use('/api/reviews', reviewRoutes);

const analyticsRoutes = require('./routes/analytics');
app.use('/api/analytics', analyticsRoutes);

const freelancerRoutes = require('./routes/freelancer');
app.use('/api/freelancers', freelancerRoutes);

const adminRoutes = require('./routes/admin');
app.use('/api/admin', adminRoutes);

const adminNotificationRoutes = require('./routes/adminNotification');
app.use('/api/admin/notifications', adminNotificationRoutes);

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST']
    }
});

io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);
    socket.on('joinProjectRoom', (projectId) => {
        socket.join(projectId);
    });
    socket.on('leaveProjectRoom', (projectId) => {
        socket.leave(projectId);
    });
});

app.set('io', io);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});