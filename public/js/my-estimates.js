// Loads and manages saved estimates for the signed-in customer.
const estimateList = document.getElementById('estimate-list');
const historyMessage = document.getElementById('history-message');
const historyCurrency = new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: 0
});

// Shows a simple status message above the estimate list.
function showHistoryMessage(message) {
    historyMessage.textContent = message;
    historyMessage.hidden = false;
}

// Sends a customer request with the saved login token.
async function sendHistoryRequest(path, method) {
    const token = window.localStorage.getItem('token');
    const response = await fetch(path, {
        method: method,
        headers: {
            Authorization: 'Bearer ' + token
        }
    });
    const result = await response.json();

    if (!response.ok) {
        throw new Error(result.message || 'Could not load your estimates.');
    }

    return result;
}

// Builds one saved estimate row with open and delete actions.
function createEstimateItem(estimate) {
    const item = document.createElement('article');
    item.className = 'saved-estimate';

    const heading = document.createElement('div');
    heading.className = 'saved-estimate-heading';
    const title = document.createElement('h2');
    title.textContent = estimate.inputs.homeType === 'custom'
        ? 'Custom home · ' + estimate.breakdown.paintableArea.toLocaleString('en-IN') + ' sq ft'
        : estimate.inputs.bhk + ' BHK home · ' + estimate.breakdown.paintableArea.toLocaleString('en-IN') + ' sq ft';
    const total = document.createElement('strong');
    total.textContent = '₹' + historyCurrency.format(estimate.breakdown.total);
    heading.appendChild(title);
    heading.appendChild(total);

    const summary = document.createElement('p');
    const quality = window.estimateQualityNames[estimate.inputs.quality] || estimate.inputs.quality;
    let paintingType = 'Repaint touch-up';

    if (estimate.inputs.paintingType === 'fresh') {
        paintingType = 'Fresh painting';
    }

    summary.textContent = paintingType + ' · ' + quality + ' · ' + new Date(estimate.createdAt).toLocaleDateString('en-IN');

    const actions = document.createElement('div');
    actions.className = 'saved-estimate-actions';
    const openButton = document.createElement('button');
    openButton.className = 'button button-primary';
    openButton.type = 'button';
    openButton.textContent = 'Open estimate';
    openButton.addEventListener('click', function () {
        window.sessionStorage.setItem('savedEstimateToLoad', JSON.stringify(estimate));
        window.location.href = '/estimator.html';
    });

    const deleteButton = document.createElement('button');
    deleteButton.className = 'button button-secondary';
    deleteButton.type = 'button';
    deleteButton.textContent = 'Delete';
    deleteButton.addEventListener('click', async function () {
        deleteButton.disabled = true;

        try {
            await sendHistoryRequest('/api/estimates/' + encodeURIComponent(estimate._id), 'DELETE');
            item.remove();

            if (estimateList.children.length === 0) {
                showHistoryMessage('You have no saved estimates yet.');
            }
        } catch (error) {
            deleteButton.disabled = false;
            showHistoryMessage(error.message);
        }
    });

    const bookButton = document.createElement('button');
    bookButton.className = 'button button-secondary';
    bookButton.type = 'button';
    bookButton.textContent = 'Book';
    bookButton.addEventListener('click', function () {
        window.sessionStorage.setItem('savedEstimateToBook', JSON.stringify(estimate));
        window.location.href = '/book.html';
    });

    actions.appendChild(openButton);
    actions.appendChild(bookButton);
    actions.appendChild(deleteButton);
    item.appendChild(heading);
    item.appendChild(summary);
    item.appendChild(actions);
    return item;
}

// Loads the signed-in customer's saved estimates from the API.
async function loadEstimates() {
    if (!window.localStorage.getItem('token')) {
        window.location.href = '/login.html';
        return;
    }

    try {
        const result = await sendHistoryRequest('/api/estimates/mine', 'GET');
        estimateList.innerHTML = '';

        if (result.estimates.length === 0) {
            showHistoryMessage('You have no saved estimates yet.');
            return;
        }

        historyMessage.hidden = true;

        for (let index = 0; index < result.estimates.length; index += 1) {
            estimateList.appendChild(createEstimateItem(result.estimates[index]));
        }
    } catch (error) {
        showHistoryMessage(error.message || 'Could not load your estimates. Check your connection and try again.');
    }
}

// Clears the local login token and returns to the home page.
function signOut() {
    window.localStorage.removeItem('token');
    window.localStorage.removeItem('user');
    window.location.href = '/';
}

document.getElementById('history-logout').addEventListener('click', signOut);
window.estimateQualityNames = {
    economy: 'Economy Distemper',
    premium: 'Premium Plastic Emulsion',
    luxury: 'Luxury Silk / Royal Sheen'
};
loadEstimates();