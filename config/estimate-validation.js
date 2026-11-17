// Recalculates submitted estimates with the current saved rate table.
const loadSettings = require('./settings');
const calculateEstimate = require('../public/js/estimate').calculateEstimate;

// Returns the server calculation or marks the customer input as invalid.
async function verifyEstimate(inputs, submittedBreakdown) {
    const settings = await loadSettings();
    let calculated;

    try {
        calculated = calculateEstimate(inputs, settings.toObject());
    } catch (error) {
        error.statusCode = 400;
        throw error;
    }

    const fields = [
        'wallArea',
        'openingsArea',
        'ceilingArea',
        'paintableArea',
        'paintCost',
        'puttyPrimerCost',
        'labourCost',
        'designCost',
        'extraColourCost',
        'total'
    ];

    for (let index = 0; index < fields.length; index += 1) {
        const field = fields[index];
        const submittedValue = Number(submittedBreakdown[field]);

        if (!Number.isFinite(submittedValue) || Math.abs(submittedValue - calculated[field]) > 0.001) {
            const error = new Error('This estimate no longer matches the current rates. Refresh and try again.');
            error.statusCode = 400;
            throw error;
        }
    }

    return calculated;
}

module.exports = verifyEstimate;