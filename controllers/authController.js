const { OAuth2Client } = require('google-auth-library');
const User = require('../models/User');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const otpStore = {};

exports.verify = async (req, res) => {
    try {
        const { email, code } = req.body;
        if (!email || !code) {
            return res.status(400).json({ message: 'Email and code are required.' });
        }

        if (code !== '123456') {
            return res.status(400).json({ message: 'Invalid verification code.' });
        }
        const user = await User.findOneAndUpdate(
            { email },
            { isVerified: true },
            { new: true }
        );
        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }
        res.json({ message: 'Verification successful.', user: { id: user._id, isVerified: user.isVerified } });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

exports.resetPassword = async (req, res) => {
    try {
        const { email, newPassword } = req.body;
        if (!email || !newPassword) {
            return res.status(400).json({ message: 'Email and new password are required.' });
        }
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        const user = await User.findOneAndUpdate(
            { email },
            { password: hashedPassword },
            { new: true }
        );
        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }
        res.json({ message: 'Password reset successful.' });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};


exports.register = async (req, res) => {
    try {
        const { name, email, password, role } = req.body;
        if (!name || !email || !password || !role) {
            return res.status(400).json({ message: 'Name, email, password, and role are required.' });
        }
        if (!['client', 'freelancer', 'admin'].includes(role)) {
            return res.status(400).json({ message: 'Invalid role.' });
        }

        const existingUser = await User.findOne({ email, role });
        if (existingUser) {
            return res.status(400).json({ message: `An account already exists for this email as a ${role}.` });
        }
        let imageUrl = '';
        if (req.file) {
            imageUrl = `/uploads/${req.file.filename}`;
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        let userData = { name, email, password: hashedPassword, role, image: imageUrl };
        if (role === 'freelancer') {
            userData.verificationStatus = 'pending';
            userData.verified = false;
        } else {
            userData.verificationStatus = 'approved';
            userData.verified = true;
        }
        const user = new User(userData);
        await user.save();
        res.status(201).json({ message: 'User registered successfully.', user: { id: user._id, name: user.name, email: user.email, role: user.role, image: user.image } });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};


exports.login = async (req, res) => {
    try {
        const { email, password, role } = req.body;
        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required.' });
        }
        const users = await User.find({ email });
        if (!users || users.length === 0) {
            return res.status(400).json({ message: 'Invalid credentials.' });
        }
        if (users.length > 1 && !role) {

            const roles = users.map(u => u.role);
            return res.status(200).json({ roles });
        }

        const user = role ? users.find(u => u.role === role) : users[0];

        console.log('Login attempt:', {
            email,
            role,
            foundUser: user ? {
                email: user.email,
                role: user.role,
                verificationStatus: user.verificationStatus,
                verified: user.verified
            } : null
        });

        if (!user) {
            return res.status(400).json({ message: 'Invalid credentials.' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials.' });
        }
        if (user.role === 'freelancer' && (user.verificationStatus !== 'approved' || !user.verified)) {
            return res.status(403).json({ message: 'Your account is pending admin approval.' });
        }
        const token = jwt.sign({ userId: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1d' });
        res.json({ message: 'Login successful.', token, user: { id: user._id, name: user.name, email: user.email, role: user.role, image: user.image, verificationStatus: user.verificationStatus, verified: user.verified } });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};


exports.googleAuth = async (req, res) => {
    try {
        const { credential, mode, role } = req.body;
        if (!credential) {
            return res.status(400).json({ message: 'Google credential is required.' });
        }

        const ticket = await client.verifyIdToken({
            idToken: credential,
            audience: process.env.GOOGLE_CLIENT_ID,
        });
        const payload = ticket.getPayload();
        const { email, name, picture } = payload;
        if (!email) {
            return res.status(400).json({ message: 'Google account email not found.' });
        }

        if (mode === 'signup') {

            let user = await User.findOne({ email, role });
            if (user) {

                return res.status(400).json({ message: `An account with this email and role (${role}) already exists. Please log in instead.` });
            }

            let userData = {
                name,
                email,
                password: await bcrypt.hash(Math.random().toString(36), 10),
                role: role || 'client',
                isVerified: true,
                image: picture,
            };
            if (role === 'freelancer') {
                userData.verificationStatus = 'pending';
                userData.verified = false;
            } else if (role === 'client') {
                userData.verificationStatus = 'approved';
                userData.verified = true;
            } else {
                userData.verificationStatus = 'approved';
                userData.verified = true;
            }
            user = new User(userData);
            await user.save();

            return res.status(201).json({
                message: role === 'freelancer' ? 'Freelancer account created. Pending admin approval.' : 'Account created successfully.',
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    image: user.image,
                },
            });
        } else if (mode === 'login') {

            const users = await User.find({ email });
            if (!users || users.length === 0) {
                return res.status(404).json({ message: 'No account found. Please sign up first.' });
            }
            if (users.length === 1) {

                const user = users[0];

                if (user.role === 'freelancer' && (user.verificationStatus !== 'approved' || !user.verified)) {
                    return res.status(403).json({ message: 'Your freelancer account is pending admin approval.' });
                }
                const token = jwt.sign({ userId: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1d' });
                return res.json({
                    message: 'Google login successful.',
                    token,
                    user: {
                        id: user._id,
                        name: user.name,
                        email: user.email,
                        role: user.role,
                        image: user.image,
                    },
                });
            } else {

                const roles = users.map(u => u.role);
                return res.status(200).json({
                    message: 'Multiple accounts found for this email. Please select a role to log in as.',
                    roles,
                });
            }
        } else if (mode === 'login-role') {

            if (!role) return res.status(400).json({ message: 'Role is required for login.' });
            const user = await User.findOne({ email, role });

            console.log('Google login attempt:', {
                email,
                role,
                foundUser: user ? {
                    email: user.email,
                    role: user.role,
                    verificationStatus: user.verificationStatus,
                    verified: user.verified
                } : null
            });

            if (!user) return res.status(404).json({ message: 'No account found for this email and role.' });
            if (user.role === 'freelancer' && (user.verificationStatus !== 'approved' || !user.verified)) {
                return res.status(403).json({ message: 'Your freelancer account is pending admin approval.' });
            }
            const token = jwt.sign({ userId: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1d' });
            return res.json({
                message: 'Google login successful.',
                token,
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    image: user.image,
                },
            });
        } else {
            return res.status(400).json({ message: 'Invalid mode.' });
        }
    } catch (err) {
        res.status(500).json({ message: 'Google authentication failed', error: err.message });
    }
};

exports.getFreelancers = async (req, res) => {
    try {
        const { name } = req.query;
        let query = { role: 'freelancer' };
        if (name) {
            query.name = { $regex: name, $options: 'i' };
        }
        const freelancers = await User.find(query, '-password');
        res.json(freelancers);
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

exports.getFreelancerById = async (req, res) => {
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


exports.uploadFreelancerImage = async (req, res) => {
    try {
        const userId = req.params.id;
        if (!req.file) return res.status(400).json({ message: 'No image uploaded.' });
        const imageUrl = `/uploads/${req.file.filename}`;
        const user = await User.findByIdAndUpdate(userId, { image: imageUrl }, { new: true });
        if (!user) return res.status(404).json({ message: 'User not found.' });
        res.json({ image: imageUrl });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};


exports.updateFreelancerProfile = async (req, res) => {
    try {
        const userId = req.params.id;

        if (req.user.userId !== userId) {
            return res.status(403).json({ message: 'Unauthorized' });
        }

        const allowedFields = ['name', 'skills', 'portfolio', 'profileCompleteness', 'verified'];
        const updates = {};
        allowedFields.forEach(field => {
            if (req.body[field] !== undefined) updates[field] = req.body[field];
        });
        const user = await User.findByIdAndUpdate(userId, updates, { new: true });
        if (!user) return res.status(404).json({ message: 'User not found.' });
        res.json({ user });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

exports.sendOtp = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) return res.status(400).json({ message: 'Email is required.' });

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        otpStore[email] = { otp, expires: Date.now() + 10 * 60 * 1000 };

        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });
        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'SkillSwap Email Verification',
            text: `Your SkillSwap verification code is: ${otp}`
        });
        res.json({ message: 'OTP sent.' });
    } catch (err) {
        res.status(500).json({ message: 'Failed to send OTP', error: err.message });
    }
};


exports.verifyOtp = async (req, res) => {
    try {
        const { email, otp } = req.body;
        if (!email || !otp) return res.status(400).json({ message: 'Email and OTP required.' });
        const record = otpStore[email];
        if (!record || record.otp !== otp || Date.now() > record.expires) {
            return res.status(400).json({ message: 'Invalid or expired OTP.' });
        }
        delete otpStore[email];
        res.json({ message: 'OTP verified.' });
    } catch (err) {
        res.status(500).json({ message: 'OTP verification failed', error: err.message });
    }
};