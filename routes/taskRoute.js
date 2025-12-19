const express = require('express');
const router = express.Router();
const { createTask, getTasks, getTaskById, updatedTask, deleteTask, uploadAttachment, shareTask, downloadAttachment } = require('../controllers/taskController');
const { body } = require('express-validator');
const authenticate = require('../middlewares/authMiddleware');
const { upload } = require('../middlewares/upload');
const { logActivity } = require('../middlewares/activityLogger');

const validateTask = [
    body('title').trim().notEmpty().withMessage('Title is required')
]
router.use(authenticate);

router.post('/create', upload.array('attachments', 10), validateTask, createTask); // multer LUÔN LUÔN đứng trước
router.get('/', getTasks);
router.get('/:id', getTaskById);
router.post('/update/:id', upload.array('attachments', 10), validateTask, updatedTask);
router.post('/delete/:id', deleteTask);
// router.post('/upload-attachment/:id', upload.single('file'), uploadAttachment);
router.post('/:id/share', logActivity('share', 'task'), shareTask)
router.post('/:id/attachments/:fileId/download', downloadAttachment)


module.exports = router;