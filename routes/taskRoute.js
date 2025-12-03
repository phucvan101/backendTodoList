const express = require('express');
const router = express.Router();
const { createTask } = require('../controllers/taskController');
const { body } = require('express-validator');
const authenticate = require('../middlewares/authMiddleware');

const validateTask = [
    body('title').trim().notEmpty().withMessage('Title is required')
]
router.use(authenticate);

router.post('/create', validateTask, createTask);

module.exports = router;