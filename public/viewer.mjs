import * as functions from './functions.mjs';
import * as issuefunctions from './issueTasksReporting.mjs';

let viewerInstance;

async function getAccessToken(callback) {
    try {
        // const resp = await fetch('/api/auth/token');

        const access_token = localStorage.getItem('authToken');
        const refreshToken = localStorage.getItem('refreshToken');
        const expires_in = localStorage.getItem('expires_at');
        const internal_token = localStorage.getItem('internal_token');


        // if (!resp.ok)
        //     throw new Error(await resp.text());
        // const { access_token, expires_in } = await resp.json();
        
        callback(access_token, expires_in);
    } catch (err) {
        alert('Could not obtain access token. See the console for more details.');
        console.error(err);        
    }
}

export function initViewer(container) {
    return new Promise(function (resolve, reject) {
        Autodesk.Viewing.Initializer({ env: 'AutodeskProduction', getAccessToken }, async function () {
            const config = {
                extensions: [
                    // 'Autodesk.DocumentBrowser',
                    // 'Autodesk.AEC.LevelsExtension',
                    // 'Autodesk.DataVisualization',
                    // 'HistogramExtension',
                ]
            };
            const viewer = new Autodesk.Viewing.GuiViewer3D(container, config);
            // const viewer = new Autodesk.Viewing.AggregatedView(container, config);

            viewer.start();
            viewer.setTheme('dark-theme');
            viewer.setQualityLevel(true, true);
            // console.log(accessToken);

            viewer.loadExtension('Autodesk.AEC.LevelsExtension').then((levelsExt) => {
                console.log('Autodesk.AEC.LevelsExtension loaded.');
                
            });

            
            const canvas = viewer.impl.canvas;
                    
            
            resolve(viewer);

            window.viewerInstance = viewer;
        });
    });
}

// ******************************* WORKING ************************
// URN:  dXJuOmFkc2sud2lwZW1lYTpmcy5maWxlOnZmLkpiRWpmR1VPUjQtbEZBQ3dRMmcxOXc/dmVyc2lvbj01
export function loadModel(viewer, urn) {
    console.log("URN: ", urn);
    async function onDocumentLoadSuccess(doc) {
        const defaultViewable = doc.getRoot().getDefaultGeometry();
        const loadOptions = {
            globalOffset: { x: 0, y: 0, z: 0 },  // Force all models to origin
            applyRefPoint: true, // Apply reference point for 3D shared coordinates
        };
        if (!defaultViewable) {
            console.error("No default geometry found in document.");
            return;
        }

        const role = defaultViewable.data.role; // '2d' or '3d'
        console.log("Viewable role:", role);

        const loaded = await viewer.loadDocumentNode(doc, defaultViewable, loadOptions);
        if (loaded) {
            if (role === '2d') {
                functions.toolbarButtons2D(viewer);
            } else {
                functions.sidebarButtons3D(viewer);
                viewer.model.getSeedUrn();
                const decodedUrn = atob(urn.replace(/_/g, '/').replace(/-/g, '+'));
                console.log("Decoded URN:", decodedUrn);
                let params = new URLSearchParams(window.location.search);
                const projectId = params.get('id');
                const authToken = localStorage.getItem('authToken');
                issuefunctions.loadIssueTypes(projectId, authToken);

            }
        }
    }

    function onDocumentLoadFailure(code, message) {
        console.error("Failed to load document:", message);
    }

    Autodesk.Viewing.Document.load('urn:' + urn, onDocumentLoadSuccess, onDocumentLoadFailure);
}

// Move outside so it's not recreated every time
function waitForToolbar(viewer, callback) {
    if (viewer.toolbar) {
        callback();
    } else {
        viewer.addEventListener(Autodesk.Viewing.TOOLBAR_CREATED_EVENT, function onToolbarCreated() {
            viewer.removeEventListener(Autodesk.Viewing.TOOLBAR_CREATED_EVENT, onToolbarCreated);
            callback();
            console.log('Toolbar created, executing callback.');
        });
    }
}
