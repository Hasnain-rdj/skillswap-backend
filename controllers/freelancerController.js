
const User = require('../models/User');

exports.getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.params.id, '-password');
        if (!user || user.role !== 'freelancer') {
            return res.status(404).json({ message: 'Freelancer not found.' });
        }
        res.json(user);
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};


exports.updateProfile = async (req, res) => {
    try {
        const updates = req.body;
        const user = await User.findByIdAndUpdate(
            req.params.id,
            updates,
            { new: true, select: '-password' }
        );
        if (!user || user.role !== 'freelancer') {
            return res.status(404).json({ message: 'Freelancer not found.' });
        }
        res.json({ message: 'Profile updated.', user });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

exports.deleteProfile = async (req, res) => {
    try {
        const user = await User.findByIdAndDelete(req.params.id);
        if (!user || user.role !== 'freelancer') {
            return res.status(404).json({ message: 'Freelancer not found.' });
        }
        res.json({ message: 'Profile deleted.' });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};
