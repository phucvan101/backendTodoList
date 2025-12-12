const express = require('express');
const router = express.Router();
const { createTask, getTasks, getTaskById, updatedTask, deleteTask, uploadAttachment } = require('../controllers/taskController');
const { body } = require('express-validator');
const authenticate = require('../middlewares/authMiddleware');
const { upload } = require('../middlewares/upload');

const validateTask = [
    body('title').trim().notEmpty().withMessage('Title is required')
]
router.use(authenticate);

router.post('/create', validateTask, createTask);
router.get('/', getTasks);
router.get('/:id', getTaskById);
router.post('/update/:id', validateTask, updatedTask);
router.post('/delete/:id', deleteTask);
router.post('/upload-attachment/:id', upload.single('file'), uploadAttachment);


module.exports = router;