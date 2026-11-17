// Connects estimator inputs to the shared calculation module and result panel.
const estimatorForm = document.getElementById('estimator-form');
const homeTypeInput = document.getElementById('home-type');
const customAreaField = document.getElementById('custom-area-field');
const includeCeilingInput = document.getElementById('include-ceiling');
const customCeilingField = document.getElementById('custom-ceiling-field');
const openingList = document.getElementById('opening-list');
const qualityOptions = document.getElementById('quality-options');
const estimateError = document.getElementById('estimate-error');
const estimateDetails = document.getElementById('estimate-details');
const defaultOpeningsNote = document.getElementById('default-openings-note');
const loginRequired = document.getElementById('login-required');
let currentEstimateInputs = null;
let currentEstimateResult = null;
let colourPalette = [];
let selectedMainColour = {
    name: 'Soft White',
    hex: '#F4F1EA'
};
const currencyFormatter = new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: 0
});

// Formats a whole-rupee amount with Indian digit grouping.
function formatRupees(amount) {
    return '₹' + currencyFormatter.format(amount);
}

// Formats a per-square-foot rate without dropping its decimal portion.
function formatRate(rate) {
    if (Number.isInteger(rate)) {
        return String(rate);
    }

    return rate.toFixed(1);
}

// Returns the selected painting type from the radio group.
function getPaintingType() {
    const selectedType = document.querySelector('input[name="paintingType"]:checked');

    if (!selectedType) {
        return 'fresh';
    }

    return selectedType.value;
}

// Returns the selected paint quality key.
function getSelectedQuality() {
    const selectedQuality = document.querySelector('input[name="quality"]:checked');

    if (!selectedQuality) {
        return 'premium';
    }

    return selectedQuality.value;
}

// Builds the quality cards and their live price-per-square-foot amounts.
function renderQualityOptions() {
    const qualities = window.DEFAULT_ESTIMATE_SETTINGS.qualities;
    const qualityKeys = Object.keys(qualities);
    const paintingType = getPaintingType();
    const selectedQuality = getSelectedQuality();
    qualityOptions.innerHTML = '';

    for (let index = 0; index < qualityKeys.length; index += 1) {
        const key = qualityKeys[index];
        const quality = qualities[key];
        let undercoatRate = window.DEFAULT_ESTIMATE_SETTINGS.puttyRate + window.DEFAULT_ESTIMATE_SETTINGS.primerRate;
        let labourRate = quality.labour;

        if (paintingType === 'touchup') {
            undercoatRate = window.DEFAULT_ESTIMATE_SETTINGS.primerRate;
            labourRate = quality.labour * window.DEFAULT_ESTIMATE_SETTINGS.touchUpLabourFactor;
        }

        const totalRate = quality.paint + undercoatRate + labourRate;
        const card = document.createElement('label');
        card.className = 'quality-card';

        const radio = document.createElement('input');
        radio.type = 'radio';
        radio.name = 'quality';
        radio.value = key;
        radio.checked = key === selectedQuality;

        const main = document.createElement('span');
        main.className = 'quality-card-main';

        const name = document.createElement('span');
        name.className = 'quality-name';
        name.textContent = quality.name;

        const stars = document.createElement('span');
        stars.className = 'quality-stars';
        stars.setAttribute('aria-label', quality.stars + ' out of 5 stars');
        stars.textContent = '★'.repeat(quality.stars);

        const rate = document.createElement('span');
        rate.className = 'quality-rate';
        rate.textContent = '₹' + formatRate(totalRate) + ' / sq ft';

        main.appendChild(name);
        main.appendChild(stars);
        card.appendChild(radio);
        card.appendChild(main);
        card.appendChild(rate);
        qualityOptions.appendChild(card);
    }
}

