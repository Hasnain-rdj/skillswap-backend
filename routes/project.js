const express = require('express');
const router = express.Router();
const projectController = require('../controllers/projectController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');


router.post('/', authenticateToken, authorizeRoles('client'), projectController.createProject);
router.get('/', projectController.getProjects);
router.get('/:id', projectController.getProjectById);
router.put('/:id', authenticateToken, authorizeRoles('client'), projectController.updateProject);
router.delete('/:id', authenticateToken, authorizeRoles('client'), projectController.deleteProject);
router.post('/:id/bids', authenticateToken, authorizeRoles('freelancer'), projectController.addBid);
router.put('/:id/bids/:bidId', authenticateToken, authorizeRoles('freelancer', 'client'), projectController.editBid);
router.get('/:id/bids', authenticateToken, projectController.getBids);
router.get('/:id/bids/analytics', authenticateToken, projectController.getBidAnalytics);
router.patch('/:id/progress', authenticateToken, authorizeRoles('freelancer'), projectController.updateProgress);
router.post('/:id/milestones', authenticateToken, authorizeRoles('freelancer'), projectController.addMilestone);
router.patch('/:id/milestones/:milestoneIdx', authenticateToken, authorizeRoles('freelancer'), projectController.updateMilestoneStatus);
router.post('/:id/timelogs', authenticateToken, authorizeRoles('freelancer'), projectController.addTimeLog);
router.post('/:id/offer', authenticateToken, authorizeRoles('client'), projectController.sendOffer);
router.put('/:id/offer', authenticateToken, authorizeRoles('client'), projectController.editOffer);
router.post('/:id/offer/cancel', authenticateToken, projectController.cancelOffer);
router.post('/:id/offer/respond', authenticateToken, authorizeRoles('freelancer'), projectController.respondToOffer);
router.post('/:id/complete', authenticateToken, authorizeRoles('freelancer'), projectController.markAsCompleted);
router.get('/completed/unreviewed', authenticateToken, projectController.getCompletedUnreviewedProjects);

module.exports = router;