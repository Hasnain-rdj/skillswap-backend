const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const multer = require('multer');
const path = require('path');
const { authenticateToken } = require('../middleware/auth');

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.join(__dirname, '../uploads/'));
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + '-' + file.originalname);
    }
});
const upload = multer({ storage });


router.post('/verify', authController.verify);
router.post('/reset-password', authController.resetPassword);
router.post('/register', upload.single('image'), authController.register);
router.post('/login', authController.login);
router.post('/google', authController.googleAuth);
router.post('/send-otp', authController.sendOtp);
router.post('/verify-otp', authController.verifyOtp);
router.get('/freelancers', require('../controllers/authController').getFreelancers);
router.get('/freelancers/:id', require('../controllers/authController').getFreelancerById);
router.post('/freelancers/:id/upload-image', authenticateToken, upload.single('image'), authController.uploadFreelancerImage);
router.put('/freelancers/:id', authenticateToken, authController.updateFreelancerProfile);


module.exports = router;