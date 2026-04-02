require('dotenv').config();
const express = require('express');
const { initDatabase } = require('./src/config/db');
const { errorResponse } = require('./src/utils/response');

const authRoutes = require('./src/routes/auth.routes');
const userRoutes = require('./src/routes/user.routes');
const recordRoutes = require('./src/routes/record.routes');
const dashboardRoutes = require('./src/routes/dashboard.routes');

const app = express();
const PORT = process.env.PORT || 5000;

initDatabase();

app.use(express.json());

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/records', recordRoutes);
app.use('/api/v1/dashboard', dashboardRoutes);

app.use((req, res, next) => {
    return errorResponse(res, 'Route not found', 404);
});

app.use((err, req, res, next) => {
    console.error(err);
    return errorResponse(res, 'Internal Server Error', 500);
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
