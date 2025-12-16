const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Title is required'],
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    status: {
        type: String,
        enum: ['pending', 'done', 'in-progress'],
        default: 'pending'
    },

    priority: {
        type: String,
        enum: ['low', 'medium', 'high'],
        default: 'medium'
    },

    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        required: true
    },

    tags: [{
        type: String,
        trim: true
    }],

    dueDate: {
        type: Date,
    },

    completedAt: {
        type: Date,
    },

    attachments: [{
        filename: String,
        url: String,
        uploadedAt: Date
    }],

    sharedWith: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        permission: {
            type: String,
            enum: ['view', 'edit'],
            default: 'view',
        }
    }],

    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    isDeleted: {
        type: Boolean,
        default: false
    },
    deletedAt: {
        type: Date,
        default: null
    }

}, {
    timestamps: true
})

// Index for better query performance
taskSchema.index({ userId: 1, status: 1 });
taskSchema.index({ userId: 1, dueDate: 1 });
taskSchema.index({ dueDate: 1 }); //Lọc task sắp đến hạn
taskSchema.index({ priority: 1 });

module.exports = mongoose.model('Task', taskSchema);