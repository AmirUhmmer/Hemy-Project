const express = require('express');
const Axios = require('axios');
const cors = require('cors'); // Import CORS
// const bodyParser = require('body-parser');
const { getAuthorizationUrl, authCallbackMiddleware, authRefreshMiddleware, getUserProfile } = require('../services/aps.js');
const { APS_CLIENT_ID, APS_CLIENT_SECRET } = require('../config.js');

var scopes = 'data:read data:write data:create';
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
















// // ------------------------------
// // POST /api/acc/upload/initiate
// // ------------------------------
// router.post('/api/acc/upload/initiate', async (req, res) => {
//   const { fileName, projectId, folderId, token } = req.body;
//   // const token = localStorage.getItem('internal_token');

//   if (!token) return res.status(401).send('Missing access token');

//   try {
//     // Create storage location in ACC
//     const storageRes = await fetch(`https://developer.api.autodesk.com/data/v1/projects/${projectId}/storage?include=uploadParameters`, {
//       method: 'POST',
//       headers: {
//         Authorization: `Bearer ${token}`,
//         'Content-Type': 'application/vnd.api+json'
//       },
//       body: JSON.stringify({
//         data: {
//           type: 'objects',
//           attributes: { name: fileName },
//           relationships: {
//             target: {
//               data: { type: 'folders', id: folderId }
//             }
//           }
//         }
//       })
//     });

//     if (!storageRes.ok) {
//       const errorText = await storageRes.text();
//       console.error("❌ Storage creation failed:", errorText);
//       return res.status(storageRes.status).send(errorText);
//     }

//     const storageJson = await storageRes.json();
//     const storageId = storageJson.data.id;
//     console.log("Storage created with ID:", storageId);
//     console.log("Storage JSON:", storageJson);
//     if (!storageJson.included || !Array.isArray(storageJson.included) || storageJson.included.length === 0) {
//       console.error("❌ `included` section is missing in the storage response", JSON.stringify(storageJson, null, 2));
//       return res.status(500).send("Missing upload parameters in response. Make sure you're using a valid ACC Docs folder.");
//     }


//     res.json({ uploadParams, storageId });
//   } catch (err) {
//     console.error("🚨 Initiate upload error:", err.message, err.stack);
//     res.status(500).send("Upload initiation failed");
//   }
// });

// // ------------------------------
// // POST /api/acc/upload/finalize
// // ------------------------------
// router.post('/api/acc/upload/finalize', async (req, res) => {
//   const { fileName, projectId, folderId, storageId } = req.body;
//   const token = req.headers.authorization?.split(' ')[1];

//   if (!token) return res.status(401).send('Missing access token');

//   try {
//     // Create item version in ACC
//     const itemRes = await fetch(`https://developer.api.autodesk.com/data/v1/projects/${projectId}/items`, {
//       method: 'POST',
//       headers: {
//         Authorization: `Bearer ${token}`,
//         'Content-Type': 'application/vnd.api+json'
//       },
//       body: JSON.stringify({
//         data: {
//           type: 'items',
//           attributes: {
//             displayName: fileName,
//             extension: {
//               type: 'items:autodesk.bim360:File',
//               version: '1.0'
//             }
//           },
//           relationships: {
//             tip: {
//               data: {
//                 type: 'versions',
//                 id: '1' // placeholder, overwritten by included version
//               }
//             },
//             parent: {
//               data: {
//                 type: 'folders',
//                 id: folderId
//               }
//             }
//           }
//         },
//         included: [{
//           type: 'versions',
//           attributes: {
//             name: fileName,
//             extension: {
//               type: 'versions:autodesk.bim360:File',
//               version: '1.0'
//             }
//           },
//           relationships: {
//             storage: {
//               data: {
//                 type: 'objects',
//                 id: storageId
//               }
//             }
//           }
//         }]
//       })
//     });

