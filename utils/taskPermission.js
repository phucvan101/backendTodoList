const canView = (task, userId) => {
    if (task.userId.equals(userId)) return true;

    return task.sharedWith.some(
        s => s.user.equals(userId)
    )
}

const canEdit = (task, userId) => {
    if (task.userId.equals(userId)) return true
    return task.sharedWith.some(
        s => s.user.equals(userId) && s.permission === 'edit'
    )
}


module.exports = { canView, canEdit };

