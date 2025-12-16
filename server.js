require('dotenv').config();
const express = require('express');
const cors = require('cors');
// import authRoutes from './routes/auth.routes.js';
// import taskRoutes from './routes/task.routes.js';
// import { errorHandler } from './middleware/error.middleware.js';
const connectDB = require('./configs/db')
const authRoutes = require('./routes/authRoute')
const taskRoutes = require('./routes/taskRoute')
const activityRoutes = require('./routes/activityRoute')
const categoryRoutes = require('./routes/categoryRoute')
const commentRoutes = require('./routes/commentRoute');


const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Connect to Database
connectDB();

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/activities', activityRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/comments', commentRoutes);

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'OK', message: 'Server is running' });
});



// Error handling
// app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});