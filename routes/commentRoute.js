const express = require('express');
const router = express.Router();

const { createComment, getComments, updateComment, deletedComment } = require('../controllers/commentController.js');
const authenticate = require('../middlewares/authMiddleware');

const { logActivity } = require('../middlewares/activityLogger');

router.use(authenticate);
router.post('/create/:taskId', logActivity('create', 'comment'), createComment);
router.get('/:taskId', getComments);
router.post('/update/:id', logActivity('update', 'comment'), updateComment);
router.delete('/delete/:id', logActivity('delete', 'comment'), deletedComment);

module.exports = router
