// Stores the estimator rates and calculates validated painting estimates.
const DEFAULT_SETTINGS = {
    qualities: {
        economy: {
            name: 'Economy Distemper',
            stars: 3,
            paint: 5,
            labour: 10
        },
        premium: {
            name: 'Premium Plastic Emulsion',
            stars: 4,
            paint: 12,
            labour: 12
        },
        luxury: {
            name: 'Luxury Silk / Royal Sheen',
            stars: 5,
            paint: 22,
            labour: 14
        }
    },
    puttyRate: 3,
    primerRate: 2.5,
    touchUpLabourFactor: 0.7,
    wallMultiplier: 2.5,
    bhkFloorArea: {
        1: 450,
        2: 750,
        3: 1100
    },
    standardDoor: {
        width: 3,
        height: 7
    },
    standardWindow: {
        width: 3,
        height: 4
    },
    defaultOpeningCounts: {
        1: {
            doors: 3,
            windows: 3
        },
        2: {
            doors: 5,
            windows: 4
        },
        3: {
            doors: 7,
            windows: 6
        }
    },
    customDesignRatePerSqFt: 50,
    extraColourFee: 500
};

// Returns a numeric input or throws a friendly validation message.
function readNumber(value, label) {
    if (value === '' || value === null || typeof value === 'undefined') {
        throw new Error(label + ' is required.');
    }

    const number = Number(value);

    if (!Number.isFinite(number)) {
        throw new Error(label + ' must be a number.');
    }

    return number;
}

// Finds the closest approved BHK size for custom wall-area defaults.
function findClosestBhk(wallArea, settings) {
    const equivalentFloorArea = wallArea / settings.wallMultiplier;
    let closestBhk = 1;
    let smallestDifference = Math.abs(equivalentFloorArea - settings.bhkFloorArea[1]);

    for (let bhk = 2; bhk <= 3; bhk += 1) {
        const difference = Math.abs(equivalentFloorArea - settings.bhkFloorArea[bhk]);

        if (difference < smallestDifference) {
            closestBhk = bhk;
            smallestDifference = difference;
        }
    }

    return closestBhk;
}

// Rejects unsafe or malformed colour values before they are stored.
function validateColour(colour, label) {
    if (!colour || typeof colour.name !== 'string' || !colour.name.trim() || colour.name.length > 80) {
        throw new Error(label + ' needs a name of 80 characters or fewer.');
    }

    if (typeof colour.hex !== 'string' || !/^#[0-9A-Fa-f]{6}$/.test(colour.hex)) {
        throw new Error(label + ' must use a six-digit hex colour.');
    }
}

// Creates opening totals from user-entered sizes or standard placeholders.
function calculateOpenings(openings, homeType, bhk, wallArea, settings) {
    let doorCount = 0;
    let windowCount = 0;
    let doorArea = 0;
    let windowArea = 0;
    let usedDefaultOpenings = false;
    let defaultBhk = bhk;

    if (typeof openings === 'undefined' || openings === null) {
        openings = [];
    }

    if (!Array.isArray(openings)) {
        throw new Error('Openings must be a list.');
    }

    if (openings.length === 0) {
        usedDefaultOpenings = true;

        if (homeType === 'custom') {
            defaultBhk = findClosestBhk(wallArea, settings);
        }

        const defaultCounts = settings.defaultOpeningCounts[defaultBhk];
        doorCount = defaultCounts.doors;
        windowCount = defaultCounts.windows;
        doorArea = doorCount * settings.standardDoor.width * settings.standardDoor.height;
        windowArea = windowCount * settings.standardWindow.width * settings.standardWindow.height;
    } else {
        for (let index = 0; index < openings.length; index += 1) {
            const opening = openings[index];

            if (!opening || (opening.kind !== 'door' && opening.kind !== 'window')) {
                throw new Error('Choose door or window for each opening.');
            }

            const width = readNumber(opening.width, 'Opening width');
            const height = readNumber(opening.height, 'Opening height');

            if (width <= 0 || height <= 0) {
                throw new Error('Opening widths and heights must be greater than zero.');
            }

            if (opening.kind === 'door') {
                doorCount += 1;
                doorArea += width * height;
            } else {
                windowCount += 1;
                windowArea += width * height;
            }
        }
    }

    return {
        area: doorArea + windowArea,
        doorCount: doorCount,
        doorArea: doorArea,
        windowCount: windowCount,
        windowArea: windowArea,
        usedDefaultOpenings: usedDefaultOpenings,
        defaultBhk: defaultBhk
    };
}

