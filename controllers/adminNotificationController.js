const NotificationTemplate = require('../models/NotificationTemplate');
const User = require('../models/User');
const nodemailer = require('nodemailer');

const scheduledNotifications = [];
const userPreferences = {};

// Email transporter setup using .env credentials
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

exports.getTemplates = async (req, res) => {
    const templates = await NotificationTemplate.find();
    res.json(templates);
};

exports.createTemplate = async (req, res) => {
    const { name, type, subject, body } = req.body;
    const template = new NotificationTemplate({ name, type, subject, body });
    await template.save();
    res.status(201).json(template);
};

exports.updateTemplate = async (req, res) => {
    const { id } = req.params;
    const { name, type, subject, body } = req.body;
    const template = await NotificationTemplate.findByIdAndUpdate(id, { name, type, subject, body }, { new: true });
    res.json(template);
};

exports.deleteTemplate = async (req, res) => {
    const { id } = req.params;
    await NotificationTemplate.findByIdAndDelete(id);
    res.json({ message: 'Template deleted' });
};

exports.sendNotification = async (req, res) => {
    const { userId, templateId, channel } = req.body;
    const user = await User.findById(userId);
    const template = await NotificationTemplate.findById(templateId);
    if (!user || !template) return res.status(404).json({ message: 'User or template not found' });

    try {
        if (channel === 'email') {
            if (!user.email) return res.status(400).json({ message: 'User does not have an email address.' });
            await transporter.sendMail({
                from: process.env.EMAIL_USER,
                to: user.email,
                subject: template.subject || 'Notification',
                text: template.body
            });
            return res.json({ message: `Email sent to ${user.email} using template '${template.name}'` });
        }
        // You can add real SMS sending here if needed (e.g., using Twilio)
        return res.json({ message: `Mock ${channel} sent to ${user.email || user.phone} using template '${template.name}'` });
    } catch (err) {
        console.error('Notification send error:', err);
        return res.status(500).json({ message: 'Failed to send notification.' });
    }
};

exports.getScheduled = async (req, res) => {
    res.json(scheduledNotifications);
};
exports.scheduleNotification = async (req, res) => {
    const { userId, templateId, channel, sendAt } = req.body;
    scheduledNotifications.push({ userId, templateId, channel, sendAt, id: Date.now() });
    res.status(201).json({ message: 'Notification scheduled' });
};

exports.getPreferences = async (req, res) => {
    const { userId } = req.params;
    res.json(userPreferences[userId] || { email: true, sms: false });
};
exports.updatePreferences = async (req, res) => {
    const { userId } = req.params;
    userPreferences[userId] = req.body;
    res.json({ message: 'Preferences updated', preferences: userPreferences[userId] });
};
