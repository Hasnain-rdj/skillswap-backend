const mongoose = require('mongoose');

const notificationTemplateSchema = new mongoose.Schema({
    name: { type: String, required: true },
    type: { type: String, enum: ['email', 'sms'], required: true },
    subject: { type: String }, // Only for email
    body: { type: String, required: true }
}, { timestamps: true });

module.exports = mongoose.model('NotificationTemplate', notificationTemplateSchema);
