// Sends account forms to the API and stores successful login tokens.

// Shows an API error or a friendly fallback in the selected message area.
function showAuthError(element, message) {
    element.textContent = message;
    element.hidden = false;
}

// Sends account details as JSON and returns the server response.
async function sendAccountRequest(path, values) {
    const response = await fetch(path, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(values)
    });

    const result = await response.json();

    if (!response.ok) {
        throw new Error(result.message || 'Please check your details and try again.');
    }

    return result;
}

// Saves the token and sends a signed-in customer to the estimator.
function finishSignIn(result) {
    window.localStorage.setItem('token', result.token);
    window.localStorage.setItem('user', JSON.stringify(result.user));

    if (result.user.role === 'admin') {
        window.location.href = '/admin.html';
    } else {
        window.location.href = '/estimator.html';
    }
}

// Connects the sign-in form to the login API.
function startLoginForm() {
    const form = document.getElementById('login-form');

    if (!form) {
        return;
    }

    form.addEventListener('submit', async function (event) {
        event.preventDefault();
        const errorMessage = document.getElementById('login-error');
        errorMessage.hidden = true;

        const values = {
            email: document.getElementById('login-email').value,
            password: document.getElementById('login-password').value
        };

        try {
            const result = await sendAccountRequest('/api/auth/login', values);
            finishSignIn(result);
        } catch (error) {
            showAuthError(errorMessage, error.message || 'Could not sign in. Check your connection and try again.');
        }
    });
}

// Connects the registration form to the customer registration API.
function startRegistrationForm() {
    const form = document.getElementById('register-form');

    if (!form) {
        return;
    }

    form.addEventListener('submit', async function (event) {
        event.preventDefault();
        const errorMessage = document.getElementById('register-error');
        errorMessage.hidden = true;

        const values = {
            name: document.getElementById('register-name').value,
            email: document.getElementById('register-email').value,
            phone: document.getElementById('register-phone').value,
            password: document.getElementById('register-password').value
        };

        try {
            const result = await sendAccountRequest('/api/auth/register', values);
            finishSignIn(result);
        } catch (error) {
            showAuthError(errorMessage, error.message || 'Could not create your account. Check your connection and try again.');
        }
    });
}

startLoginForm();
startRegistrationForm();