// Creates the first administrator and ensures default rates exist.
require('dotenv').config();

const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const User = require('../models/User');
const loadSettings = require('../config/settings');

// Creates the administrator only when one does not already exist.
async function seedData() {
    const email = typeof process.env.ADMIN_EMAIL === 'string'
        ? process.env.ADMIN_EMAIL.trim().toLowerCase()
        : '';
    const password = process.env.ADMIN_PASSWORD || '';

    if (!process.env.MONGODB_URI || !email || password.length < 8) {
        throw new Error('Set MONGODB_URI, ADMIN_EMAIL, and an ADMIN_PASSWORD of at least 8 characters.');
    }

    await mongoose.connect(process.env.MONGODB_URI);
    await loadSettings();

    const existingAdmin = await User.findOne({ email: email });

    if (existingAdmin) {
        if (existingAdmin.role !== 'admin') {
            throw new Error('ADMIN_EMAIL already belongs to a customer account. Use a different email.');
        }

        console.log('Administrator already exists. Default rates are ready.');
        return;
    }

    const passwordHash = await bcrypt.hash(password, 10);
    await User.create({
        name: 'Administrator',
        email: email,
        phone: '0000000000',
        passwordHash: passwordHash,
        role: 'admin'
    });

    console.log('Administrator and default rates created.');
}

seedData().catch(function (error) {
    console.error('Seed failed:', error.message);
    process.exitCode = 1;
}).finally(async function () {
    await mongoose.disconnect();
});