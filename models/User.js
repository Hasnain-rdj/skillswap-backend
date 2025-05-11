const mongoose = require('mongoose');

const portfolioItemSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String },
    link: { type: String },
    image: { type: String }
}, { _id: false });

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true },
    password: { type: String, required: true },
    phone: { type: String },
    role: { type: String, enum: ['client', 'freelancer', 'admin'], required: true },
    isVerified: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
    image: { type: String },
    skills: [{ type: String }],
    portfolio: [portfolioItemSchema],
    profileCompleteness: { type: Number, default: 0 },
    verified: { type: Boolean, default: false },
    verificationStatus: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    isPremium: { type: Boolean, default: false },
});

userSchema.index({ email: 1, role: 1 }, { unique: true });

module.exports = mongoose.model('User', userSchema);