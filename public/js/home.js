// Shows the administrator shortcut only for a signed-in admin account.
const storedToken = window.localStorage.getItem('token');
const storedAccount = window.localStorage.getItem('user');

if (storedToken && storedAccount) {
    try {
        const account = JSON.parse(storedAccount);

        if (account.role === 'admin') {
            document.getElementById('admin-dashboard-link').hidden = false;
        }
    } catch (error) {
        window.localStorage.removeItem('user');
    }
}