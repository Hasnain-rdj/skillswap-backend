const mongoose = require('mongoose');
const crypto = require('crypto');

const messageSchema = new mongoose.Schema({
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    receiver: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    content: { type: String, required: true },
    metadataHash: { type: String },
    read: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
});

messageSchema.pre('save', function (next) {
    const meta = `${this.sender}-${this.receiver}-${this.createdAt}`;
    this.metadataHash = crypto.createHash('sha256').update(meta).digest('hex');
    next();
});

module.exports = mongoose.model('Message', messageSchema);
