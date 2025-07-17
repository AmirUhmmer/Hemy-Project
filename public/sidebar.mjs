// async function getJSON(url) {
//     const resp = await fetch(url);
//     if (!resp.ok) {
//         alert('Could not load tree data. See console for more details.');
//         console.error(await resp.text());
//         return [];
//     }
//     return resp.json();
// }

// import { fetchAccessToken } from './main.mjs';

async function getJSON(url) {
    const token = localStorage.getItem('authToken');
    const refreshToken = localStorage.getItem('refreshToken');
    const expires_at = localStorage.getItem('expires_at');
    const internal_token = localStorage.getItem('internal_token');


    console.log("Request URL:", url);
    // console.log("Authorization Header:", `Bearer ${token}`);

    const resp = await fetch(url, {
        headers: {
            'Authorization': `Bearer ${token}`,  // Send authToken in the Authorization header
            'x-refresh-token': refreshToken,         // Send refreshToken in a custom header
            'x-expires-at': expires_at,              // Send expires_at in a custom header
            'x-internal-token': internal_token       // Send internal_token in a custom header
        }
    });
    // if (!resp.ok) {
    //     fetchAccessToken();
    //     alert('Could not load tree data. See console for more details.');
    //     console.error(await resp.text());
    //     // return [];
    // }
    return resp.json();
}



function createTreeNode(id, text, icon, children = false) {
    return { id, text, children, itree: { icon } };
}

// async function getHubs() {
//     const hubs = await getJSON('/api/hubs');
//     return hubs.map(hub => createTreeNode(`hub|${hub.id}`, hub.attributes.name, 'icon-hub', true));
// }

async function getProjects(hubId) {
    const projects = await getJSON(`/api/hubs/${hubId}/projects`);
    return projects.map(project => createTreeNode(`project|${hubId}|${project.id}`, project.attributes.name, 'icon-project', true));
}

async function getContents(hubId, projectId, folderId = null) {
    const contents = await getJSON(`/api/hubs/${hubId}/projects/${projectId}/contents` + (folderId ? `?folder_id=${folderId}` : ''));

    if (!folderId) {
        // Only return the "Project Files" folder
        const projectFilesFolder = contents.find(item =>
            item.type === 'folders' && item.attributes.displayName === 'Project Files'
        );
        if (projectFilesFolder) {
            window.projectFilesFolderId = projectFilesFolder.id;
            return [createTreeNode(
                `folder|${hubId}|${projectId}|${projectFilesFolder.id}`,
                projectFilesFolder.attributes.displayName,
                'icon-my-folder',
                true
            )];
        } else {
            return []; // No "Project Files" folder found
        }
    } else {
        // We're inside "Project Files" or any subfolder
        const folderNodes = contents
            .filter(item => item.type === 'folders')
            .map(folder => createTreeNode(
                `folder|${hubId}|${projectId}|${folder.id}`,
                folder.attributes.displayName,
                'icon-my-folder',
                true
            ));

        const itemVersionNodes = await Promise.all(contents
            .filter(item => item.type === 'items')
            .map(async item => {
                const versions = await getJSON(`/api/hubs/${hubId}/projects/${projectId}/contents/${item.id}/versions`);
                if (versions.length > 0) {
                    const latest = versions[0];
                    return createTreeNode(`version|${latest.id}`, item.attributes.displayName, 'icon-version');
                }
                return null;
            }));

        return [...folderNodes, ...itemVersionNodes.filter(n => n !== null)];
    }
}


export function initTree(selector, onSelectionChanged) {
    let hubId = 'b.7a656dca-000a-494b-9333-d9012c464554';  // static hub ID
    let params = new URLSearchParams(window.location.search);
    let projectID = 'b.' + params.get('id');
    console.log("Project ID:", projectID);

    const tree = new InspireTree({
        data: function (node) {
            if (!node || !node.id) {
                return getContents(hubId, projectID); // Load root, will fetch only "Project Files"
            } else {
                const tokens = node.id.split('|');
                switch (tokens[0]) {
                    case 'folder': return getContents(hubId, projectID, tokens[3]); // Load only latest versions
                    default: return [];
                }
            }
        }
    });

    tree.on('model.loaded', function () {
        onSelectionChanged(0);

        if (window.projectFilesFolderId) {
            const projectFilesNodeId = `folder|${hubId}|${projectID}|${window.projectFilesFolderId}`;
            const node = tree.node(projectFilesNodeId);
            if (node) {
                node.expand();
            }
        }
    });

    tree.on('node.click', function (event, node) {
        event.preventTreeDefault();
        const tokens = node.id.split('|');
        if (tokens[0] === 'version') {
            onSelectionChanged(tokens[1]); // version ID
        }
    });

    return new InspireTreeDOM(tree, { target: selector });
}
