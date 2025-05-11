const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const { authenticateToken } = require('../middleware/auth');

router.post('/', authenticateToken, async (req, res) => {
    try {
        const { receiver, content } = req.body;
        if (!receiver || !content) return res.status(400).json({ message: 'Receiver and content required.' });
        const message = new Message({ sender: req.user.userId, receiver, content });
        await message.save();

        const io = req.app.get('io');
        if (io) io.to(receiver).emit('newMessage', message);
        res.status(201).json(message);
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});

router.get('/threads', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;
        const messages = await Message.find({
            $or: [
                { sender: userId },
                { receiver: userId }
            ]
        }).populate('sender', 'name image role').populate('receiver', 'name image role');
        const usersMap = {};
        messages.forEach(msg => {

            if (!msg.sender || !msg.receiver || !msg.sender._id || !msg.receiver._id) return;
            const other = msg.sender._id.toString() === userId ? msg.receiver : msg.sender;
            if (other && other.role === 'client') usersMap[other._id] = other;
        });
        const threads = Object.values(usersMap);
        res.json(threads);
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});

router.get('/:userId', authenticateToken, async (req, res) => {
    try {
        const { userId } = req.params;
        const messages = await Message.find({
            $or: [
                { sender: req.user.userId, receiver: userId },
                { sender: userId, receiver: req.user.userId }
            ]
        }).sort('createdAt');
        res.json(messages);
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});


router.put('/read/:userId', authenticateToken, async (req, res) => {
    try {
        const { userId } = req.params;
        await Message.updateMany({ sender: userId, receiver: req.user.userId, read: false }, { read: true });
        res.json({ message: 'Messages marked as read.' });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});

module.exports = router;
