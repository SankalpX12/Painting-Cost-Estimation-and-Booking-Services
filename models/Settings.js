// Stores the single editable estimator rate table.
const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
    key: {
        type: String,
        unique: true,
        default: 'main'
    },
    qualities: {
        type: mongoose.Schema.Types.Mixed,
        required: true
    },
    puttyRate: {
        type: Number,
        required: true,
        min: 0
    },
    primerRate: {
        type: Number,
        required: true,
        min: 0
    },
    touchUpLabourFactor: {
        type: Number,
        required: true,
        min: 0
    },
    wallMultiplier: {
        type: Number,
        required: true,
        min: 0
    },
    bhkFloorArea: {
        type: mongoose.Schema.Types.Mixed,
        required: true
    },
    standardDoor: {
        type: mongoose.Schema.Types.Mixed,
        required: true
    },
    standardWindow: {
        type: mongoose.Schema.Types.Mixed,
        required: true
    },
    defaultOpeningCounts: {
        type: mongoose.Schema.Types.Mixed,
        required: true
    },
    customDesignRatePerSqFt: {
        type: Number,
        required: true,
        min: 0
    },
    extraColourFee: {
        type: Number,
        required: true,
        min: 0
    }
}, {
    timestamps: true
});

module.exports = mongoose.models.Settings || mongoose.model('Settings', settingsSchema);