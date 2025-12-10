const ActivityLog = require('../models/activityLog');

const getActivities = async (req, res) => {
    try {
        const { page = 1, limit = 20, resource, action } = req.query;

        const query = { userId: req.userId };

        if (resource) {
            query.resource = resource;
        }

        if (action) {
            query.action = action;
        }

        const skip = (page - 1) * limit;

        const [activities, total] = await Promise.all([
            ActivityLog.find(query)
                .sort({ createdAt: -1 })
                .limit(parseInt(limit))
                .skip(parseInt(skip)),
            ActivityLog.countDocuments(query)
        ])

        res.json({
            activities,
            pagination: {
                total,
                page: parseInt(page),
                pages: Math.ceil(total / limit) // làm tròn lên 
            }
        });

    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
}


module.exports = { getActivities };