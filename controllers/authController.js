const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const ActivityLog = require('../models/activityLog');

const generateToken = (userId) => {
    return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE });
}

const generateRefreshToken = (userId) => {
    return jwt.sign({ userId }, process.env.JWT_REFRESH_SECRET, { expiresIn: process.env.JWT_REFRESH_EXPIRE });
}

const register = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'Email already in use' });
        }

        const user = await User.create({ name, email, password });
        const accessToken = generateToken(user._id);
        const refreshToken = generateRefreshToken(user._id);

        user.refreshToken = refreshToken;
        user.lastLogin = new Date();
        await user.save();

        await ActivityLog.create({
            userId: user._id,
            action: 'create',
            resource: 'user',
            resourceId: user._id,
            ipAddress: req.ip,
            userAgent: req.get('user-agent'),
        })

        res.status(201).json({
            message: 'User registered successfully',
            user: { id: user._id, name: user.name, email: user.email, role: user.role },
            accessToken,
            refreshToken
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
}

const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email }).select('+password'); // lấy cả trường password để so sánh
        if (!user || !(await user.comparePassword(password))) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }
        const accessToken = generateToken(user._id);
        const refreshToken = generateRefreshToken(user._id);

        user.refreshToken = refreshToken;
        user.lastLogin = new Date();
        await user.save();

        await ActivityLog.create({
            userId: user._id,
            action: 'login',
            resource: 'auth',
            ipAddress: req.ip,
            userAgent: req.get('user-agent'),
        })

        res.status(200).json({
            message: 'Login successful',
            user: { id: user._id, name: user.name, email: user.email, role: user.role, avatar: user.avatar },
            accessToken,
            refreshToken
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
}


//Refresh Token dùng để cấp lại Access Token mới khi Access Token hết hạn, mà không cần người dùng đăng nhập lại.

const refreshToken = async (req, res) => {
    try {
        // Nhận refresh token từ client
        const { refreshToken } = req.body;
        if (!refreshToken) {
            return res.status(401).json({ message: 'Refresh token required' });
        }

        // Giải mã để lấy userId
        const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
        //Tìm user trong DB
        const user = await User.findById(decoded.userId).select('+refreshToken');

        if (!user || user.refreshToken !== refreshToken) {
            return res.status(401).json({
                message:
                    'Invalid refresh token'
            })
        }

        const newAccessToken = generateToken(user._id);
        const newRefreshToken = generateRefreshToken(user._id);

        user.refreshToken = newRefreshToken;
        await user.save();

        res.json({
            accessToken: newAccessToken,
            refreshToken: newRefreshToken
        })
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message })
    }
}

const logout = async (req, res) => {
    try {
        await User.findByIdAndUpdate(req.userId, {
            refreshToken: null
        })

        await ActivityLog.create({
            userId: req.userId,
            action: 'logout',
            resource: 'auth',
            ipAddress: req.ip,
            userAgent: req.get('user-agent'),
        })

        res.status(200).json({ message: 'Logout successful' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message })
    }
}

module.exports = { register, login, refreshToken, logout };