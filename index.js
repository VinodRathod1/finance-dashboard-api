require('dotenv').config();
const express = require('express');
const { initDatabase } = require('./src/config/db');
const { errorResponse } = require('./src/utils/response');

// Import route definitions
const authRoutes = require('./src/routes/auth.routes');
const userRoutes = require('./src/routes/user.routes');
const recordRoutes = require('./src/routes/record.routes');
const dashboardRoutes = require('./src/routes/dashboard.routes');

const app = express();
const PORT = process.env.PORT || 5000;

// Initialize the database on startup
initDatabase();

// Middleware to parse incoming JSON payload
app.use(express.json());

// Main API routing setup (mount routes under /api/v1/)
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/records', recordRoutes);
app.use('/api/v1/dashboard', dashboardRoutes);

// Global 404 Not Found Handler
app.use((req, res, next) => {
    return errorResponse(res, 'Route not found', 404);
});

// Global Error Handler
app.use((err, req, res, next) => {
    console.error('An unhandled error occurred:', err);
    return errorResponse(res, 'Internal Server Error', 500);
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
