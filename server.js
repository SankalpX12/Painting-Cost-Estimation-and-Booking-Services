// Starts the Express server, serves the website, and reports service health.
require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const connectDatabase = require('./config/database');
const authRoutes = require('./routes/auth');
const settingsRoutes = require('./routes/settings');
const estimateRoutes = require('./routes/estimates');
const bookingRoutes = require('./routes/bookings');
const adminRoutes = require('./routes/admin');

const app = express();
const publicDirectory = path.join(__dirname, 'public');

app.use(express.json());
app.use(express.static(publicDirectory));
app.use('/api/auth', authRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/estimates', estimateRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/admin', adminRoutes);

// Returns application and database status for local and deployment checks.
function getHealth(request, response) {
    let databaseStatus = 'disconnected';

    if (!process.env.MONGODB_URI) {
        databaseStatus = 'not-configured';
    } else if (mongoose.connection.readyState === 1) {
        databaseStatus = 'connected';
    }

    response.status(200).json({
        status: 'ok',
        database: databaseStatus
    });
}

app.get('/api/health', getHealth);

// Starts listening on the hosting platform's port or the local default.
function startServer() {
    const port = process.env.PORT || 3000;

    app.listen(port, function () {
        console.log('Server listening on port ' + port + '.');
    });

    connectDatabase();
}

startServer();