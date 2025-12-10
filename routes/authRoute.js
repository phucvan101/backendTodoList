const express = require('express');
const router = express.Router();
const { register, login, refreshToken, logout } = require('../controllers/authController')
const authenticate = require('../middlewares/authMiddleware');
const { body } = require('express-validator');


const validateRegister = [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
];

const validateLogin = [
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required')
];

router.post('/register', validateRegister, register);
router.post('/login', validateLogin, login);
router.post('/refresh-token', refreshToken);
router.post('/logout', authenticate, logout);

module.exports = router;
