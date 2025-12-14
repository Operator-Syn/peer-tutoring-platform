import { useNavigate } from 'react-router-dom';

let cachedBackendUrl = null;

/**
 * Custom React hook for checking user login status.
 *
 * @param {Object} options - Options for login check.
 * @param {boolean} [options.login=true] - If true, redirects to login page when user is not authenticated. If false, does not redirect.
 * @param {string|null} [options.route=null] - If provided, navigates to this route after successful authentication. If null, no navigation occurs.
 * @returns {Function} loginCheck - Async function to check login status and handle authentication flow.
 */
export function useLoginCheck({ login = true, route = null } = {}) {
    const navigate = useNavigate();

    // Fetch backend URL from Flask only once
    const loadConfig = async () => {
        if (!cachedBackendUrl) {
            const res = await fetch('/api/config');
            const config = await res.json();
            cachedBackendUrl = config.VITE_API_BASE_URL;
        }
        return cachedBackendUrl;
    };

    return async function loginCheck() {
        const backendUrl = await loadConfig();

        const res = await fetch(`/api/auth/get_user`, { credentials: 'include' });
        const user = await res.json();

        if (res.ok) {
            if (!user.registered_tutee) {
                navigate('/AccountCreation');
            } else if (route) {
                navigate(route);
            }
            return user;
        } else {
            if (login) {
                window.location.href = `/api/auth/login`;
            }
        }
    };
}