// Adds a row for one customer-entered door or window.
function addOpeningRow() {
    const row = document.createElement('div');
    row.className = 'opening-row';

    const kindField = document.createElement('div');
    kindField.className = 'opening-field';
    const kindLabel = document.createElement('label');
    kindLabel.textContent = 'Opening';
    const kindInput = document.createElement('select');
    kindInput.setAttribute('aria-label', 'Opening type');
    kindInput.innerHTML = '<option value="door">Door</option><option value="window">Window</option>';
    kindField.appendChild(kindLabel);
    kindField.appendChild(kindInput);

    const widthField = createOpeningSizeField('Width (ft)', 'Opening width in feet');
    const heightField = createOpeningSizeField('Height (ft)', 'Opening height in feet');

    const removeButton = document.createElement('button');
    removeButton.className = 'remove-opening';
    removeButton.type = 'button';
    removeButton.setAttribute('aria-label', 'Remove opening');
    removeButton.title = 'Remove opening';
    removeButton.textContent = '×';

    row.appendChild(kindField);
    row.appendChild(widthField);
    row.appendChild(heightField);
    row.appendChild(removeButton);
    openingList.appendChild(row);
    updateEstimate();
}

// Creates one labelled numeric width or height field.
function createOpeningSizeField(labelText, accessibleName) {
    const field = document.createElement('div');
    field.className = 'opening-field';
    const label = document.createElement('label');
    label.textContent = labelText;
    const input = document.createElement('input');
    input.type = 'number';
    input.min = '0.1';
    input.step = '0.1';
    input.inputMode = 'decimal';
    input.setAttribute('aria-label', accessibleName);
    field.appendChild(label);
    field.appendChild(input);
    return field;
}

// Reads all opening rows into the shared estimator input format.
function readOpenings() {
    const rows = openingList.querySelectorAll('.opening-row');
    const openings = [];

    for (let index = 0; index < rows.length; index += 1) {
        const kind = rows[index].querySelector('select').value;
        const fields = rows[index].querySelectorAll('input');
        openings.push({
            kind: kind,
            width: fields[0].value,
            height: fields[1].value
        });
    }

    return openings;
}

// Creates the visible step-by-step area calculation.
function renderCalculationDetails(estimate) {
    const detailLines = [];

    if (estimate.homeType === 'bhk') {
        detailLines.push('Wall area: 2.5 × ' + currencyFormatter.format(estimate.floorArea) + ' = ' + currencyFormatter.format(estimate.wallArea) + ' sq ft');
    } else {
        detailLines.push('Wall area entered: ' + currencyFormatter.format(estimate.wallArea) + ' sq ft');
    }

    if (estimate.openings.usedDefaultOpenings) {
        detailLines.push('Doors: ' + estimate.openings.doorCount + ' × 21 = ' + currencyFormatter.format(estimate.openings.doorArea) + ' sq ft');
        detailLines.push('Windows: ' + estimate.openings.windowCount + ' × 12 = ' + currencyFormatter.format(estimate.openings.windowArea) + ' sq ft');
        defaultOpeningsNote.textContent = 'Standard openings assumed: ' + estimate.openings.doorCount + ' doors and ' + estimate.openings.windowCount + ' windows.';
        defaultOpeningsNote.hidden = false;
    } else {
        detailLines.push('Entered doors: ' + estimate.openings.doorCount + ' totaling ' + currencyFormatter.format(estimate.openings.doorArea) + ' sq ft');
        detailLines.push('Entered windows: ' + estimate.openings.windowCount + ' totaling ' + currencyFormatter.format(estimate.openings.windowArea) + ' sq ft');
        defaultOpeningsNote.hidden = true;
    }

    detailLines.push('Paintable walls: ' + currencyFormatter.format(estimate.wallArea) + ' − ' + currencyFormatter.format(estimate.openingsArea) + ' = ' + currencyFormatter.format(estimate.paintableWalls) + ' sq ft');

    if (estimate.ceilingArea > 0) {
        detailLines.push('Ceiling area: +' + currencyFormatter.format(estimate.ceilingArea) + ' sq ft');
    }

    detailLines.push('Total paintable area: ' + currencyFormatter.format(estimate.paintableArea) + ' sq ft');

    if (estimate.designArea > 0) {
        detailLines.push('Custom design: ' + currencyFormatter.format(estimate.designArea) + ' × ₹' + formatRate(window.DEFAULT_ESTIMATE_SETTINGS.customDesignRatePerSqFt) + ' = ' + formatRupees(estimate.designCost));
    }

    if (estimate.accentColourCount > 0) {
        detailLines.push('Additional colours: ' + estimate.accentColourCount + ' × ₹' + formatRate(window.DEFAULT_ESTIMATE_SETTINGS.extraColourFee) + ' = ' + formatRupees(estimate.extraColourCost));
        detailLines.push('Accent area: ' + currencyFormatter.format(estimate.accentArea) + ' sq ft');
    }

    estimateDetails.innerHTML = '';

    for (let index = 0; index < detailLines.length; index += 1) {
        const line = document.createElement('div');
        line.textContent = detailLines[index];
        estimateDetails.appendChild(line);
    }
}

