const express = require('express');

const router = express.Router();
const { createCategory, getCategories, updateCategory, deletedCategory } = require('../controllers/categoryController');
const authenticate = require('../middlewares/authMiddleware');
const { apiLimiter } = require('../middlewares/rateLimiter');

router.use(authenticate);
router.post('/create', apiLimiter, createCategory);
router.get('/', getCategories);
router.post('/update/:id', apiLimiter, updateCategory);
router.post('/delete/:id', apiLimiter, deletedCategory);

module.exports = router;