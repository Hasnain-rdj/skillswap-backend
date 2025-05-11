const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
    projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: false },
    clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    freelancerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    rating: { type: Number, min: 1, max: 5, required: true },
    comment: { type: String },
    response: { type: String },
    createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Review', reviewSchema);