// Sets a chart bar width relative to the largest of the three base costs.
function setChartBar(barId, amount, maximum) {
    const bar = document.getElementById(barId);

    if (maximum === 0 || amount === 0) {
        bar.style.width = '0%';
        return;
    }

    bar.style.width = Math.max(3, amount / maximum * 100).toFixed(1) + '%';
}

// Updates the three-category cost chart without including optional add-ons.
function renderCostChart(estimate) {
    let maximum = estimate.paintCost;

    if (estimate.puttyPrimerCost > maximum) {
        maximum = estimate.puttyPrimerCost;
    }

    if (estimate.labourCost > maximum) {
        maximum = estimate.labourCost;
    }

    document.getElementById('chart-paint-amount').textContent = formatRupees(estimate.paintCost);
    document.getElementById('chart-putty-amount').textContent = formatRupees(estimate.puttyPrimerCost);
    document.getElementById('chart-labour-amount').textContent = formatRupees(estimate.labourCost);
    setChartBar('chart-paint-bar', estimate.paintCost, maximum);
    setChartBar('chart-putty-bar', estimate.puttyPrimerCost, maximum);
    setChartBar('chart-labour-bar', estimate.labourCost, maximum);
}

// Reads current form values, calculates the estimate, and updates the panel.
function updateEstimate() {
    const isCustom = homeTypeInput.value === 'custom';
    const includeDesign = document.getElementById('include-design').checked;
    customAreaField.hidden = !isCustom;
    customCeilingField.hidden = !(isCustom && includeCeilingInput.checked);
    document.getElementById('design-fields').hidden = !includeDesign;
    renderQualityOptions();

    let homeType = 'bhk';
    let bhk = Number(homeTypeInput.value.replace('bhk-', ''));

    if (isCustom) {
        homeType = 'custom';
        bhk = null;
    }

    let designArea = 0;

    if (includeDesign) {
        designArea = document.getElementById('design-area').value;
    }

    const inputs = {
        homeType: homeType,
        bhk: bhk,
        customWallArea: document.getElementById('custom-wall-area').value,
        paintingType: getPaintingType(),
        quality: getSelectedQuality(),
        includeCeiling: includeCeilingInput.checked,
        customCeilingArea: document.getElementById('custom-ceiling-area').value,
        includeDesign: includeDesign,
        designArea: designArea,
        designDescription: document.getElementById('design-description').value,
        openings: readOpenings(),
        colours: {
            main: {
                name: selectedMainColour.name,
                hex: selectedMainColour.hex
            },
            accents: readAccentColours()
        }
    };

    try {
        const estimate = window.calculateEstimate(inputs, window.DEFAULT_ESTIMATE_SETTINGS);
        currentEstimateInputs = inputs;
        currentEstimateResult = estimate;
        estimateError.hidden = true;
        document.getElementById('save-estimate').disabled = false;
        document.getElementById('book-estimate').disabled = false;
        document.getElementById('paint-cost').textContent = formatRupees(estimate.paintCost);
        document.getElementById('putty-cost').textContent = formatRupees(estimate.puttyPrimerCost);
        document.getElementById('labour-cost').textContent = formatRupees(estimate.labourCost);
        document.getElementById('design-cost').textContent = formatRupees(estimate.designCost);
        document.getElementById('design-cost-row').hidden = estimate.designCost === 0;
        document.getElementById('extra-colour-cost').textContent = formatRupees(estimate.extraColourCost);
        document.getElementById('extra-colour-cost-row').hidden = estimate.extraColourCost === 0;
        document.getElementById('estimate-total').textContent = formatRupees(estimate.total);
        renderCostChart(estimate);
        renderCalculationDetails(estimate);
    } catch (error) {
        currentEstimateInputs = null;
        currentEstimateResult = null;
        document.getElementById('save-estimate').disabled = true;
        document.getElementById('book-estimate').disabled = true;
        estimateError.textContent = error.message;
        estimateError.hidden = false;
        document.getElementById('paint-cost').textContent = '—';
        document.getElementById('putty-cost').textContent = '—';
        document.getElementById('labour-cost').textContent = '—';
        document.getElementById('design-cost-row').hidden = true;
        document.getElementById('extra-colour-cost-row').hidden = true;
        document.getElementById('estimate-total').textContent = '—';
        document.getElementById('chart-paint-amount').textContent = '—';
        document.getElementById('chart-putty-amount').textContent = '—';
        document.getElementById('chart-labour-amount').textContent = '—';
        setChartBar('chart-paint-bar', 0, 0);
        setChartBar('chart-putty-bar', 0, 0);
        setChartBar('chart-labour-bar', 0, 0);
        estimateDetails.innerHTML = '';
        defaultOpeningsNote.hidden = true;
    }
}

