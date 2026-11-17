// Stores a customer's booking with an unchanged estimate snapshot.
const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    estimateSnapshot: {
        type: mongoose.Schema.Types.Mixed,
        required: true
    },
    contact: {
        name: { type: String, required: true, trim: true },
        phone: { type: String, required: true, trim: true },
        email: { type: String, required: true, trim: true, lowercase: true }
    },
    address: {
        line: { type: String, required: true, trim: true },
        city: { type: String, required: true, trim: true },
        pincode: { type: String, required: true, trim: true }
    },
    preferredStartDate: {
        type: Date,
        required: true
    },
    notes: {
        type: String,
        default: '',
        maxlength: 500
    },
    status: {
        type: String,
        enum: ['pending', 'confirmed', 'completed', 'cancelled'],
        default: 'pending'
    }
}, {
    timestamps: true
});

module.exports = mongoose.models.Booking || mongoose.model('Booking', bookingSchema);