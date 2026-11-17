// Loads the saved rate table or creates it from the shared estimator defaults.
const Settings = require('../models/Settings');
const DEFAULT_SETTINGS = require('../public/js/estimate').DEFAULT_SETTINGS;

// Returns the single settings document, creating it once when needed.
async function loadSettings() {
    return Settings.findOneAndUpdate({ key: 'main' }, {
        $setOnInsert: {
            qualities: DEFAULT_SETTINGS.qualities,
            puttyRate: DEFAULT_SETTINGS.puttyRate,
            primerRate: DEFAULT_SETTINGS.primerRate,
            touchUpLabourFactor: DEFAULT_SETTINGS.touchUpLabourFactor,
            wallMultiplier: DEFAULT_SETTINGS.wallMultiplier,
            bhkFloorArea: DEFAULT_SETTINGS.bhkFloorArea,
            standardDoor: DEFAULT_SETTINGS.standardDoor,
            standardWindow: DEFAULT_SETTINGS.standardWindow,
            defaultOpeningCounts: DEFAULT_SETTINGS.defaultOpeningCounts,
            customDesignRatePerSqFt: DEFAULT_SETTINGS.customDesignRatePerSqFt,
            extraColourFee: DEFAULT_SETTINGS.extraColourFee
        }
    }, {
        upsert: true,
        returnDocument: 'after',
        setDefaultsOnInsert: true,
        runValidators: true
    });
}

module.exports = loadSettings;