// Shows the selected colour on the preview and updates saved estimate data.
function renderMainColour() {
    document.getElementById('room-wall').style.backgroundColor = selectedMainColour.hex;
    document.getElementById('main-colour-name').textContent = selectedMainColour.name + ' · ' + selectedMainColour.hex;
    document.getElementById('custom-main-colour').value = selectedMainColour.hex;
    updateEstimate();
}

// Loads the local starter palette and keeps a custom colour option available.
async function loadColourPalette() {
    const paletteSelect = document.getElementById('main-colour');

    try {
        const response = await fetch('/data/colours.json');

        if (!response.ok) {
            throw new Error('Palette file could not be loaded.');
        }

        colourPalette = await response.json();
        paletteSelect.innerHTML = '';

        for (let index = 0; index < colourPalette.length; index += 1) {
            const option = document.createElement('option');
            option.value = colourPalette[index].hex;
            option.textContent = colourPalette[index].name + ' · ' + colourPalette[index].group;
            paletteSelect.appendChild(option);
        }

        const customOption = document.createElement('option');
        customOption.value = 'custom';
        customOption.textContent = 'Custom colour';
        paletteSelect.appendChild(customOption);
        paletteSelect.value = 'custom';

        for (let index = 0; index < colourPalette.length; index += 1) {
            if (colourPalette[index].hex.toLowerCase() === selectedMainColour.hex.toLowerCase()) {
                paletteSelect.value = colourPalette[index].hex;
            }
        }

        renderMainColour();
    } catch (error) {
        const note = document.getElementById('colour-api-note');
        note.textContent = 'The starter palette could not be loaded. You can still choose a custom colour.';
        note.hidden = false;
    }
}

// Finds a starter-palette name for a selected hex value or returns Custom colour.
function findPaletteName(hex) {
    for (let index = 0; index < colourPalette.length; index += 1) {
        if (colourPalette[index].hex.toLowerCase() === hex.toLowerCase()) {
            return colourPalette[index].name;
        }
    }

    return 'Custom colour';
}

