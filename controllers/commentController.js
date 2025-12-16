const { response } = require('express');
const Comment = require('../models/commentModel');
const Task = require('../models/taskModel')

const createComment = async (req, res) => {
    try {
        const { content } = req.body;
        const { taskId } = req.params;

        const task = await Task.findOne({
            _id: taskId,
            $or: [
                { userId: req.userId },
                { 'sharedWith.user': req.userId }
            ],
            isDeleted: false
        })


        if (!task) {
            return res.status(404).json({ message: 'Task not found' })
        }

        const comment = await Comment.create({
            taskId,
            userId: req.userId,
            content
        })

        await comment.populate('userId', 'name avatar')

        res.status(201).json({
            message: 'Comment created successfully',
            comment
        })
    } catch (error) {
        return res.status(500).json({ message: error.message })
    }
}


const getComments = async (req, res) => {
    try {
        const { taskId } = req.params;

        const comments = await Comment.find({ taskId }).populate('userId', 'name avatar').sort({ createAt: -1 })

        res.json({ comments });
    } catch (error) {
        return res.status(500).json({ message: error.message })
    }
}


const updateComment = async (req, res) => {
    try {
        const { content } = req.body;

        if (!content || !content.trim()) {
            return res.status(400).json({ message: 'Content field is required' });
        }

        const comment = await Comment.findOneAndUpdate({ _id: req.params.id, userId: req.userId }, { content: content, isEdited: true }, { new: true });

        if (!comment) {
            return res.status(404).json({ message: 'Comment not found' });
        }

        res.status(200).json({ message: 'Comment updated successfully', comment })
    } catch (error) {
        return res.status(500).json({ message: error.message })
    }
}

const deletedComment = async (req, res) => {
    try {
        const comment = await Comment.findByIdAndDelete({ _id: req.params.id, userId: req.userId });
        if (!comment) {
            return res.status(404).json({ message: 'Comment not found' });
        }
        return res.status(200).json({ message: 'Comment deleted successfully' });
    } catch (error) {
        return res.status(500).json({ message: error.message })
    }
}

module.exports = {
    createComment,
    getComments,
    updateComment,
    deletedComment
}