import * as functions from './functions.mjs';

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

            viewer.loadExtension('Autodesk.DataVisualization').then(() => {
                console.log('Autodesk.DataVisualization loaded.');
            });

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

export function loadModel(viewer, urn) {
    function onDocumentLoadSuccess(doc) {
        const loaded = viewer.loadDocumentNode(doc, doc.getRoot().getDefaultGeometry());
        if (loaded){
            functions.toolbarButtons(viewer);
            
        }
    }
    function onDocumentLoadFailure(code, message) {
        //alert('Could not load model. See console for more details.');
        //console.error(message);
    }
    Autodesk.Viewing.Document.load('urn:' + urn, onDocumentLoadSuccess, onDocumentLoadFailure);
}