// Reads each accent colour and its paint area from the form.
function readAccentColours() {
    const rows = document.querySelectorAll('.accent-row');
    const accents = [];

    for (let index = 0; index < rows.length; index += 1) {
        const colourInput = rows[index].querySelector('input[type="color"]');
        const areaInput = rows[index].querySelector('input[type="number"]');
        accents.push({
            name: findPaletteName(colourInput.value.toUpperCase()),
            hex: colourInput.value.toUpperCase(),
            area: areaInput.value
        });
    }

    return accents;
}

// Adds one removable accent colour row with a paint-area input.
function addAccentRow(savedAccent) {
    const accentList = document.getElementById('accent-list');

    if (accentList.children.length >= 3) {
        return;
    }

    const row = document.createElement('div');
    row.className = 'accent-row';
    const colourField = document.createElement('div');
    colourField.className = 'accent-colour-field';
    const colourLabel = document.createElement('label');
    colourLabel.textContent = 'Accent colour';
    const colourInput = document.createElement('input');
    colourInput.type = 'color';
    colourInput.value = '#DF7864';

    if (savedAccent && savedAccent.hex) {
        colourInput.value = savedAccent.hex;
    }

    const colourName = document.createElement('span');
    colourName.className = 'accent-colour-name';
    colourName.textContent = findPaletteName(colourInput.value.toUpperCase());
    colourField.appendChild(colourLabel);
    colourField.appendChild(colourInput);
    colourField.appendChild(colourName);

    const areaField = document.createElement('div');
    areaField.className = 'accent-area-field';
    const areaLabel = document.createElement('label');
    areaLabel.textContent = 'Area (sq ft)';
    const areaInput = document.createElement('input');
    areaInput.type = 'number';
    areaInput.min = '1';
    areaInput.step = '1';
    areaInput.inputMode = 'decimal';
    areaInput.setAttribute('aria-label', 'Accent area in square feet');

    if (savedAccent && typeof savedAccent.area !== 'undefined') {
        areaInput.value = savedAccent.area;
    }

    areaField.appendChild(areaLabel);
    areaField.appendChild(areaInput);

    const removeButton = document.createElement('button');
    removeButton.className = 'remove-opening';
    removeButton.type = 'button';
    removeButton.textContent = '×';
    removeButton.setAttribute('aria-label', 'Remove accent colour');

    colourInput.addEventListener('input', function () {
        colourName.textContent = findPaletteName(colourInput.value.toUpperCase());
        updateEstimate();
    });
    areaInput.addEventListener('input', updateEstimate);
    removeButton.addEventListener('click', function () {
        row.remove();
        document.getElementById('add-accent').disabled = false;
        updateEstimate();
    });

    row.appendChild(colourField);
    row.appendChild(areaField);
    row.appendChild(removeButton);
    accentList.appendChild(row);
    document.getElementById('add-accent').disabled = accentList.children.length >= 3;
    updateEstimate();
}

// Names the selected colour using The Color API with a short timeout.
async function nameSelectedColour() {
    const note = document.getElementById('colour-api-note');
    const controller = new AbortController();
    const timeout = window.setTimeout(function () {
        controller.abort();
    }, 4000);

    try {
        const hex = selectedMainColour.hex.slice(1);
        const response = await fetch('https://www.thecolorapi.com/id?hex=' + encodeURIComponent(hex), {
            signal: controller.signal
        });

        if (!response.ok) {
            throw new Error('Colour service is unavailable.');
        }

        const result = await response.json();
        selectedMainColour.name = result.name.value;
        note.hidden = true;
        renderMainColour();
    } catch (error) {
        note.textContent = 'Colour naming is unavailable right now. Your colour selection and estimate still work.';
        note.hidden = false;
    } finally {
        window.clearTimeout(timeout);
    }
}