//     if (!itemRes.ok) {
//       const errorText = await itemRes.text();
//       console.error("❌ Finalize failed:", errorText);
//       return res.status(itemRes.status).send(errorText);
//     }

//     res.status(200).send("Upload finalized successfully");
//   } catch (err) {
//     console.error("🚨 Finalize upload error:", err);
//     res.status(500).send("Upload finalize failed");
//   }
// });









// POST /api/acc/upload/initiate
router.post('/api/acc/upload/initiate', async (req, res) => {
  // console.log("Initiating upload...");
  const { filename, folderUrn, projectId } = req.body; // e.g. 'image.jpg', folder URN, project ID
  const authHeader = req.headers.authorization;
  const authToken = authHeader?.split(' ')[1]; // Extract token after "Bearer "

  console.log("Initiating upload with:", { filename, folderUrn, projectId, authToken });

  if (!authToken) return res.status(401).json({ message: 'Missing auth token' });


  const payload = {
    jsonapi: { version: "1.0" },
    data: {
      type: "objects",
      attributes: {
        name: filename
      },
      relationships: {
        target: {
          data: {
            type: "folders",
            id: folderUrn
          }
        }
      }
    }
  };

  const response = await fetch(`https://developer.api.autodesk.com/data/v1/projects/${projectId}/storage`, {
    method: "POST",
    headers: {
      "Content-Type": "application/vnd.api+json",
      "Accept": "application/vnd.api+json",
      "Authorization": `Bearer ${authToken}`
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const err = await response.json();
    console.error("Storage create error:", err);
    return res.status(500).json(err);
  }

  const data = await response.json();
  console.log("Storage created:", data);
  const objectUrn = data.data.id; // full URN
  const objectKey = objectUrn.split("/").pop(); // last part after /
  const bucketKey = objectUrn.split("/")[2];     // 'wip.dm.prod' etc.

  res.json({ objectUrn, objectKey, bucketKey });
});


// GET /api/acc/upload/signed-url?bucketKey=...&objectKey=...
router.get('/api/acc/upload/signed-url', async (req, res) => {
  const { bucketKey, objectKey } = req.query;
  const authHeader = req.headers.authorization;
  const authToken = authHeader?.split(' ')[1];


  const response = await fetch(`https://developer.api.autodesk.com/oss/v2/buckets/${bucketKey}/objects/${objectKey}/signeds3upload`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${authToken}`
    }
  });

  if (!response.ok) {
    const err = await response.json();
    console.error("Signed URL error:", err);
    return res.status(500).json(err);
  }

  const data = await response.json(); // includes `uploadKey` and `urls`
  console.log("Signed URL data:", data);
  res.json(data);
});




router.post('/api/acc/upload/execute', async (req, res) => {
  try {
    const { signedUrl, fileData } = req.body;
    if (!signedUrl || !fileData) {
      return res.status(400).json({ error: "Missing signedUrl or fileData" });
    }

    // Upload the file to S3 using the signed URL
    const response = await fetch(signedUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/octet-stream',
      },
      body: Buffer.from(fileData),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('S3 Upload failed:', errorText);
      return res.status(500).json({ error: 'S3 Upload failed', details: errorText });
    }

    res.status(200).json({ message: 'Upload succeeded' });

  } catch (err) {
    console.error("Upload error:", err);
    res.status(500).json({ error: 'Upload failed', details: err.message });
  }
});







// POST /api/acc/upload/finalize
router.post('/api/acc/upload/finalize', async (req, res) => {
  const { bucketKey, objectKey, uploadKey } = req.body;
    const authHeader = req.headers.authorization;
  const authToken = authHeader?.split(' ')[1];

  const response = await fetch(`https://developer.api.autodesk.com/oss/v2/buckets/${bucketKey}/objects/${objectKey}/signeds3upload`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${authToken}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ uploadKey })
  });

  const data = await response.json();
  if (!response.ok) {
    console.error("Finalize failed:", data);
    return res.status(500).json(data);
  }

  res.json(data);
});


module.exports = router;