const Project = require('../models/Project');

exports.createProject = async (req, res) => {
    try {
        const { title, description, requirements, deadline } = req.body;
        const clientId = req.body.clientId || req.user?.userId;
        if (!title || !description || !clientId) {
            return res.status(400).json({ message: 'Title, description, and clientId are required.' });
        }
        const project = new Project({
            title,
            description,
            requirements,
            deadline,
            clientId,
        });
        await project.save();
        res.status(201).json({ message: 'Project created successfully.', project });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};


exports.getProjects = async (req, res) => {
    try {
        const projects = await Project.find().populate('clientId', 'name email');
        res.json(projects);
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};


exports.getProjectById = async (req, res) => {
    try {
        const project = await Project.findById(req.params.id).populate('clientId', 'name email');
        if (!project) return res.status(404).json({ message: 'Project not found.' });
        res.json(project);
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};


exports.updateProject = async (req, res) => {
    try {
        const project = await Project.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!project) return res.status(404).json({ message: 'Project not found.' });
        res.json({ message: 'Project updated.', project });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

exports.deleteProject = async (req, res) => {
    try {
        const project = await Project.findByIdAndDelete(req.params.id);
        if (!project) return res.status(404).json({ message: 'Project not found.' });
        res.json({ message: 'Project deleted.' });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};


exports.addBid = async (req, res) => {
    try {
        const { id } = req.params;
        const { freelancerId, message, amount } = req.body;
        if (!freelancerId || !amount) {
            return res.status(400).json({ message: 'Freelancer ID and amount are required.' });
        }
        const project = await Project.findById(id);
        if (!project) return res.status(404).json({ message: 'Project not found.' });
        project.bids.push({ freelancerId, message, amount });
        await project.save();

        const io = req.app.get('io');
        if (io) io.to(id).emit('bidUpdate', { projectId: id, bids: project.bids });
        res.status(201).json({ message: 'Bid added.', bids: project.bids });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};


exports.editBid = async (req, res) => {
    try {
        const { id, bidId } = req.params;
        const { message, amount, status } = req.body;
        const project = await Project.findById(id);
        if (!project) return res.status(404).json({ message: 'Project not found.' });
        const bid = project.bids.id(bidId);
        if (!bid) return res.status(404).json({ message: 'Bid not found.' });
        if (message !== undefined) bid.message = message;
        if (amount !== undefined) bid.amount = amount;
        if (status !== undefined) bid.status = status;
        await project.save();

        const io = req.app.get('io');
        if (io) io.to(id).emit('bidUpdate', { projectId: id, bids: project.bids });
        res.json({ message: 'Bid updated.', bid });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};


exports.getBids = async (req, res) => {
    try {
        const { id } = req.params;
        const project = await Project.findById(id).populate('bids.freelancerId', 'name email');
        if (!project) return res.status(404).json({ message: 'Project not found.' });
        res.json(project.bids);
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};


exports.getBidAnalytics = async (req, res) => {
    try {
        const { id } = req.params;
        const project = await Project.findById(id);
        if (!project) return res.status(404).json({ message: 'Project not found.' });
        const bids = project.bids || [];
        const avgBid = bids.length ? (bids.reduce((sum, b) => sum + (b.amount || 0), 0) / bids.length) : 0;
        res.json({ count: bids.length, avgBid });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};


exports.updateProgress = async (req, res) => {
    try {
        const { id } = req.params;
        const { progress } = req.body;
        const project = await Project.findById(id);
        if (!project) return res.status(404).json({ message: 'Project not found.' });
        project.progress = progress;
        await project.save();
        res.json({ message: 'Progress updated.', progress });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

exports.addMilestone = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, dueDate } = req.body;
        const project = await Project.findById(id);
        if (!project) return res.status(404).json({ message: 'Project not found.' });
        project.milestones.push({ title, dueDate });
        await project.save();
        res.status(201).json({ message: 'Milestone added.', milestones: project.milestones });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};


exports.updateMilestoneStatus = async (req, res) => {
    try {
        const { id, milestoneIdx } = req.params;
        const { status } = req.body;
        const project = await Project.findById(id);
        if (!project) return res.status(404).json({ message: 'Project not found.' });
        if (!project.milestones[milestoneIdx]) return res.status(404).json({ message: 'Milestone not found.' });
        project.milestones[milestoneIdx].status = status;
        if (status === 'completed') project.milestones[milestoneIdx].completedAt = new Date();
        await project.save();
        res.json({ message: 'Milestone status updated.', milestone: project.milestones[milestoneIdx] });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

exports.addTimeLog = async (req, res) => {
    try {
        const { id } = req.params;
        const { start, end, duration } = req.body;
        const project = await Project.findById(id);
        if (!project) return res.status(404).json({ message: 'Project not found.' });
        project.timeLogs.push({ start, end, duration });
        await project.save();
        res.status(201).json({ message: 'Time log added.', timeLogs: project.timeLogs });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};


exports.sendOffer = async (req, res) => {
    try {
        const { id } = req.params;
        const { freelancerId, price, deadline } = req.body;
        const clientId = req.user?.userId;
        if (!freelancerId || !price || !deadline) {
            return res.status(400).json({ message: 'Freelancer, price, and deadline are required.' });
        }
        const project = await Project.findById(id);
        if (!project) return res.status(404).json({ message: 'Project not found.' });
        if (project.status !== 'open') return res.status(400).json({ message: 'Project is not open for offers.' });

        if (String(project.clientId) !== String(clientId)) {
            return res.status(403).json({ message: 'Not authorized.' });
        }

        if (project.contract && project.contract.status === 'pending' && String(project.contract.freelancerId) === String(freelancerId)) {
            return res.status(400).json({ message: 'Offer already sent to this freelancer.' });
        }

        project.contract = {
            projectId: project._id,
            clientId,
            freelancerId,
            price,
            deadline,
            status: 'pending',
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        await project.save();
        res.status(201).json({ message: 'Offer sent.', contract: project.contract });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

exports.editOffer = async (req, res) => {
    try {
        const { id } = req.params;
        const { price, deadline } = req.body;
        const clientId = req.user?.userId;
        const project = await Project.findById(id);
        if (!project) return res.status(404).json({ message: 'Project not found.' });
        if (!project.contract || project.contract.status !== 'pending') {
            return res.status(400).json({ message: 'No pending offer to edit.' });
        }
        if (String(project.clientId) !== String(clientId)) {
            return res.status(403).json({ message: 'Not authorized.' });
        }
        if (price !== undefined) project.contract.price = price;
        if (deadline !== undefined) project.contract.deadline = deadline;
        project.contract.updatedAt = new Date();
        await project.save();
        res.json({ message: 'Offer updated.', contract: project.contract });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};


exports.cancelOffer = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user?.userId;
        const project = await Project.findById(id);
        if (!project) return res.status(404).json({ message: 'Project not found.' });
        if (!project.contract || project.contract.status !== 'pending') {
            return res.status(400).json({ message: 'No pending offer to cancel.' });
        }

        if (String(project.clientId) !== String(userId) && String(project.contract.freelancerId) !== String(userId)) {
            return res.status(403).json({ message: 'Not authorized.' });
        }
        project.contract.status = 'cancelled';
        project.contract.updatedAt = new Date();
        await project.save();
        res.json({ message: 'Offer cancelled.', contract: project.contract });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};


exports.respondToOffer = async (req, res) => {
    try {
        const { id } = req.params;
        const { action } = req.body;
        const userId = req.user?.userId;
        const project = await Project.findById(id);
        if (!project) return res.status(404).json({ message: 'Project not found.' });
        if (!project.contract || project.contract.status !== 'pending') {
            return res.status(400).json({ message: 'No pending offer to respond to.' });
        }
        if (String(project.contract.freelancerId) !== String(userId)) {
            return res.status(403).json({ message: 'Not authorized.' });
        }
        if (action === 'accept') {
            project.contract.status = 'accepted';
            project.contract.updatedAt = new Date();
            project.status = 'in progress';
            project.assignedFreelancer = userId;

            project.bids.forEach(bid => {
                if (String(bid.freelancerId) !== String(userId)) {
                    bid.status = 'rejected';
                } else {
                    bid.status = 'accepted';
                }
            });
        } else if (action === 'reject') {
            project.contract.status = 'rejected';
            project.contract.updatedAt = new Date();
        } else {
            return res.status(400).json({ message: 'Invalid action.' });
        }
        await project.save();
        res.json({ message: `Offer ${action}ed.`, contract: project.contract });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};


exports.markAsCompleted = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user?.userId;
        const project = await Project.findById(id);
        if (!project) return res.status(404).json({ message: 'Project not found.' });
        if (String(project.assignedFreelancer) !== String(userId)) {
            return res.status(403).json({ message: 'Only assigned freelancer can mark as completed.' });
        }
        project.status = 'completed';
        await project.save();
        res.json({ message: 'Project marked as completed.' });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};


exports.getCompletedUnreviewedProjects = async (req, res) => {
    try {
        const clientId = req.user.userId;

        const projects = await Project.find({ clientId, status: 'completed', assignedFreelancer: { $ne: null } })
            .populate('assignedFreelancer', 'name email');

        const Review = require('../models/Review');
        const reviews = await Review.find({ clientId });

        const unreviewed = projects.filter(p =>
            !reviews.some(r => r.projectId && r.projectId.toString() === p._id.toString() && r.freelancerId.toString() === p.assignedFreelancer._id.toString())
        );
        res.json(unreviewed);
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};