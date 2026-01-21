const aiService = require('../services/ai.service.js');
const Task = require('../models/taskModel.js');
const Category = require('../models/categoryModel.js');

exports.generateTask = async (req, res) => {
    try {
        const { description } = req.body;

        if (!description || description.trim().length < 3) {
            return res.status(400).json({
                message: 'Mô tả phải có ít nhất 3 ký tự'
            });
        }

        // Get user context
        const categories = await Category.find({ userId: req.userId });
        const currentTaskCount = await Task.countDocuments({
            userId: req.userId,
            isDeleted: false
        });

        const context = {
            categories: categories.map(c => c.name),
            currentTaskCount
        };

        const taskDetails = await aiService.generateTaskDetails(description, context);

        res.json({
            message: 'AI đã tạo task thành công',
            taskDetails,
            aiGenerated: true
        });
    } catch (error) {
        console.error('Generate task error:', error);
        res.status(500).json({
            message: error.message || 'Lỗi khi tạo task từ AI'
        });
    }
};

exports.breakdownTask = async (req, res) => {
    try {
        const { taskId, title, description } = req.body;

        if (!title) {
            return res.status(400).json({ message: 'Tiêu đề task không được trống' });
        }

        const breakdown = await aiService.breakdownTask(title, description);

        res.json({
            message: 'AI đã chia nhỏ task thành công',
            breakdown,
            aiGenerated: true
        });
    } catch (error) {
        console.error('Breakdown task error:', error);
        res.status(500).json({
            message: error.message || 'Lỗi khi chia nhỏ task'
        });
    }
};

exports.enhanceDescription = async (req, res) => {
    try {
        const { title, currentDescription } = req.body;

        if (!title) {
            return res.status(400).json({ message: 'Tiêu đề task không được trống' });
        }

        const enhanced = await aiService.enhanceDescription(title, currentDescription);

        res.json({
            message: 'AI đã cải thiện mô tả thành công',
            enhanced,
            aiGenerated: true
        });
    } catch (error) {
        console.error('Enhance description error:', error);
        res.status(500).json({
            message: error.message || 'Lỗi khi cải thiện mô tả'
        });
    }
};

exports.detectPriority = async (req, res) => {
    try {
        const { title, description, dueDate } = req.body;

        if (!title) {
            return res.status(400).json({ message: 'Tiêu đề task không được trống' });
        }

        const priorityData = await aiService.detectPriority(title, description, dueDate);

        res.json({
            message: 'AI đã phân tích độ ưu tiên',
            priorityData,
            aiGenerated: true
        });
    } catch (error) {
        console.error('Detect priority error:', error);
        res.status(500).json({
            message: error.message || 'Lỗi khi phát hiện priority'
        });
    }
};

exports.batchGenerateTasks = async (req, res) => {
    try {
        const { descriptions } = req.body;

        if (!Array.isArray(descriptions) || descriptions.length === 0) {
            return res.status(400).json({
                message: 'Cần cung cấp mảng descriptions'
            });
        }

        if (descriptions.length > 10) {
            return res.status(400).json({
                message: 'Tối đa 10 tasks mỗi lần'
            });
        }

        const tasks = await aiService.batchGenerateTasks(descriptions);

        res.json({
            message: `AI đã tạo ${tasks.length} tasks`,
            tasks,
            aiGenerated: true
        });
    } catch (error) {
        console.error('Batch generate error:', error);
        res.status(500).json({
            message: error.message || 'Lỗi khi tạo nhiều tasks'
        });
    }
};

// Create task with AI and save to DB
exports.createTaskWithAI = async (req, res) => {
    try {
        const { description, autoSave = false } = req.body;

        // Generate task details
        const categories = await Category.find({ userId: req.userId });
        const currentTaskCount = await Task.countDocuments({
            userId: req.userId,
            isDeleted: false
        });

        const context = {
            categories: categories.map(c => c.name),
            currentTaskCount
        };

        const taskDetails = await aiService.generateTaskDetails(description, context);

        // Auto save if requested
        if (autoSave) {
            const task = await Task.create({
                ...taskDetails,
                userId: req.userId,
                aiGenerated: true,
                originalPrompt: description
            });

            return res.status(201).json({
                message: 'AI đã tạo và lưu task thành công',
                task,
                aiGenerated: true
            });
        }

        res.json({
            message: 'AI đã tạo task. Bạn có thể xem trước và chỉnh sửa trước khi lưu.',
            taskDetails,
            aiGenerated: true
        });
    } catch (error) {
        console.error('Create task with AI error:', error);
        res.status(500).json({
            message: error.message || 'Lỗi khi tạo task với AI'
        });
    }
};