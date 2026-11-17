// Verifies login tokens and protects customer and administrator routes.
const jwt = require('jsonwebtoken');

// Requires a valid bearer token and attaches its safe account details.
function requireAuth(request, response, next) {
    const authorization = request.get('Authorization');

    if (!authorization || !authorization.startsWith('Bearer ')) {
        return response.status(401).json({ message: 'Please sign in to continue.' });
    }

    if (!process.env.JWT_SECRET) {
        return response.status(503).json({ message: 'Sign-in is not configured yet.' });
    }

    const token = authorization.slice(7);

    try {
        const account = jwt.verify(token, process.env.JWT_SECRET);
        request.account = {
            id: account.id,
            role: account.role
        };
        return next();
    } catch (error) {
        return response.status(401).json({ message: 'Your sign-in has expired. Please sign in again.' });
    }
}

// Allows signed-in customers and rejects administrators from customer routes.
function requireCustomer(request, response, next) {
    if (request.account.role !== 'customer') {
        return response.status(403).json({ message: 'This page is for customer accounts.' });
    }

    return next();
}

// Allows only administrator accounts to continue.
function requireAdmin(request, response, next) {
    if (request.account.role !== 'admin') {
        return response.status(403).json({ message: 'Administrator access is required.' });
    }

    return next();
}

module.exports = {
    requireAuth: requireAuth,
    requireCustomer: requireCustomer,
    requireAdmin: requireAdmin
};