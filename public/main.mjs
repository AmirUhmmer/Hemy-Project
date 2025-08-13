import { initViewer, loadModel } from './viewer.mjs';
import { renderFileTable, renderCustomTree, initTree } from './sidebar.mjs';

const login = document.getElementById('login');

async function initApp() {
    const authToken = localStorage.getItem('authToken');
    const expiresAt = localStorage.getItem('expires_at');

    // Check if token exists and is still valid
    if (authToken && expiresAt && new Date().getTime() < parseInt(expiresAt)) {
        console.log("✅ Using stored token");
        console.log("🔑 Auth Token:", authToken);
        await startApp();
        return;
    }

    // Try server-side session check
    try {
        const resp = await fetch("/api/auth/profile", {
            method: "GET",
            credentials: "include"
        });

        if (resp.ok) {
            const user = await resp.json();
            login.innerText = `Logout (${user.name})`;
            login.onclick = () => window.location.replace("/api/auth/logout");
            login.style.visibility = 'visible';

            await startApp();
        } else if (resp.status === 401) {
            // Start login flow
            const loginWindow = window.open("/api/auth/login", "Login", "width=600,height=600");

            window.addEventListener("message", async (event) => {
                if (event.origin !== window.location.origin) return;

                console.log("🔑 Received login token:", event.data);

                localStorage.setItem('authToken', event.data.token);
                localStorage.setItem('refreshToken', event.data.refreshToken);
                localStorage.setItem('expires_at', event.data.expires_at);
                localStorage.setItem('internal_token', event.data.internal_token);

                await startApp();
            });
        } else {
            throw new Error(`Unexpected status: ${resp.status}`);
        }
    } catch (err) {
        alert("Could not initialize the application. See console for more details.");
        console.error(err);
    }
}

// async function startApp() {
//     const viewer = await initViewer(document.getElementById("preview"));
//     // initTree('#tree', (id) => loadModel(viewer, window.btoa(id).replace(/=/g, '')));
//     initTree('#tree', (version, item, project) => {

//         // 🔐 Store in localStorage for later use in issue creation
//         window.lineageUrn = item; // `item` is the lineage URN

//         // console.log("🔑 Selected version:", window.lineageUrn);

//         // 👇 Load the model as before
//         loadModel(viewer, window.btoa(version).replace(/=/g, '').replace(/\//g, '_'));
//     });

// }



async function startApp() {
  const viewer = await initViewer(document.getElementById("preview"));
  renderCustomTree((versionId) => {
    // 👇 If you're still using base64 for loading models
    const encodedUrn = window.btoa(versionId).replace(/=/g, '');
    // console.log("URN: ", encodedUrn);
    document.getElementById('preview').classList.add('active');
    loadModel(viewer, encodedUrn);
  });
}

initApp();
