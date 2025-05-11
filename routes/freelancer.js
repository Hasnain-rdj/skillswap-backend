const express = require('express');
const router = express.Router();
const freelancerController = require('../controllers/freelancerController');

router.get('/:id', freelancerController.getProfile);
router.put('/:id', freelancerController.updateProfile);
router.delete('/:id', freelancerController.deleteProfile);

module.exports = router;
