const Category = require('../models/categoryModel');
const mongoose = require('mongoose');

const createCategory = async (req, res) => {
    try {
        const { name, color, icon } = req.body;

        const userId = req.userId;

        const newCategory = await Category.create({
            name,
            color: color || '#409eff',
            icon: icon || '📁',
            userId
        })

        res.status(201).json({ message: 'Category created successfully', category: newCategory });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
}

const getCategories = async (req, res) => {
    try {
        const userId = req.userId;
        const categories = await Category.find({ userId: userId });
        res.status(200).json({ categories });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
}

const updateCategory = async (req, res) => {
    try {
        const categoryId = req.params.id;
        const userId = req.userId;
        const { name, color, icon } = req.body;

        // Check ID hợp lệ
        if (!mongoose.Types.ObjectId.isValid(categoryId)) {
            return res.status(400).json({ message: 'Invalid category ID' });
        }

        const category = await Category.findOneAndUpdate(
            { _id: categoryId, userId },
            { name, color, icon },
            { new: true, runValidators: true }
        )

        if (!category) {
            res.status(404).json({ message: 'Category not found' });
        }

        res.status(200).json({ message: 'Category updated successfully', category });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }

}

const deletedCategory = async (req, res) => {
    try {
        const categoryId = req.params.id;
        const userId = req.userId;

        // Check ID hợp lệ
        if (!mongoose.Types.ObjectId.isValid(categoryId)) {
            return res.status(400).json({ message: 'Invalid category ID' });
        }

        const category = await Category.findOneAndUpdate(
            { _id: categoryId, userId },
            { isDeleted: true, deletedAt: new Date() },
            { new: true }
        )

        if (!category) {
            res.status(404).json({ message: 'Category not found' });
        }

        res.status(200).json({ message: 'Category deleted successfully', category });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
}

module.exports = { createCategory, getCategories, updateCategory, deletedCategory };