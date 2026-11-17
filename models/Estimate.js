// Stores a customer's estimate inputs and calculated cost snapshot.
const mongoose = require('mongoose');

const estimateSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    inputs: {
        type: mongoose.Schema.Types.Mixed,
        required: true
    },
    breakdown: {
        type: mongoose.Schema.Types.Mixed,
        required: true
    }
}, {
    timestamps: true
});

module.exports = mongoose.models.Estimate || mongoose.model('Estimate', estimateSchema);