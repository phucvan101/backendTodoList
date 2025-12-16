const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
    taskId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Task',
        require: true,
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        require: true
    },
    content: {
        type: String,
        require: true,
        trim: true
    },
    isEdited: {
        type: Boolean,
        default: false
    }
})


module.exports = mongoose.model('Comment', commentSchema)