// Finds matching colours with the selected documented scheme mode.
async function findMatchingColours() {
    const note = document.getElementById('colour-api-note');
    const matches = document.getElementById('matching-colours');
    const mode = document.getElementById('scheme-mode').value;
    const controller = new AbortController();
    const timeout = window.setTimeout(function () {
        controller.abort();
    }, 4000);

    try {
        const hex = selectedMainColour.hex.slice(1);
        const url = 'https://www.thecolorapi.com/scheme?hex=' + encodeURIComponent(hex)
            + '&mode=' + encodeURIComponent(mode) + '&count=4';
        const response = await fetch(url, { signal: controller.signal });

        if (!response.ok) {
            throw new Error('Colour service is unavailable.');
        }

        const result = await response.json();
        matches.innerHTML = '';

        for (let index = 0; index < result.colors.length; index += 1) {
            const colour = result.colors[index];
            const item = document.createElement('div');
            item.className = 'matching-colour';
            const swatch = document.createElement('span');
            swatch.className = 'matching-swatch';
            swatch.style.backgroundColor = colour.hex.value;
            const label = document.createElement('span');
            label.textContent = colour.name.value + ' ' + colour.hex.value;
            item.appendChild(swatch);
            item.appendChild(label);
            matches.appendChild(item);
        }

        note.hidden = true;
    } catch (error) {
        note.textContent = 'Matching colours are unavailable right now. Your selected colour and estimate still work.';
        note.hidden = false;
    } finally {
        window.clearTimeout(timeout);
    }
}

// Loads current rates from the server while retaining bundled defaults offline.
async function loadCurrentSettings() {
    try {
        const response = await fetch('/api/settings');

        if (!response.ok) {
            return;
        }

        const settings = await response.json();

        if (settings.qualities) {
            window.DEFAULT_ESTIMATE_SETTINGS = settings;
            updateEstimate();
        }
    } catch (error) {
        return;
    }
}

// Saves the current estimate using the server's recalculated total.
async function saveCurrentEstimate() {
    if (!currentEstimateInputs || !currentEstimateResult) {
        return;
    }

    const button = document.getElementById('save-estimate');
    const message = document.getElementById('save-status');
    const token = window.localStorage.getItem('token');
    button.disabled = true;
    message.textContent = 'Saving estimate…';
    message.hidden = false;

    try {
        const response = await fetch('/api/estimates', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: 'Bearer ' + token
            },
            body: JSON.stringify({
                inputs: currentEstimateInputs,
                breakdown: currentEstimateResult
            })
        });
        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || 'Could not save this estimate.');
        }

        message.textContent = 'Estimate saved. Open My Estimates to view it.';
    } catch (error) {
        message.textContent = error.message || 'Could not connect to save this estimate.';
    } finally {
        button.disabled = false;
    }
}

// Sends the current estimate details to the booking form.
function prepareCurrentBooking() {
    if (!currentEstimateInputs || !currentEstimateResult) {
        return;
    }

    window.sessionStorage.setItem('currentEstimateToBook', JSON.stringify({
        inputs: currentEstimateInputs,
        breakdown: currentEstimateResult
    }));
    window.location.href = '/book.html';
}

