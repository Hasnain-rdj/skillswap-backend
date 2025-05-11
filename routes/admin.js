const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Project = require('../models/Project');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

router.get('/stats', authenticateToken, authorizeRoles('admin'), async (req, res) => {
    try {

        const totalUsers = await User.countDocuments();
        const totalClients = await User.countDocuments({ role: 'client' });
        const totalFreelancers = await User.countDocuments({ role: 'freelancer' });
        const totalAdmins = await User.countDocuments({ role: 'admin' });

        const userGrowth = await User.aggregate([
            {
                $group: {
                    _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
                    count: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        const projects = await Project.find({ status: 'completed' });
        let totalRevenue = 0;
        projects.forEach(p => {
            if (Array.isArray(p.bids)) {
                p.bids.forEach(bid => {
                    if (bid.status === 'accepted' && bid.amount) {
                        totalRevenue += bid.amount;
                    }
                });
            }
        });

        const skillsAgg = await User.aggregate([
            { $unwind: '$skills' },
            { $group: { _id: '$skills', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 10 }
        ]);

        const projectTrends = await Project.aggregate([
            {
                $group: {
                    _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
                    count: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]);
        res.json({
            totalUsers,
            totalClients,
            totalFreelancers,
            totalAdmins,
            userGrowth,
            totalRevenue,
            popularSkills: skillsAgg,
            projectTrends
        });
    } catch (err) {
        res.status(500).json({ message: 'Error fetching analytics', error: err.message });
    }
});


router.get('/freelancers/pending', authenticateToken, authorizeRoles('admin'), async (req, res) => {
    try {
        const pendingFreelancers = await User.find({ role: 'freelancer', verificationStatus: 'pending' }, '-password');
        res.json(pendingFreelancers);
    } catch (err) {
        res.status(500).json({ message: 'Error fetching pending freelancers', error: err.message });
    }
});


router.post('/freelancers/:id/verify', authenticateToken, authorizeRoles('admin'), async (req, res) => {
    try {
        const { action } = req.body;
        let update = {};
        if (action === 'approve') {
            update = { verificationStatus: 'approved', verified: true };
        } else if (action === 'reject') {
            update = { verificationStatus: 'rejected', verified: false };
        } else if (action === 'premium') {
            update = { verificationStatus: 'approved', verified: true, isPremium: true };
        } else {
            return res.status(400).json({ message: 'Invalid action.' });
        }
        const user = await User.findByIdAndUpdate(req.params.id, update, { new: true, select: '-password' });
        if (!user) return res.status(404).json({ message: 'Freelancer not found.' });
        res.json({ message: 'Freelancer status updated.', user });
    } catch (err) {
        res.status(500).json({ message: 'Error updating freelancer status', error: err.message });
    }
});

module.exports = router;
