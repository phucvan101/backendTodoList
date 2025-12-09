/*
🔥 Mục tiêu

Middleware này dùng để:

Tự động ghi Activity Log mỗi khi API trả response thành công

Không cần viết log ở từng controller → hệ thống sạch, dễ bảo trì
*/

const { response } = require('express');
const { ActivityLog } = require('../models/activityLog');

const logActivity = (action, resource) => {
    return async (req, res, next) => {
        const originalJson = res.json.bind(res);

        res.json = async (data) => {
            if (res.statusCode >= 200 && res.statusCode < 300) {
                try {
                    await ActivityLog.create({
                        userId: req.userId,
                        action,
                        resource,
                        resourceId: data?.task?._id || data?.user?.id || req.params.id,
                        details: {
                            method: req.method,
                            path: req.path,
                            body: req.body,
                        },
                        ipAddress: req.ip,
                        userAgent: req.get('user-agent'),
                    })
                } catch (error) {
                    console.error('Error logging activity:', error);
                }
            }
            return originalJson(data);
        }
        next();
    }
}

module.exports = { logActivity };