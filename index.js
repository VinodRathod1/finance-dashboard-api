require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const { initDatabase } = require('./src/config/db');
const { errorResponse } = require('./src/utils/response');

const authRoutes      = require('./src/routes/auth.routes');
const userRoutes      = require('./src/routes/user.routes');
const recordRoutes    = require('./src/routes/record.routes');
const dashboardRoutes = require('./src/routes/dashboard.routes');

const app = express();
const PORT = process.env.PORT || 5000;

initDatabase();

app.use(helmet());
app.use(cors());
app.use(express.json());

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: { success: false, message: 'Too many requests, please try again later' }
});
app.use('/api', limiter);

app.use('/api/v1/auth',      authRoutes);
app.use('/api/v1/users',     userRoutes);
app.use('/api/v1/records',   recordRoutes);
app.use('/api/v1/dashboard', dashboardRoutes);

app.use((req, res) => {
    return errorResponse(res, `Route not found: ${req.method} ${req.originalUrl}`, 404);
});

app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    const statusCode = err.statusCode || 500;
    const message = err.message || 'Internal Server Error';
    const response = { success: false, message };
    if (process.env.NODE_ENV === 'development') {
        response.stack = err.stack;
    }
    return res.status(statusCode).json(response);
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