// Calculates the estimate and returns itemized, rounded rupee amounts.
function calculateEstimate(inputs, settings) {
    if (!inputs || typeof inputs !== 'object') {
        throw new Error('Estimate details are required.');
    }

    if (!settings) {
        settings = DEFAULT_SETTINGS;
    }

    let wallArea = 0;
    let floorArea = 0;
    let bhk = 0;

    if (inputs.homeType === 'bhk') {
        bhk = Number(inputs.bhk);

        if (!settings.bhkFloorArea[bhk]) {
            throw new Error('Choose a valid home size.');
        }

        floorArea = settings.bhkFloorArea[bhk];
        wallArea = floorArea * settings.wallMultiplier;
    } else if (inputs.homeType === 'custom') {
        wallArea = readNumber(inputs.customWallArea, 'Custom wall area');

        if (wallArea < 50 || wallArea > 20000) {
            throw new Error('Custom wall area must be between 50 and 20,000 sq ft.');
        }
    } else {
        throw new Error('Choose a home size.');
    }

    if (inputs.paintingType !== 'fresh' && inputs.paintingType !== 'touchup') {
        throw new Error('Choose fresh painting or repaint touch-up.');
    }

    const quality = settings.qualities[inputs.quality];

    if (!quality) {
        throw new Error('Choose a paint quality.');
    }

    const openings = calculateOpenings(inputs.openings, inputs.homeType, bhk, wallArea, settings);

    if (openings.area >= wallArea) {
        throw new Error('Total door and window area must be less than the wall area.');
    }

    let ceilingArea = 0;

    if (inputs.includeCeiling === true) {
        if (inputs.homeType === 'bhk') {
            ceilingArea = floorArea;
        } else {
            ceilingArea = readNumber(inputs.customCeilingArea, 'Ceiling area');

            if (ceilingArea <= 0 || ceilingArea > 20000) {
                throw new Error('Ceiling area must be greater than zero and at most 20,000 sq ft.');
            }
        }
    }

    const paintableWalls = wallArea - openings.area;
    const paintableArea = paintableWalls + ceilingArea;
    let accentColours = [];
    let accentArea = 0;

    if (inputs.colours && typeof inputs.colours !== 'undefined') {
        if (inputs.colours.main) {
            validateColour(inputs.colours.main, 'Main colour');
        }

        if (typeof inputs.colours.accents !== 'undefined') {
            if (!Array.isArray(inputs.colours.accents)) {
                throw new Error('Accent colours must be a list.');
            }

            accentColours = inputs.colours.accents;
        }
    }

    if (accentColours.length > 3) {
        throw new Error('You can add up to 3 accent colours.');
    }

    for (let index = 0; index < accentColours.length; index += 1) {
        validateColour(accentColours[index], 'Accent colour');
        const area = readNumber(accentColours[index].area, 'Accent colour area');

        if (area <= 0) {
            throw new Error('Accent colour areas must be greater than zero.');
        }

        accentArea += area;
    }

    if (accentArea > paintableArea) {
        throw new Error('Total accent colour area cannot exceed the paintable area.');
    }

    let designArea = 0;
    let designDescription = '';

    if (inputs.includeDesign === true) {
        designArea = readNumber(inputs.designArea, 'Custom design area');

        if (designArea <= 0) {
            throw new Error('Custom design area must be greater than zero.');
        }

        if (designArea > paintableArea) {
            throw new Error('Custom design area cannot exceed the paintable area.');
        }

        if (typeof inputs.designDescription !== 'string' || !inputs.designDescription.trim()) {
            throw new Error('Enter a short description for the custom design.');
        }

        if (inputs.designDescription.length > 200) {
            throw new Error('Custom design description must be 200 characters or fewer.');
        }

        designDescription = inputs.designDescription.trim();
    }

    let puttyPrimerRate = settings.puttyRate + settings.primerRate;
    let labourRate = quality.labour;

    if (inputs.paintingType === 'touchup') {
        puttyPrimerRate = settings.primerRate;
        labourRate = quality.labour * settings.touchUpLabourFactor;
    }

    const paintCost = Math.round(paintableArea * quality.paint);
    const puttyPrimerCost = Math.round(paintableArea * puttyPrimerRate);
    const labourCost = Math.round(paintableArea * labourRate);
    const designCost = Math.round(designArea * settings.customDesignRatePerSqFt);
    const extraColourCost = Math.round(accentColours.length * settings.extraColourFee);

    return {
        homeType: inputs.homeType,
        bhk: bhk,
        floorArea: floorArea,
        wallArea: wallArea,
        openingsArea: openings.area,
        openings: openings,
        paintableWalls: paintableWalls,
        ceilingArea: ceilingArea,
        paintableArea: paintableArea,
        quality: inputs.quality,
        paintingType: inputs.paintingType,
        paintRate: quality.paint,
        puttyPrimerRate: puttyPrimerRate,
        labourRate: labourRate,
        totalRatePerSqFt: quality.paint + puttyPrimerRate + labourRate,
        paintCost: paintCost,
        puttyPrimerCost: puttyPrimerCost,
        labourCost: labourCost,
        designArea: designArea,
        designDescription: designDescription,
        designCost: designCost,
        accentColourCount: accentColours.length,
        accentArea: accentArea,
        extraColourCost: extraColourCost,
        total: paintCost + puttyPrimerCost + labourCost + designCost + extraColourCost
    };
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        DEFAULT_SETTINGS: DEFAULT_SETTINGS,
        calculateEstimate: calculateEstimate
    };
}

if (typeof window !== 'undefined') {
    window.DEFAULT_ESTIMATE_SETTINGS = DEFAULT_SETTINGS;
    window.calculateEstimate = calculateEstimate;
}