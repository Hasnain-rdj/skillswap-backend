const express = require('express');
const router = express.Router();
const Project = require('../models/Project');
const Review = require('../models/Review');
const { authenticateToken } = require('../middleware/auth');
const { Parser } = require('json2csv');
const PDFDocument = require('pdfkit');

router.get('/client', authenticateToken, async (req, res) => {
    try {
        const clientId = req.user.userId;
        const { start, end } = req.query;
        let projectQuery = { clientId };
        if (start || end) {
            projectQuery.createdAt = {};
            if (start) projectQuery.createdAt.$gte = new Date(start);
            if (end) projectQuery.createdAt.$lte = new Date(end);
        }
        const projects = await Project.find(projectQuery);
        const active = projects.filter(p => p.status === 'open' || p.status === 'in progress').length;
        const completed = projects.filter(p => p.status === 'completed').length;
        res.json({ total: projects.length, active, completed });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});


router.get('/freelancer/:freelancerId', async (req, res) => {
    try {
        const { freelancerId } = req.params;
        const reviews = await Review.find({ freelancerId });
        const avgRating = reviews.length ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(2) : 0;
        res.json({ totalReviews: reviews.length, avgRating });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});


router.get('/client/export/csv', authenticateToken, async (req, res) => {
    try {
        const clientId = req.user.userId;
        const projects = await Project.find({ clientId });
        const parser = new Parser();
        const csv = parser.parse(projects.map(p => ({
            title: p.title,
            status: p.status,
            deadline: p.deadline,
            createdAt: p.createdAt
        })));
        res.header('Content-Type', 'text/csv');
        res.attachment('projects.csv');
        res.send(csv);
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});

router.get('/client/export/pdf', authenticateToken, async (req, res) => {
    try {
        const clientId = req.user.userId;
        const projects = await Project.find({ clientId });
        const doc = new PDFDocument();
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename=projects.pdf');
        doc.text('Projects Report', { align: 'center' });
        doc.moveDown();
        projects.forEach(p => {
            doc.text(`Title: ${p.title}`);
            doc.text(`Status: ${p.status}`);
            doc.text(`Deadline: ${p.deadline ? p.deadline.toISOString().substring(0, 10) : 'N/A'}`);
            doc.text(`Created: ${p.createdAt.toISOString().substring(0, 10)}`);
            doc.moveDown();
        });
        doc.pipe(res);
        doc.end();
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});

module.exports = router;
