//ghi nhật ký hoạt động
const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', //liên kết tới collection User.
        required: true
    },
    action: {
        type: String,
        enum: ['create', 'update', 'delete', 'restore', 'share', 'login', 'logout'],
        required: true
    },
    resource: {
        type: String,
        required: true,
        enum: ['task', 'user', 'auth']
    },
    resourceId: {
        type: mongoose.Schema.Types.ObjectId,
    },
    details: {
        type: mongoose.Schema.Types.Mixed, //cho phép lưu bất kỳ kiểu dữ liệu nào (object, string, array…)
    },
    ipAddress: String,
    userAgent: String,
}, {
    timestamps: true
});

//Tạo index để tối ưu query
activityLogSchema.index({ userId: 1, createdAt: -1 }); //userId: dùng để filter log theo user, createdAt: sắp xếp theo thời gian (mới nhất trước)

module.exports = mongoose.model('ActivityLog', activityLogSchema);