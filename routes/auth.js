const express = require('express');
const Axios = require('axios');
const cors = require('cors'); // Import CORS
// const bodyParser = require('body-parser');
const { getAuthorizationUrl, authCallbackMiddleware, authRefreshMiddleware, getUserProfile } = require('../services/aps.js');
const { APS_CLIENT_ID, APS_CLIENT_SECRET } = require('../config.js');

var scopes = 'data:read data:write';
const querystring = require('querystring');

const sql = require('mssql');

let router = express.Router();

// Enable CORS with specific origin (your Dynamics URL)
router.use(cors());


router.get('/api/auth/login', function (req, res) {
    res.redirect(getAuthorizationUrl());
});

router.get('/api/auth/logout', function (req, res) {
    req.session = null;
    res.redirect('/');
});


router.get('/api/auth/callback', authCallbackMiddleware, (req, res) => {
    const publicToken = req.session.public_token;
    const refreshToken = req.session.refresh_token;
    const expires_at = req.session.expires_at;
    const internal_token = req.session.internal_token;

     // window.opener.postMessage({ token: '${publicToken}' }, window.location.origin);

    res.send(`
        <script>
            if (window.opener) {
                // Send the token back to the parent window
               
                window.opener.postMessage({ token: '${publicToken}', refreshToken: '${refreshToken}', expires_at: '${expires_at}', internal_token: '${internal_token}' }, window.location.origin);

                window.close();  // Close the popup
            }
        </script>
    `);
});

// router.get('/api/auth/token', async (req, res) => {
//     try {
//         const response = await Axios({
//             method: 'POST',
//             url: 'https://developer.api.autodesk.com/authentication/v2/token',
//             headers: {
//                 'content-type': 'application/x-www-form-urlencoded',
//                 // 'Accept': 'application/json',
//                 // 'Authorization': `Basic SERuVXlvcDFCcjZoS2dGa1BGTWZka3JOY1k4MTFpTTc1OUJFQ2hwWWtmZVVaM3JyOkJoRzdNaG1FMjdka1RuY3ZiRjFGOFlMd09wRllxT3I0aTN2ak9zUWpwVVplUGkzdnBhMW1VcTNHNlgwdjdLUHA=`,
//                 'x-user-id': '3a15881a-370e-4d72-80f7-8701c4b1806c'
//             },
//             data: querystring.stringify({
//                 client_id: APS_CLIENT_ID,
//                 client_secret: APS_CLIENT_SECRET,
//                 grant_type: 'client_credentials',
//                 scope: 'data:read data:write account:read viewables:read',
//             })
//         });

//         if (response.status === 200 && response.data.access_token) {
//             res.json({
//                 access_token: response.data.access_token,
//                 refresh_token: response.data.access_token,
//                 expires_in: response.data.expires_in,
//                 internal_token: response.data.access_token
//             });
//         } else {
//             console.error('Authentication failed, invalid response:', response.data);
//             res.status(400).json({ error: 'Failed to authenticate: Invalid response from API' });
//         }

//     } catch (error) {
//         // Log detailed error for debugging
//         console.error('Error during authentication:', error.response?.data || error.message);
//         res.status(500).json({ error: 'Failed to authenticate', details: error.response?.data || error.message });
//     }
// });

// router.get('/api/auth/profile', async function (req, res, next) {
//     try {
//         const authToken = req.headers.authorization?.split(' ')[1]; // Extract token from headers
//         // const profile = await getUserProfile(authToken);
//         // res.json({ name: `${profile.name}` });
//         res.json({ name: authToken });
//     } catch (err) {
//         next('ERROR: ' + err);
//     }
//     // try {
//     //     const profile = await getUserProfile(req.internalOAuthToken.access_token);
//     //     res.json({ name: `${profile.name}` });
//     // } catch (err) {
//     //     next(err);
//     // }
// });


router.get('/api/auth/token', authRefreshMiddleware, function (req, res) {
    res.json(req.publicOAuthToken);
});

router.get('/api/auth/profile', authRefreshMiddleware, async function (req, res, next) {
    try {
        const profile = await getUserProfile(req.internalOAuthToken.access_token);
        res.json({ name: `${profile.name}` });
    } catch (err) {
        next(err);
    }
});



// --------------------------------------------------------------------------- MARKUPS ---------------------------------------------------------------------------
router.get('/markup/save/:markupData', async (req, res) => {
    const markupData = req.params.markupData;
});








const sessionDataStore = {};  // Store data per session

// Endpoint to receive data from Power Apps
router.post('/api/data', (req, res) => {
    const powerAppsData = req.body;
    console.log('Received Data:', powerAppsData);
  
    // Respond back to Power Apps
    res.status(200).send('Data received successfully');
});



module.exports = router;