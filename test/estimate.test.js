// Checks the estimator against the required Section 14 examples.
const assert = require('node:assert/strict');
const test = require('node:test');
const { calculateEstimate } = require('../public/js/estimate.js');

// Builds a fresh-painting input for the selected BHK and quality.
function makeBhkInput(bhk, quality, includeCeiling, paintingType) {
    return {
        homeType: 'bhk',
        bhk: bhk,
        paintingType: paintingType || 'fresh',
        quality: quality,
        includeCeiling: includeCeiling,
        openings: []
    };
}

test('2 BHK fresh premium uses the required default openings and total', function () {
    const estimate = calculateEstimate(makeBhkInput(2, 'premium', false));

    assert.equal(estimate.wallArea, 1875);
    assert.equal(estimate.openingsArea, 153);
    assert.equal(estimate.paintableArea, 1722);
    assert.equal(estimate.paintCost, 20664);
    assert.equal(estimate.puttyPrimerCost, 9471);
    assert.equal(estimate.labourCost, 20664);
    assert.equal(estimate.total, 50799);
});

test('2 BHK fresh premium includes ceiling area when selected', function () {
    const estimate = calculateEstimate(makeBhkInput(2, 'premium', true));

    assert.equal(estimate.paintableArea, 2472);
    assert.equal(estimate.paintCost, 29664);
    assert.equal(estimate.puttyPrimerCost, 13596);
    assert.equal(estimate.labourCost, 29664);
    assert.equal(estimate.total, 72924);
});

test('1 BHK fresh economy matches the required total', function () {
    const estimate = calculateEstimate(makeBhkInput(1, 'economy', false));

    assert.equal(estimate.paintableArea, 1026);
    assert.equal(estimate.paintCost, 5130);
    assert.equal(estimate.puttyPrimerCost, 5643);
    assert.equal(estimate.labourCost, 10260);
    assert.equal(estimate.total, 21033);
});

test('2 BHK premium touch-up uses primer only and reduced labour', function () {
    const estimate = calculateEstimate(makeBhkInput(2, 'premium', false, 'touchup'));

    assert.equal(estimate.paintCost, 20664);
    assert.equal(estimate.puttyPrimerCost, 4305);
    assert.equal(estimate.labourCost, 14465);
    assert.equal(estimate.total, 39434);
});

test('custom luxury estimate uses only entered openings', function () {
    const estimate = calculateEstimate({
        homeType: 'custom',
        customWallArea: 1000,
        paintingType: 'fresh',
        quality: 'luxury',
        includeCeiling: false,
        openings: [
            { kind: 'door', width: 3, height: 7 },
            { kind: 'door', width: 3, height: 7 },
            { kind: 'window', width: 4, height: 4 }
        ]
    });

    assert.equal(estimate.openingsArea, 58);
    assert.equal(estimate.openings.usedDefaultOpenings, false);
    assert.equal(estimate.paintableArea, 942);
    assert.equal(estimate.paintCost, 20724);
    assert.equal(estimate.puttyPrimerCost, 5181);
    assert.equal(estimate.labourCost, 13188);
    assert.equal(estimate.total, 39093);
});

test('custom design adds the configured charge and stays within the paintable area', function () {
    const estimate = calculateEstimate({
        homeType: 'bhk',
        bhk: 2,
        paintingType: 'fresh',
        quality: 'premium',
        includeCeiling: false,
        openings: [],
        includeDesign: true,
        designArea: 100,
        designDescription: 'One feature wall'
    });

    assert.equal(estimate.designCost, 5000);
    assert.equal(estimate.total, 55799);

    assert.throws(function () {
        calculateEstimate({
            homeType: 'bhk',
            bhk: 1,
            paintingType: 'fresh',
            quality: 'economy',
            includeCeiling: false,
            openings: [],
            includeDesign: true,
            designArea: 2000,
            designDescription: 'Too large'
        });
    }, /cannot exceed the paintable area/);
});

test('one accent colour adds the flat fee and accent area cannot exceed paintable area', function () {
    const estimate = calculateEstimate({
        homeType: 'bhk',
        bhk: 2,
        paintingType: 'fresh',
        quality: 'premium',
        includeCeiling: false,
        openings: [],
        colours: {
            main: { name: 'Soft White', hex: '#F4F1EA' },
            accents: [{ name: 'Coral', hex: '#DF7864', area: 50 }]
        }
    });

    assert.equal(estimate.extraColourCost, 500);
    assert.equal(estimate.accentArea, 50);
    assert.equal(estimate.total, 51299);

    assert.throws(function () {
        calculateEstimate({
            homeType: 'bhk',
            bhk: 1,
            paintingType: 'fresh',
            quality: 'economy',
            includeCeiling: false,
            openings: [],
            colours: {
                accents: [{ name: 'Blue', hex: '#92C7DE', area: 1100 }]
            }
        });
    }, /cannot exceed the paintable area/);
});

test('more than three accent colours are rejected', function () {
    assert.throws(function () {
        calculateEstimate({
            homeType: 'bhk',
            bhk: 2,
            paintingType: 'fresh',
            quality: 'premium',
            includeCeiling: false,
            openings: [],
            colours: {
                accents: [
                    { name: 'A', hex: '#111111', area: 1 },
                    { name: 'B', hex: '#222222', area: 1 },
                    { name: 'C', hex: '#333333', area: 1 },
                    { name: 'D', hex: '#444444', area: 1 }
                ]
            }
        });
    }, /up to 3 accent colours/);
});

test('malformed colour hex values are rejected', function () {
    assert.throws(function () {
        calculateEstimate({
            homeType: 'bhk',
            bhk: 2,
            paintingType: 'fresh',
            quality: 'premium',
            includeCeiling: false,
            openings: [],
            colours: {
                main: { name: 'Invalid colour', hex: 'not-hex' },
                accents: []
            }
        });
    }, /six-digit hex colour/);
});

test('invalid custom areas and opening dimensions are rejected', function () {
    assert.throws(function () {
        calculateEstimate({
            homeType: 'custom',
            customWallArea: 0,
            paintingType: 'fresh',
            quality: 'premium',
            includeCeiling: false,
            openings: []
        });
    }, /between 50 and 20,000/);

    assert.throws(function () {
        calculateEstimate({
            homeType: 'bhk',
            bhk: 1,
            paintingType: 'fresh',
            quality: 'premium',
            includeCeiling: false,
            openings: [{ kind: 'door', width: 0, height: 7 }]
        });
    }, /greater than zero/);
});