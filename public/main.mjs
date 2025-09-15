import { initViewer, loadModel } from './viewer.mjs';
import { renderFileTable, renderCustomTree, initTree } from './sidebar.mjs';

const login = document.getElementById('login');

// async function initApp() {
//     const authToken = localStorage.getItem('authToken');
//     const expiresAt = localStorage.getItem('expires_at');
//     //localStorage.setItem('expiresAt', Date.now() - 10000); // expired 10s ago simulation
//     // Check if token exists and is still valid
//     // ✅ 1. Still valid → just use it
//     if (authToken && expiresAt && Date.now() < expiresAt - 60_000) { // 1 min buffer
//         console.log("✅ Using stored token");
//         console.log("🔑 Auth Token:", authToken);
//         // localStorage.setItem('expires_at', Date.now() - 10000); // expired 10s ago simulation
//         await startApp();
//         return;
//     }

//     // ⏳ 2. Expired → try refresh
//     if (authToken && expiresAt && Date.now() >= expiresAt - 60_000) {
//         console.log("⏳ Token expired, refreshing...");
//         try {
//             const resp = await fetch("/api/auth/refresh", {
//                 method: "POST",
//                 credentials: "include",
//                 headers: {
//                     "x-refresh-token": localStorage.getItem("refreshToken"),
//                     "x-expires-at": localStorage.getItem("expires_at"),
//                     "x-internal-token": localStorage.getItem("internal_token")
//                 }
//             });

//             if (!resp.ok) throw new Error("Refresh failed");

//             const data = await resp.json();

//             // Save new tokens
//             localStorage.setItem("access_token", data.access_token);
//             localStorage.setItem("refreshToken", data.refresh_token);

//             // expires_in is in seconds → calculate absolute expiry time (ms)
//             const expiresAt = Date.now() + data.expires_in * 1000;
//             localStorage.setItem("expires_at", expiresAt.toString());

//             console.log("🔄 Token refreshed");
//             console.log("🔑 Access Token:", data.access_token);
            
//             await startApp();
//             return;
//         } catch (err) {
//             console.error("❌ Refresh error:", err);
//             // Fall back to login
//         }
//     }

//     // Try server-side session check
//     try {
//         const resp = await fetch("/api/auth/profile", {
//             method: "GET",
//             credentials: "include"
//         });

//         if (resp.ok) {
//             const user = await resp.json();
//             login.innerText = `Logout (${user.name})`;
//             login.onclick = () => window.location.replace("/api/auth/logout");
//             login.style.visibility = 'visible';

//             await startApp();
//         } else if (resp.status === 401) {
//             // Start login flow
//             const loginWindow = window.open("/api/auth/login", "Login", "width=600,height=600");

//             window.addEventListener("message", async (event) => {
//                 if (event.origin !== window.location.origin) return;

//                 console.log("🔑 Received login token:", event.data);

//                 localStorage.setItem('authToken', event.data.token);
//                 localStorage.setItem('refreshToken', event.data.refreshToken);
//                 localStorage.setItem('expires_at', event.data.expires_at);
//                 localStorage.setItem('internal_token', event.data.internal_token);

//                 await startApp();
//             });
//         } else {
//             throw new Error(`Unexpected status: ${resp.status}`);
//         }
//     } catch (err) {
//         alert("Could not initialize the application. See console for more details.");
//         console.error(err);
//     }
// }

function saveTokens(data) {
  // match backend field names
  const access = data.token || data.access_token;       // prefer "access_token" if present, fallback to "token"
  const refresh = data.refreshToken || data.refresh_token;
  const internal = data.internal_token;
  
  // handle expiresAt
  let expiresAt = data.expires_at ? Number(data.expires_at) : undefined;
  if (!expiresAt && data.expires_in) {
    expiresAt = Date.now() + (data.expires_in * 1000);
  }

  if (!access || !refresh) {
    console.error("❌ saveTokens: Missing access/refresh token", data);
    return;
  }

  localStorage.setItem("authToken", access);
  localStorage.setItem("refreshToken", refresh);
  localStorage.setItem("expires_at", expiresAt.toString());
  localStorage.setItem("internal_token", internal);

  console.log("💾 Tokens saved:", {
    access_token: access.slice(0, 20) + "...",
    refresh_token: refresh.slice(0, 20) + "...",
    expires_at: new Date(expiresAt).toISOString(),
    internal_token: internal.slice(0, 20) + "..."
  });
}





export function loadTokens() {
    return {
        access_token: localStorage.getItem("authToken"),
        refresh_token: localStorage.getItem("refreshToken"),
        expires_at: parseInt(localStorage.getItem("expires_at"), 10),
        internal_token: localStorage.getItem("internal_token")
    };
}

async function initApp() {
    const { access_token, refresh_token, expires_at } = loadTokens();

    // ✅ Token still valid
    if (access_token && expires_at && Date.now() < expires_at - 60_000) {
        console.log("✅ Using stored token");
        // console.log("🔑 Access Token:", access_token);
        // console.log(" Expires at:", expires_at);
        // localStorage.setItem('expires_at', Date.now() - 10000); // expired 10s ago simulation
        await startApp();
        return;
    }

    // ⏳ Token expired → refresh
    if (access_token && refresh_token && expires_at && Date.now() >= expires_at - 60_000) {
        console.log("⏳ Token expired, refreshing...", refresh_token);
        try {
            const resp = await fetch("/api/auth/refresh", {
                method: "POST",
                credentials: "include",
                headers: { "x-refresh-token": refresh_token }
            });

            if (!resp.ok) throw new Error("Refresh failed");
            const data = await resp.json();

            saveTokens(data);   // <— overwrite with new ones
            console.log("🔄 Token refreshed");
            await startApp();
            return;
        } catch (err) {
            console.error("❌ Refresh error:", err);
        }
    }

    // ❌ No tokens → login flow
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
            const loginWindow = window.open("/api/auth/login", "Login", "width=600,height=600");

            window.addEventListener("message", async (event) => {
                if (event.origin !== window.location.origin) return;
                console.log("🔑 Received login token:", event.data);
                saveTokens(event.data); // same helper
                await startApp();
            });
        } else {
            throw new Error(`Unexpected status: ${resp.status}`);
        }
    } catch (err) {
        alert("Could not initialize the application. See console for details.");
        console.error(err);
    }
}





// for old tree

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