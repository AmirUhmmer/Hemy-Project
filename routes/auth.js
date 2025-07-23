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










// POST /api/acc/upload/folderUrn
router.post('/api/acc/upload/folderUrn', async (req, res) => {
  const { projectId } = req.body; // e.g. 'image.jpg', folder URN, project ID
  const authHeader = req.headers.authorization;
  const authToken = authHeader?.split(' ')[1]; // Extract token after "Bearer "

  const hubId = 'b.7a656dca-000a-494b-9333-d9012c464554';

  console.log("Initiating upload with:", { projectId, authToken });

  if (!authToken) return res.status(401).json({ message: 'Missing auth token' });

  const response = await fetch(`https://developer.api.autodesk.com/project/v1/hubs/${hubId}/projects/${projectId}/topFolders`, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${authToken}`
    },
  });


  const data = await response.json();

  const projectFilesFolder = data.data.find(f => f.attributes.name === 'Project Files');
  const folderId = projectFilesFolder?.id;

  console.log('Folder ID:', folderId);

  res.json({ folderId });
  // console.log("Folders:", data);
});


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
  const { signedUrl, base64File } = req.body;
  if (!signedUrl || !base64File)
    return res.status(400).json({ error: "Missing signedUrl or base64File" });

  try {
    const fileBuffer = Buffer.from(base64File, 'base64');

    const response = await fetch(signedUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/octet-stream',
      },
      body: fileBuffer,
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("Direct S3 upload failed:", errText);
      return res.status(500).json({ error: 'Direct S3 upload failed', details: errText });
    }

    res.status(200).json({ message: 'Upload success' });
  } catch (err) {
    console.error("Upload error:", err);
    res.status(500).json({ error: 'Upload failed', details: err.message });
  }
});








// POST /api/acc/upload/finalize
router.post('/api/acc/upload/finalize', async (req, res) => {
  const { bucketKeyCorrected, objectKey, uploadKey, projectId, folderUrn, filename } = req.body;
  const authHeader = req.headers.authorization;
  const authToken = authHeader?.split(' ')[1];

  try {
    const objectId = `urn:adsk.objects:os.object:${bucketKeyCorrected}/${objectKey}`;

    // Step 1: Finalize multipart upload
    const finalizeRes = await fetch(`https://developer.api.autodesk.com/oss/v2/buckets/${bucketKeyCorrected}/objects/${objectKey}/signeds3upload`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${authToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ uploadKey })
    });
    const finalizeData = await finalizeRes.json();

    if (!finalizeRes.ok) {
      console.error("Finalize failed:", finalizeData);
      return res.status(500).json({ error: "Finalize failed", details: finalizeData });
    }

    // Step 2: Try to create a new item
    const itemBody = {
      jsonapi: { version: "1.0" },
      data: {
        type: "items",
        attributes: {
          displayName: filename,
          extension: {
            type: "items:autodesk.bim360:File",
            version: "1.0"
          }
        },
        relationships: {
          tip: {
            data: {
              type: "versions",
              id: "1"
            }
          },
          parent: {
            data: {
              type: "folders",
              id: folderUrn
            }
          }
        }
      },
      included: [{
        type: "versions",
        id: "1",
        attributes: {
          name: filename,
          extension: {
            type: "versions:autodesk.bim360:File",
            version: "1.0"
          }
        },
        relationships: {
          storage: {
            data: {
              type: "objects",
              id: objectId
            }
          }
        }
      }]
    };

    const itemRes = await fetch(`https://developer.api.autodesk.com/data/v1/projects/${projectId}/items`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${authToken}`,
        "Content-Type": "application/vnd.api+json",
        "Accept": "application/vnd.api+json"
      },
      body: JSON.stringify(itemBody)
    });

    let itemData = await itemRes.json();

    // Step 3: Check if file already exists (409 or error detail)
    if (!itemRes.ok) {
      const isFileExists =
        itemRes.status === 409 ||
        (itemData?.errors?.[0]?.detail || "").includes("already exists");

      if (isFileExists) {
        console.log("File exists. Switching to version upload...");

        // Get the existing item's ID
        const folderContentsRes = await fetch(`https://developer.api.autodesk.com/data/v1/projects/${projectId}/folders/${folderUrn}/contents`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/vnd.api+json'
          }
        });
        const folderContents = await folderContentsRes.json();

        const existingItem = folderContents.data.find(item =>
          item.attributes.displayName === filename
        );

        if (!existingItem) {
          return res.status(500).json({ error: "Could not find existing item after create failed." });
        }

        // Create new version
        const versionBody = {
          jsonapi: { version: "1.0" },
          data: {
            type: "versions",
            attributes: {
              name: filename,
              extension: {
                type: "versions:autodesk.bim360:File",
                version: "1.0"
              }
            },
            relationships: {
              storage: {
                data: {
                  type: "objects",
                  id: objectId
                }
              },
              item: {
                data: {
                  type: "items",
                  id: existingItem.id
                }
              }
            }
          }
        };

        const versionRes = await fetch(`https://developer.api.autodesk.com/data/v1/projects/${projectId}/versions`, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${authToken}`,
            "Content-Type": "application/vnd.api+json",
            "Accept": "application/vnd.api+json"
          },
          body: JSON.stringify(versionBody)
        });

        const versionData = await versionRes.json();

        if (!versionRes.ok) {
          console.error("Version creation failed:", versionData);
          return res.status(500).json({ error: "Version creation failed", details: versionData });
        }

        return res.status(200).json({
          type: "version",
          finalized: finalizeData,
          result: versionData
        });
      }

      // If it's not a file-exists error, return original item creation error
      console.error("Item creation failed:", itemData);
      return res.status(500).json({ error: "Item creation failed", details: itemData });
    }

    // ✅ If item was created successfully
    return res.status(200).json({
      type: "item",
      finalized: finalizeData,
      result: itemData
    });

  } catch (error) {
    console.error("Finalize route error:", error);
    res.status(500).json({ error: "Unexpected error", details: error.message });
  }
});







router.post('/api/acc/postissue', async (req, res) => {
  const { projectId, payload, title } = req.body;
  const authHeader = req.headers.authorization;
  const authToken = authHeader?.split(' ')[1];
  const hubId = 'b.7a656dca-000a-494b-9333-d9012c464554';

  console.log("Initialize: ", projectId, payload, title)
  if (!projectId || !title) {
    return res.status(400).json({ error: "Missing projectId or title" });
  }

  try {
    const projectRes = await fetch(
      `https://developer.api.autodesk.com/project/v1/hubs/${hubId}/projects/${"b." + projectId}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${authToken}`,
        }
      }
    );

    const projectData = await projectRes.json();
    if (!projectRes.ok) {
      console.error("Project fetch failed:", projectData);
      return res.status(projectRes.status).json(projectData);
    }

    const issueContainer = projectData.data.relationships.issues.data.id;
    console.log("Issue Container ID:", issueContainer);

    // ✅ Use full payload from frontend
    const issueRes = await fetch(
      `https://developer.api.autodesk.com/construction/issues/v1/projects/${projectId}/issues`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(payload)
      }
    );


    const issueText = await issueRes.json();
    console.log(issueText);
    if (!issueRes.ok) {
      console.error("Issue creation failed:", issueText);
      return res.status(issueRes.status).json({ error: "Failed to create issue", details: issueText });
    }

    res.status(200).json({ message: 'Issue created successfully', details: issueText });

  } catch (err) {
    console.error("Error:", err);
    res.status(500).json({ error: "Unexpected error", details: err.message });
  }
});











module.exports = router;