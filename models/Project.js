const mongoose = require('mongoose');

const bidSchema = new mongoose.Schema({
    freelancerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    message: String,
    amount: Number,
    status: { type: String, enum: ['pending', 'accepted', 'rejected'], default: 'pending' },
    createdAt: { type: Date, default: Date.now },
});

const milestoneSchema = new mongoose.Schema({
    title: { type: String, required: true },
    status: { type: String, enum: ['pending', 'completed'], default: 'pending' },
    dueDate: { type: Date },
    completedAt: { type: Date }
}, { _id: false });

const timeLogSchema = new mongoose.Schema({
    start: { type: Date, required: true },
    end: { type: Date },
    duration: { type: Number }
}, { _id: false });

const offerSchema = new mongoose.Schema({
    projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
    clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    freelancerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    price: { type: Number, required: true },
    deadline: { type: Date, required: true },
    status: { type: String, enum: ['pending', 'accepted', 'rejected'], default: 'pending' },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
});

const projectSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    requirements: { type: String },
    deadline: { type: Date },
    clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    status: { type: String, enum: ['open', 'in progress', 'completed', 'cancelled'], default: 'open' },
    bids: [bidSchema],
    progress: { type: Number, default: 0 },
    milestones: [milestoneSchema],
    timeLogs: [timeLogSchema],
    assignedFreelancer: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    contract: offerSchema,
    createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Project', projectSchema);