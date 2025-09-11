const { SdkManagerBuilder } = require('@aps_sdk/autodesk-sdkmanager');
const { AuthenticationClient, Scopes, ResponseType } = require('@aps_sdk/authentication');
const { DataManagementClient } = require('@aps_sdk/data-management');
const { APS_CLIENT_ID, APS_CLIENT_SECRET, APS_CALLBACK_URL } = require('../config.js');

const sdkManager = SdkManagerBuilder.create().build();
const authenticationClient = new AuthenticationClient(sdkManager);
const dataManagementClient = new DataManagementClient(sdkManager);
const service = module.exports = {};

service.getAuthorizationUrl = () => authenticationClient.authorize(APS_CLIENT_ID, ResponseType.Code, APS_CALLBACK_URL, [
    Scopes.DataRead,
    Scopes.DataWrite,
    Scopes.DataCreate,
    Scopes.BucketRead,
    Scopes.BucketCreate,
    Scopes.BucketUpdate,
    Scopes.ViewablesRead,
    Scopes.AccountRead
]);

service.authCallbackMiddleware = async (req, res, next) => {
    const internalCredentials = await authenticationClient.getThreeLeggedToken(APS_CLIENT_ID, req.query.code, APS_CALLBACK_URL, {
        clientSecret: APS_CLIENT_SECRET,
        scopes: [
            Scopes.DataRead,
            Scopes.DataWrite,
            Scopes.DataCreate,
            Scopes.BucketRead,
            Scopes.BucketCreate,
            Scopes.BucketUpdate,
            Scopes.ViewablesRead,
            Scopes.AccountRead
        ]
    });
    const publicCredentials = await authenticationClient.refreshToken(internalCredentials.refresh_token, APS_CLIENT_ID, {
        clientSecret: APS_CLIENT_SECRET,
        scopes: [
            Scopes.DataRead,
            Scopes.DataWrite,
            Scopes.DataCreate,
            Scopes.BucketRead,
            Scopes.BucketCreate,
            Scopes.BucketUpdate,
            Scopes.ViewablesRead,
            Scopes.AccountRead
        ]
    });
    req.session.public_token = publicCredentials.access_token;
    req.session.internal_token = internalCredentials.access_token;
    req.session.refresh_token = publicCredentials.refresh_token;
    req.session.expires_at = Date.now() + internalCredentials.expires_in * 1000;
    next();
};

service.authRefreshMiddleware = async (req, res, next) => {
    // const { refresh_token, expires_at } = req.session;

    const refresh_token = req.headers['x-refresh-token'];
    const expires_at = req.headers['x-expires-at'];
    const internal_token = req.headers['x-internal-token'];


    // Optionally, you can store refresh_token, expires_at, and internal_token in the session or use them directly
    req.session.refresh_token = refresh_token;  // Store or update session
    req.session.expires_at = expires_at;
    req.session.internal_token = internal_token;
    
    if (!refresh_token) {
        res.status(401).end();
        return;
    }

    if (expires_at < Date.now()) {
        const internalCredentials = await authenticationClient.refreshToken(refresh_token, APS_CLIENT_ID, {
            clientSecret: APS_CLIENT_SECRET,
            scopes: [Scopes.DataRead, Scopes.DataCreate]
        });
        const publicCredentials = await authenticationClient.refreshToken(internalCredentials.refresh_token, APS_CLIENT_ID, {
            clientSecret: APS_CLIENT_SECRET,
            scopes: [Scopes.ViewablesRead]
        });
        req.session.public_token = publicCredentials.access_token;
        req.session.internal_token = internalCredentials.access_token;
        req.session.refresh_token = publicCredentials.refresh_token;
        req.session.expires_at = Date.now() + internalCredentials.expires_in * 1000;
    }
    req.internalOAuthToken = {
        access_token: req.session.internal_token,
        expires_in: Math.round((req.session.expires_at - Date.now()) / 1000),
    };
    req.publicOAuthToken = {
        access_token: req.session.public_token,
        expires_in: Math.round((req.session.expires_at - Date.now()) / 1000),
    };
    next();
};

// service.authRefreshMiddleware = async (req, res, next) => {
//     const refresh_token = req.headers['x-refresh-token'];
//     const expires_at = parseInt(req.headers['x-expires-at'], 10);
//     const internal_token = req.headers['x-internal-token'];

//     if (!refresh_token) {
//         return res.status(401).json({ error: "No refresh token provided" });
//     }

//     // If expired, get new tokens
//     if (expires_at < Date.now()) {
//         try {
//             const internalCredentials = await authenticationClient.refreshToken(refresh_token, APS_CLIENT_ID, {
//                 clientSecret: APS_CLIENT_SECRET,
//                 scopes: [Scopes.DataRead, Scopes.DataCreate]
//             });

//             const publicCredentials = await authenticationClient.refreshToken(internalCredentials.refresh_token, APS_CLIENT_ID, {
//                 clientSecret: APS_CLIENT_SECRET,
//                 scopes: [Scopes.ViewablesRead]
//             });

//             req.session.public_token = publicCredentials.access_token;
//             req.session.internal_token = internalCredentials.access_token;
//             req.session.refresh_token = publicCredentials.refresh_token;
//             req.session.expires_at = Date.now() + internalCredentials.expires_in * 1000;

//         } catch (err) {
//             console.error("❌ Refresh failed:", err);
//             return res.status(401).json({ error: "Refresh failed" });
//         }
//     } else {
//         // still valid, reuse existing values
//         req.session.public_token = req.session.public_token || internal_token;
//         req.session.internal_token = req.session.internal_token || internal_token;
//         req.session.refresh_token = refresh_token;
//         req.session.expires_at = expires_at;
//     }

//     req.internalOAuthToken = {
//         access_token: req.session.internal_token,
//         expires_in: Math.round((req.session.expires_at - Date.now()) / 1000),
//     };
//     req.publicOAuthToken = {
//         access_token: req.session.public_token,
//         expires_in: Math.round((req.session.expires_at - Date.now()) / 1000),
//     };

//     next();
// };

service.getUserProfile = async (accessToken) => {
    const resp = await authenticationClient.getUserInfo(accessToken);
    return resp;
};

service.getHubs = async (accessToken) => {
    const resp = await dataManagementClient.getHubs(accessToken);
    return resp.data;
};

service.getProjects = async (hubId, accessToken) => {
    const resp = await dataManagementClient.getHubProjects(accessToken, hubId);
    return resp.data;
};

service.getProjectContents = async (hubId, projectId, folderId, accessToken) => {
    if (!folderId) {
        const resp = await dataManagementClient.getProjectTopFolders(accessToken, hubId, projectId);
        return resp.data;
    } else {
        const resp = await dataManagementClient.getFolderContents(accessToken, projectId, folderId);
        return resp.data;
    }
};

service.getItemVersions = async (projectId, itemId, accessToken) => {
    const resp = await dataManagementClient.getItemVersions(accessToken, projectId, itemId);
    return resp.data;
};














































