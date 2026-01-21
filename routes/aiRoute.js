const express = require('express');
const { generateTask, breakdownTask, enhanceDescription, detectPriority, batchGenerateTasks, createTaskWithAI } = require('../controllers/aiController.js')
const { body } = require('express-validator');
const authenticate = require('../middlewares/authMiddleware');

const router = express.Router();

// All AI routes require authentication
router.use(authenticate);

// Generate task details from short description
router.post('/generate-task',
    body('description').trim().isLength({ min: 3 }),
    generateTask
);

// Breakdown large task into subtasks
router.post('/breakdown-task',
    body('title').trim().notEmpty(),
    breakdownTask
);

// Enhance task description
router.post('/enhance-description',
    body('title').trim().notEmpty(),
    enhanceDescription
);

// Detect task priority
router.post('/detect-priority',
    body('title').trim().notEmpty(),
    detectPriority
);

// Batch generate multiple tasks
router.post('/batch-generate',
    body('descriptions').isArray({ min: 1, max: 10 }),
    batchGenerateTasks
);

// Create and save task with AI
router.post('/create-task',
    body('description').trim().isLength({ min: 3 }),
    createTaskWithAI
);


module.exports = router;