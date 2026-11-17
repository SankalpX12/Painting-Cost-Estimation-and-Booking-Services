// Connects the application to MongoDB Atlas when a URI is configured.
const mongoose = require('mongoose');

// Opens the database connection without preventing the local site from starting.
async function connectDatabase() {
    if (!process.env.MONGODB_URI) {
        console.warn('MONGODB_URI is not set. The site will start without a database.');
        return;
    }

    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB.');
    } catch (error) {
        console.error('MongoDB connection failed:', error.message);
    }
}

module.exports = connectDatabase;