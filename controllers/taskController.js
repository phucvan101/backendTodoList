const Task = require('../models/taskModel');

const createTask = async (req, res) => {
    try {
        const { title, description, dueDate, status } = req.body;
        const userId = req.userId;

        const newTask = await Task.create({
            title, description,
            dueDate,
            status,
            userId
        });

        res.status(201).json({ message: 'Task created successfully', task: newTask });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
}

module.exports = { createTask };

