const { response } = require('express');
const mongoose = require('mongoose');
const Task = require('../models/taskModel');
const { get } = require('mongoose');

const createTask = async (req, res) => {
    try {
        const { title, description, dueDate, status, priority, category, tags } = req.body;
        const userId = req.userId;

        const newTask = await Task.create({
            title, description,
            dueDate,
            status: status || 'pending',
            priority: priority || 'medium',
            category,
            tags,
            userId
        });

        await newTask.populate('category'); // ra toàn bộ thông tin category (ví dụ name, color, icon…)

        res.status(201).json({ message: 'Task created successfully', task: newTask });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
}

const getTasks = async (req, res) => {
    try {
        const { status, search, sortBy, page = 1, limit = 10 } = req.query;
        const query = { userId: req.userId, isDeleted: false };

        if (status && status !== 'all') {
            query.status = status;
        }

        if (search) {
            query.$or = [
                { title: { $regex: search, $options: 'i' } }, //Dùng regex không phân biệt hoa/ thường ($options: 'i').
                { description: { $regex: search, $options: 'i' } } //có thể gây chậm nếu không index đầy đủ hoặc nếu regex phức tạp.
            ];
        }

        let sort = {};
        if (sortBy === 'dueDate') {
            sort.dueDate = 1; //(1 = ascending).
        } else {
            sort.createdAt = -1;
        }

        // Parse & validate page/limit
        const pageNum = Math.max(1, parseInt(page, 10) || 1);
        const limitNum = Math.min(Math.max(1, parseInt(limit, 10) || 10), 100); // max 100
        const skip = (pageNum - 1) * limitNum;

        // Promise.all để chạy đồng thời và tiết kiệm thời gian.
        const [tasks, total] = await Promise.all([
            Task.find(query).sort(sort).skip(skip).limit(limitNum).lean(), // thêm learn để tránh overhead của mongoose documents.
            Task.countDocuments(query) //đếm tổng số tài liệu thỏa query để dùng cho pagination.
        ]);

        res.status(200).json({
            tasks,
            pagination: {
                total,
                page: pageNum,
                pages: Math.ceil(total / limitNum)
            }
        })

    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message })
    }
}

const getTaskById = async (req, res) => {
    try {
        const taskId = req.params.id;
        const userId = req.userId;

        // Check ID hợp lệ
        if (!mongoose.Types.ObjectId.isValid(taskId)) {
            return res.status(400).json({ message: 'Invalid task ID' }); // Mongoose bắt buộc _id phải là ObjectId hợp lệ (24 ký tự hex).
        }


        const task = await Task.findOne({ _id: taskId, userId, isDeleted: false });
        if (!task) {
            return res.status(404).json({ message: 'Task not found' });
        }

        res.status(200).json({ task });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
}

const updatedTask = async (req, res) => {
    try {
        const { title, description, dueDate, status, priority, category, tags } = req.body;
        const taskId = req.params.id;
        const userId = req.userId;

        // Check ID hợp lệ
        if (!mongoose.Types.ObjectId.isValid(taskId)) {
            return res.status(400).json({ message: 'Invalid task ID' });
        }

        const task = await Task.findOneAndUpdate(
            { _id: taskId, userId },
            { title, description, dueDate, status, priority, category, tags },
            { new: true, runValidators: true } //runValidators để đảm bảo các ràng buộc trong schema được áp dụng khi cập nhật.
        )

        if (!task) {
            res.status(404).json({ message: 'Task not found' });
        }

        res.status(200).json({ message: 'Task updated successfully', task });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
}

const deleteTask = async (req, res) => {
    try {
        const taskId = req.params.id;
        const userId = req.userId;

        // Check ID hợp lệ
        if (!mongoose.Types.ObjectId.isValid(taskId)) {
            return res.status(400).json({ message: 'Invalid task ID' });
        }

        const task = await Task.findOneAndUpdate(
            { _id: taskId, userId },
            { isDeleted: true, deletedAt: new Date() }
        )

        if (!task) {
            return res.status(404).json({ message: 'Task not found' });
        }

        res.status(200).json({ message: 'Task deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
}

module.exports = { createTask, getTasks, getTaskById, updatedTask, deleteTask };

