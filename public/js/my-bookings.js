// Loads customer bookings and offers cancellation for pending requests.
const bookingList = document.getElementById('booking-list');
const bookingsMessage = document.getElementById('bookings-message');
const bookingCurrency = new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: 0
});

// Shows a status message above the booking list.
function showBookingsMessage(message) {
    bookingsMessage.textContent = message;
    bookingsMessage.hidden = false;
}

// Sends a customer request with the stored sign-in token.
async function sendBookingRequest(path, method, body) {
    const options = {
        method: method,
        headers: {
            Authorization: 'Bearer ' + window.localStorage.getItem('token')
        }
    };

    if (body !== undefined) {
        options.headers['Content-Type'] = 'application/json';
        options.body = JSON.stringify(body);
    }

    const response = await fetch(path, options);
    const result = await response.json();

    if (!response.ok) {
        throw new Error(result.message || 'Could not load your bookings.');
    }

    return result;
}

// Shows a submitted review without allowing it to be edited again.
function createReviewSummary(review) {
    const summary = document.createElement('div');
    summary.className = 'booking-review-summary';

    const rating = document.createElement('p');
    rating.className = 'booking-review-rating';
    rating.textContent = 'Your rating: ' + review.rating + ' / 5 stars';
    summary.appendChild(rating);

    const experience = document.createElement('p');
    experience.className = 'booking-review-experience';
    experience.textContent = review.experience || 'No written experience shared.';
    summary.appendChild(experience);

    return summary;
}

// Builds the rating form or saved review for a completed booking.
function createReviewSection(booking) {
    const section = document.createElement('section');
    section.className = 'booking-review';

    const heading = document.createElement('h3');
    heading.textContent = booking.review ? 'Your experience' : 'How was the painting service?';
    section.appendChild(heading);

    if (booking.review) {
        section.appendChild(createReviewSummary(booking.review));
        return section;
    }

    const form = document.createElement('form');
    form.className = 'booking-review-form';

    const ratingField = document.createElement('fieldset');
    ratingField.className = 'review-rating';
    const legend = document.createElement('legend');
    legend.textContent = 'Your rating';
    ratingField.appendChild(legend);

    const stars = document.createElement('div');
    stars.className = 'review-stars';
    const ratingInputs = [];

    for (let value = 1; value <= 5; value += 1) {
        const label = document.createElement('label');
        label.className = 'review-star';
        const input = document.createElement('input');
        input.type = 'radio';
        input.name = 'rating';
        input.value = String(value);
        input.required = true;
        input.setAttribute('aria-label', value + (value === 1 ? ' star' : ' stars'));
        input.addEventListener('change', function () {
            stars.dataset.rating = String(value);
        });

        const star = document.createElement('span');
        star.textContent = '★';
        star.setAttribute('aria-hidden', 'true');
        label.appendChild(input);
        label.appendChild(star);
        stars.appendChild(label);
        ratingInputs.push(input);
    }

    ratingField.appendChild(stars);
    form.appendChild(ratingField);

    const experienceLabel = document.createElement('label');
    experienceLabel.className = 'field-label';
    experienceLabel.textContent = 'Share your experience (optional)';
    const experience = document.createElement('textarea');
    experience.maxLength = 1000;
    experience.rows = 4;
    experienceLabel.appendChild(experience);
    form.appendChild(experienceLabel);

    const feedback = document.createElement('p');
    feedback.className = 'review-feedback';
    feedback.setAttribute('role', 'status');
    feedback.hidden = true;
    form.appendChild(feedback);

    const submitButton = document.createElement('button');
    submitButton.className = 'button button-primary';
    submitButton.type = 'submit';
    submitButton.textContent = 'Submit review';
    form.appendChild(submitButton);

    form.addEventListener('submit', async function (event) {
        event.preventDefault();
        const selectedRating = ratingInputs.find(function (input) { return input.checked; });

        if (!selectedRating) {
            feedback.textContent = 'Choose a star rating before submitting.';
            feedback.hidden = false;
            return;
        }

        submitButton.disabled = true;
        feedback.hidden = true;

        try {
            const result = await sendBookingRequest('/api/bookings/' + encodeURIComponent(booking._id) + '/review', 'POST', {
                rating: Number(selectedRating.value),
                experience: experience.value
            });
            section.removeChild(form);
            section.appendChild(createReviewSummary(result.booking.review));
            heading.textContent = 'Your experience';
        } catch (error) {
            submitButton.disabled = false;
            feedback.textContent = error.message || 'Could not save your review. Please try again.';
            feedback.hidden = false;
        }
    });

    section.appendChild(form);
    return section;
}

// Builds a booking row with its status and allowed actions.
function createBookingItem(booking) {
    const item = document.createElement('article');
    item.className = 'saved-estimate';

    const heading = document.createElement('div');
    heading.className = 'saved-estimate-heading';
    const title = document.createElement('h2');
    title.textContent = 'Painting service · ' + new Date(booking.preferredStartDate).toLocaleDateString('en-IN');
    const total = document.createElement('strong');
    total.textContent = '₹' + bookingCurrency.format(booking.estimateSnapshot.breakdown.total);
    heading.appendChild(title);
    heading.appendChild(total);

    const details = document.createElement('p');
    details.textContent = booking.address.line + ', ' + booking.address.city + ' ' + booking.address.pincode;

    const status = document.createElement('p');
    status.className = 'booking-status';
    status.textContent = 'Status: ' + booking.status;

    item.appendChild(heading);
    item.appendChild(details);
    item.appendChild(status);

    if (booking.status === 'pending') {
        const cancelButton = document.createElement('button');
        cancelButton.className = 'button button-secondary';
        cancelButton.type = 'button';
        cancelButton.textContent = 'Cancel booking';
        cancelButton.addEventListener('click', async function () {
            cancelButton.disabled = true;

            try {
                const result = await sendBookingRequest('/api/bookings/' + encodeURIComponent(booking._id) + '/cancel', 'PATCH');
                status.textContent = 'Status: ' + result.booking.status;
                cancelButton.remove();
            } catch (error) {
                cancelButton.disabled = false;
                showBookingsMessage(error.message);
            }
        });

        item.appendChild(cancelButton);
    }

    if (booking.status === 'completed') {
        item.appendChild(createReviewSection(booking));
    }

    return item;
}

// Loads only the signed-in customer's bookings.
async function loadCustomerBookings() {
    if (!window.localStorage.getItem('token')) {
        window.location.href = '/login.html';
        return;
    }

    try {
        const result = await sendBookingRequest('/api/bookings/mine', 'GET');

        if (result.bookings.length === 0) {
            showBookingsMessage('You have no bookings yet.');
            return;
        }

        bookingsMessage.hidden = true;

        for (let index = 0; index < result.bookings.length; index += 1) {
            bookingList.appendChild(createBookingItem(result.bookings[index]));
        }
    } catch (error) {
        showBookingsMessage(error.message || 'Could not load bookings. Check your connection and try again.');
    }
}

// Clears the login token and returns to the home page.
function signOutCustomer() {
    window.localStorage.removeItem('token');
    window.localStorage.removeItem('user');
    window.location.href = '/';
}

document.getElementById('bookings-logout').addEventListener('click', signOutCustomer);
loadCustomerBookings();