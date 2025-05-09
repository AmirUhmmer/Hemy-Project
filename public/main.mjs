// ENABLE TOP CODE TO VIEW THE SIDEBAR MAIN.MJS, AUTH/TOKEN, AUTH/PROFILE


import { initViewer, loadModel } from './viewer.mjs';
import { initTree } from './sidebar.mjs';

const login = document.getElementById('login');

// Function to fetch access token using Client Credentials from your server
export async function fetchAccessToken() {
    try {
        const response = await fetch('/api/auth/token');  // Fetch the token from the server-side endpoint
        if (!response.ok) {
            throw new Error('Failed to get access token');
        }
        const data = await response.json();
        localStorage.setItem('authToken', data.access_token);
        localStorage.setItem('refreshToken', data.refresh_token);
        localStorage.setItem('expires_at', Date.now() + data.expires_in * 1000); // Store expiry time in milliseconds
        localStorage.setItem('internal_token', data.internal_token);

        return data.access_token;  // Return the access token
    } catch (error) {
        console.error('Error fetching access token:', error);
        throw error;
    }
}

// Function to check if the token is still valid
function isTokenExpired() {
    const expires_at = localStorage.getItem('expires_at');
    return !expires_at || Date.now() >= parseInt(expires_at, 10);
}

async function initApp() {
    try {
        let authToken = localStorage.getItem('authToken');
        let refreshToken = localStorage.getItem('refreshToken');
        let expires_at = localStorage.getItem('expires_at');
        let internal_token = localStorage.getItem('internal_token');

        // console.log(authToken);
        // console.log(refreshToken);
        // console.log(expires_at);
        // console.log(internal_token);

        // If the token is expired or not present, fetch a new one
        if (!authToken || isTokenExpired()) {
            console.log('Fetching new access token...');
            authToken = await fetchAccessToken();  // Get a new token if expired
        }

        // Fetch user profile using the access token
        const resp = await fetch('/api/auth/profile', {
            headers: {
                'Authorization': `Bearer ${authToken}`,  // Send authToken in the Authorization header
                'x-refresh-token': refreshToken,         // Send refreshToken in a custom header
                'x-expires-at': expires_at,              // Send expires_at in a custom header
                'x-internal-token': internal_token       // Send internal_token in a custom header
            }
        });

        if (resp.ok) {
            const user = await resp.json();
            login.innerText = `Logout`;
            login.style.visibility = 'hidden'; //test
            login.onclick = () => {
                // Logout logic
                localStorage.removeItem('authToken');
                localStorage.removeItem('refreshToken');
                localStorage.removeItem('expires_at');
                localStorage.removeItem('internal_token');
                window.location.reload();  // Reload the page after logout
            };
            let hubId = 'b.7a656dca-000a-494b-9333-d9012c464554';  // Hub ID

            const viewer = await initViewer(document.getElementById('preview'));
            initTree('#tree', (id) => loadModel(viewer, window.btoa(id).replace(/=/g, '')));
            }
    } catch (err) {
        alert('Could not initialize the application. See console for more details.');
        console.error(err);
    }
}

// Initialize the app
initApp();