// Restores a saved estimate selected from the history page.
function restoreSavedEstimate() {
    const savedEstimate = window.sessionStorage.getItem('savedEstimateToLoad');

    if (!savedEstimate) {
        return;
    }

    try {
        const estimate = JSON.parse(savedEstimate);
        const inputs = estimate.inputs;
        if (inputs.homeType === 'custom') {
            homeTypeInput.value = 'custom';
        } else {
            homeTypeInput.value = 'bhk-' + inputs.bhk;
        }
        document.getElementById('custom-wall-area').value = inputs.customWallArea || '';
        document.querySelector('input[name="paintingType"][value="' + inputs.paintingType + '"]').checked = true;
        includeCeilingInput.checked = inputs.includeCeiling === true;
        document.getElementById('custom-ceiling-area').value = inputs.customCeilingArea || '';
        document.getElementById('include-design').checked = inputs.includeDesign === true;
        document.getElementById('design-area').value = inputs.designArea || '';
        document.getElementById('design-description').value = inputs.designDescription || '';

        if (inputs.colours && inputs.colours.main) {
            selectedMainColour = {
                name: inputs.colours.main.name,
                hex: inputs.colours.main.hex
            };
        }

        const accentList = document.getElementById('accent-list');
        accentList.innerHTML = '';

        if (inputs.colours && Array.isArray(inputs.colours.accents)) {
            for (let index = 0; index < inputs.colours.accents.length; index += 1) {
                addAccentRow(inputs.colours.accents[index]);
            }
        }

        openingList.innerHTML = '';

        for (let index = 0; index < inputs.openings.length; index += 1) {
            addOpeningRow();
            const row = openingList.lastElementChild;
            row.querySelector('select').value = inputs.openings[index].kind;
            const fields = row.querySelectorAll('input');
            fields[0].value = inputs.openings[index].width;
            fields[1].value = inputs.openings[index].height;
        }

        const qualityInput = document.querySelector('input[name="quality"][value="' + inputs.quality + '"]');

        if (qualityInput) {
            qualityInput.checked = true;
        }

        window.sessionStorage.removeItem('savedEstimateToLoad');
    } catch (error) {
        window.sessionStorage.removeItem('savedEstimateToLoad');
    }
}

// Connects form events and shows the initial estimate.
function startEstimator() {
    const token = window.localStorage.getItem('token');
    const resultPanel = document.querySelector('.result-panel');

    if (!token) {
        estimatorForm.hidden = true;
        loginRequired.hidden = false;
        resultPanel.hidden = true;
        return;
    }

    resultPanel.hidden = false;
    document.getElementById('account-link').hidden = true;
    document.getElementById('logout-button').hidden = false;
    estimatorForm.addEventListener('input', updateEstimate);
    estimatorForm.addEventListener('change', updateEstimate);
    document.getElementById('add-opening').addEventListener('click', addOpeningRow);
    document.getElementById('add-accent').addEventListener('click', function () {
        addAccentRow();
    });
    document.getElementById('print-estimate').addEventListener('click', function () {
        window.print();
    });
    document.getElementById('save-estimate').addEventListener('click', saveCurrentEstimate);
    document.getElementById('book-estimate').addEventListener('click', prepareCurrentBooking);
    document.getElementById('main-colour').addEventListener('change', function (event) {
        const selectedHex = event.target.value;

        if (selectedHex !== 'custom') {
            selectedMainColour.hex = selectedHex;
            selectedMainColour.name = findPaletteName(selectedHex);
            renderMainColour();
        }
    });
    document.getElementById('custom-main-colour').addEventListener('input', function (event) {
        selectedMainColour.hex = event.target.value.toUpperCase();
        selectedMainColour.name = findPaletteName(selectedMainColour.hex);
        document.getElementById('main-colour').value = 'custom';
        renderMainColour();
    });
    document.getElementById('name-colour').addEventListener('click', nameSelectedColour);
    document.getElementById('find-schemes').addEventListener('click', findMatchingColours);
    document.getElementById('logout-button').addEventListener('click', function () {
        window.localStorage.removeItem('token');
        window.localStorage.removeItem('user');
        window.location.reload();
    });

    openingList.addEventListener('click', function (event) {
        if (event.target.classList.contains('remove-opening')) {
            event.target.closest('.opening-row').remove();
            updateEstimate();
        }
    });

    document.getElementById('history-link').hidden = false;
    document.getElementById('bookings-link').hidden = false;
    restoreSavedEstimate();
    updateEstimate();
    loadCurrentSettings();
    loadColourPalette();
}

startEstimator();