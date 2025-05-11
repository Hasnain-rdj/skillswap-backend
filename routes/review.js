const express = require('express');
const router = express.Router();
const Review = require('../models/Review');
const { authenticateToken } = require('../middleware/auth');

router.post('/', authenticateToken, async (req, res) => {
    try {
        const { projectId, freelancerId, rating, comment } = req.body;
        if (!freelancerId || !rating) return res.status(400).json({ message: 'Missing required fields.' });
        const review = new Review({
            projectId: projectId || null,
            clientId: req.user.userId,
            freelancerId,
            rating,
            comment
        });
        await review.save();
        res.status(201).json(review);
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});

router.get('/freelancer/:freelancerId', async (req, res) => {
    try {
        const { freelancerId } = req.params;
        const { rating, date } = req.query;
        let query = { freelancerId };
        if (rating) query.rating = Number(rating);
        let reviews = await Review.find(query).sort('-createdAt');
        if (date) {

            reviews = reviews.filter(r => r.createdAt.toISOString().startsWith(date));
        }
        res.json(reviews);
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});

router.get('/', authenticateToken, async (req, res) => {
    try {
        const { clientId, projectId, freelancerId } = req.query;
        let query = {};
        if (clientId) query.clientId = clientId;
        if (projectId) query.projectId = projectId;
        if (freelancerId) query.freelancerId = freelancerId;
        const reviews = await Review.find(query).sort('-createdAt');
        res.json(reviews);
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});

router.put('/:reviewId/response', authenticateToken, async (req, res) => {
    try {
        const { reviewId } = req.params;
        const { response } = req.body;
        const review = await Review.findByIdAndUpdate(reviewId, { response }, { new: true });
        res.json(review);
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});

router.get('/freelancer/:freelancerId/average', async (req, res) => {
    try {
        const { freelancerId } = req.params;
        const reviews = await Review.find({ freelancerId });
        const avg = reviews.length ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(2) : null;
        res.json({ average: avg });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});

module.exports = router;
