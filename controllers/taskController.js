const { response } = require('express');
const mongoose = require('mongoose');
const Task = require('../models/taskModel');
const { get } = require('mongoose');
const User = require('../models/userModel')
const { canView, canEdit } = require('../utils/taskPermission');
const { upload } = require('../middlewares/upload');
const path = require('path')
const fs = require('fs');


const createTask = async (req, res) => {
    try {
        const { title, description, dueDate, status, priority, tags } = req.body;
        let category = req.body.category;
        const userId = req.userId;

        const attachments = [];

        if (req.files?.length) {
            req.files.forEach(file => {
                const filename = Buffer
                    .from(file.originalname, 'latin1')
                    .toString('utf8');

                attachments.push({
                    filename,
                    url: `upload/${file.filename}`,
                    uploadedAt: new Date()
                });
            });
        }

        // Normalize category
        if (!category || category === "" || category === "undefined" || category === "null") {
            category = null;
        }

        const newTask = await Task.create({
            title,
            description,
            dueDate,
            status: status || 'pending',
            priority: priority || 'medium',
            category,
            tags,
            attachments,
            userId
        });

        await newTask.populate('category');

        res.status(201).json({
            message: 'Task created successfully',
            task: newTask
        });

    } catch (error) {
        res.status(500).json({
            message: 'Server error',
            error: error.message
        });
    }
};


const getTasks = async (req, res) => {
    try {
        const { status, search, sortBy, page = 1, limit = 10, category, priority } = req.query;
        const query = {
            isDeleted: false,
            $or: [
                { userId: req.userId },
                { 'sharedWith.user': req.userId },
            ],
        };

        if (status && status !== 'all') {
            query.status = status;
        }

        if (category) {
            query.category = category;
        }

        if (priority && priority !== 'all') {
            query.priority = priority;
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
            Task.find(query).populate('sharedWith.user', 'name email').sort(sort).skip(skip).limit(limitNum).lean(), // thêm learn để tránh overhead của mongoose documents.
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


        const task = await Task.findOne({ _id: taskId, isDeleted: false });
        if (!task) {
            return res.status(404).json({ message: 'Task not found' });
        }

        if (!canView(task, userId)) {
            return res.status(403).json({ message: 'Permission denied' })
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

        if (!mongoose.Types.ObjectId.isValid(taskId)) {
            return res.status(400).json({ message: 'Invalid task ID' });
        }

        const task = await Task.findOne({ _id: taskId, isDeleted: false });
        if (!task) {
            return res.status(404).json({ message: 'Task not found' });
        }

        if (!canEdit(task, userId)) {
            return res.status(403).json({ message: 'Permission denied' });
        }

        /**
         * 1️⃣ UPDATE FIELD THƯỜNG
         */
        Object.assign(task, {
            title,
            description,
            dueDate,
            status,
            priority,
            category,
            tags
        });

        /**
         * 2️⃣ XÓA FILE THEO ID
         */
        let removeIds = req.body.removeAttachments || [];

        // normalize về array
        if (!Array.isArray(removeIds)) {
            removeIds = [removeIds];
        }

        if (removeIds.length) {
            task.attachments = task.attachments.filter(att => {
                if (removeIds.includes(att._id.toString())) {
                    const filePath = path.join(__dirname, '..', 'public', att.url);
                    if (fs.existsSync(filePath)) {
                        fs.unlinkSync(filePath);
                    }
                    return false; // remove khỏi DB
                }
                return true;
            });
        }

        /**
         * 3️⃣ THÊM FILE MỚI (KHÔNG GHI ĐÈ)
         */
        if (req.files?.length) {
            req.files.forEach(file => {
                const filename = Buffer
                    .from(file.originalname, 'latin1')
                    .toString('utf8');

                task.attachments.push({
                    filename,
                    url: `upload/${file.filename}`,
                    uploadedAt: new Date()
                });
            });
        }

        await task.save();
        await task.populate('category');

        res.status(200).json({
            message: 'Task updated successfully',
            task
        });

    } catch (error) {
        res.status(500).json({
            message: 'Server error',
            error: error.message
        });
    }
};


const deleteTask = async (req, res) => {
    try {
        const taskId = req.params.id;
        const userId = req.userId;

        // Check ID hợp lệ
        if (!mongoose.Types.ObjectId.isValid(taskId)) {
            return res.status(400).json({ message: 'Invalid task ID' });
        }

        const task = await Task.findOne(
            { _id: taskId },
        )

        if (!task) {
            return res.status(404).json({ message: 'Task not found' });
        }

        if (!task.userId.equals(userId)) {
            return res.status(403).json({ message: 'Only owner can delete task' });
        }

        Object.assign(task, { isDeleted: true, deletedAt: new Date() })
        await task.save();


        res.status(200).json({ message: 'Task deleted successfully', task });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
}

const uploadAttachment = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        const task = await Task.findOne({
            _id: req.params.id,
            userId: req.userId,
            isDeleted: false
        }).populate({ path: 'sharedWith.user', select: 'name email' });

        if (!task) {
            return res.status(404).json({ message: 'Task not found' });
        }

        if (!canEdit(task, req.userId)) {
            return res.status(403).json({ message: 'Permission denied' });
        }


        task.attachments.push({
            filename: req.file.originalname,
            url: `upload/${req.file.filename}`, // Giả sử bạn lưu file trong thư mục 'uploads'
            uploadedAt: new Date()
        });

        await task.save();

        res.status(200).json({ message: 'Attachment uploaded successfully', task });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
}

const shareTask = async (req, res) => {
    try {
        const { userEmail, permission } = req.body;

        // if (!['view', 'edit'].includes(permission)) {
        //     return res.status(400).json({ message: 'Invalid permission' });
        // }


        const shareUser = await User.findOne({ email: userEmail });

        if (!shareUser) {
            return res.status(404).json({ message: 'User not found' });
        }
        console.log('id', req.params.id);
        console.log('user', req.userId);

        const task = await Task.findOne({
            _id: req.params.id,
            userId: req.userId,
            isDeleted: false,
        });

        if (!task) {
            return res.status(404).json({ message: 'Task not found' })
        }

        // check if already shared
        const alreadyShared = task.sharedWith.find(
            s => s.user.toString() === shareUser._id.toString()
        ) //So sánh ObjectId → phải dùng toString()

        if (alreadyShared) {
            return res.status(400).json({ message: 'Task already share with this user' });
        }

        task.sharedWith.push({
            user: shareUser._id,
            permission: permission || 'view'
        })

        await task.save();
        const populatedTask = await Task.findById(task._id)
            .populate('sharedWith.user', 'name email');

        console.log(
            JSON.stringify(populatedTask.sharedWith, null, 2)
        );

        res.json({
            message: 'Task shared successfully',
            task: populatedTask
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

const downloadAttachment = async (req, res) => {
    try {
        const { id, fileId } = req.params;

        const task = await Task.findById(id);
        if (!task) {
            return res.status(404).json({ message: 'Task not found' });
        }

        if (!canView(task, req.userId)) {
            return res.status(403).json({ message: 'Permission denied' });
        }

        const file = task.attachments.id(fileId);
        if (!file) {
            return res.status(404).json({ message: 'File not found' });
        };

        const filePath = path.json(__dirname, '../uploads', file.url);

        res.download(filePath, file.filename);
    } catch (error) {
        return res.status(500).json({ message: error.message })
    }
}

module.exports = { createTask, getTasks, getTaskById, updatedTask, deleteTask, uploadAttachment, shareTask, downloadAttachment };

