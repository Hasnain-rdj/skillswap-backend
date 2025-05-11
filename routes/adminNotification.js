const express = require('express');
const router = express.Router();
const adminNotificationController = require('../controllers/adminNotificationController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

router.get('/templates', authenticateToken, authorizeRoles('admin'), adminNotificationController.getTemplates);
router.post('/templates', authenticateToken, authorizeRoles('admin'), adminNotificationController.createTemplate);
router.put('/templates/:id', authenticateToken, authorizeRoles('admin'), adminNotificationController.updateTemplate);
router.delete('/templates/:id', authenticateToken, authorizeRoles('admin'), adminNotificationController.deleteTemplate);

router.post('/send', authenticateToken, authorizeRoles('admin'), adminNotificationController.sendNotification);

router.get('/scheduled', authenticateToken, authorizeRoles('admin'), adminNotificationController.getScheduled);
router.post('/scheduled', authenticateToken, authorizeRoles('admin'), adminNotificationController.scheduleNotification);

router.get('/preferences/:userId', authenticateToken, authorizeRoles('admin'), adminNotificationController.getPreferences);
router.put('/preferences/:userId', authenticateToken, authorizeRoles('admin'), adminNotificationController.updatePreferences);

module.exports = router;
