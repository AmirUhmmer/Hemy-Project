const tabs = document.querySelectorAll(".tab");
const contents = document.querySelectorAll(".tab-content");
var viewer = window.viewerInstance;
// const urn = viewer.getSeedUrn();
// console.log("Model URN:", urn);
// var models =  window.viewerInstance.impl.modelQueue().getModels()[0];
tabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    tabs.forEach((t) => t.classList.remove("active"));
    contents.forEach((c) => c.classList.remove("active-tab"));

    tab.classList.add("active");
    const targetClass = tab.getAttribute("data-tab");
    document.querySelector(`.${targetClass}`).classList.add("active-tab");
  });
});

document.querySelector(".close-btn").addEventListener("click", () => {
  document.getElementById("sheetsPanel").style.visibility = "hidden";
  document.getElementById("fileContainer").style.visibility = "hidden";
  document.getElementById("model-browser-panel").style.visibility = "hidden";
  document.getElementById("file-upload-panel").style.visibility = "hidden";
  document.getElementById("issue-panel").style.visibility = "hidden";
  document.getElementById("issue-details-panel").style.visibility = "hidden";
  preview.style.width = "97%";
  setTimeout(() => {
    window.viewerInstance.resize();
    window.viewerInstance.fitToView();
  }, 300);
});

document.getElementById("sheets").addEventListener("click", sheetsPanel);
document.getElementById("files").addEventListener("click", filesPanel);
document
  .getElementById("model-browser")
  .addEventListener("click", modelBrowserPanel);
document
  .getElementById("upload-files")
  .addEventListener("click", fileUploadPanel);
document
  .getElementById("issues")
  .addEventListener("click", createIssuePanel);

document.getElementById("filter").addEventListener("keydown", function (event) {
  window.viewerInstance.search(
    document.getElementById("filter").value,
    function (dbIDs) {
      var models = window.viewerInstance.impl.modelQueue().getModels();
      // Loop through the models only once
      models.forEach((model) => {
        // Hide all objects first
        window.viewerInstance.isolate([], model);

        // Isolate the found objects
        window.viewerInstance.isolate(dbIDs, model);
      });

      // Fit to view and highlight the found objects
      window.viewerInstance.fitToView(dbIDs);

      const color = new THREE.Vector4(1, 0, 0, 1); // Red color with full intensity (RGBA)
      window.viewerInstance.setThemingColor(dbIDs, color); // Optionally highlight the objects

      // window.viewerInstance.setSelectionColor(new THREE.Color(1, 0, 0));  // RGB: red, green, blue
      // window.viewerInstance.select(dbIDs);  // Optionally highlight the objects

      // Disable further selections after this point
    },
    function (error) {
      console.error("Search error:", error); // Handle any potential search errors
    }
  );
});

document.getElementById("search").addEventListener("click", function first() {
  // viewer.search(
  //   document.getElementById("filter").value,
  //   function (dbIDs) {
  //     viewer.isolate(dbIDs);
  //     viewer.fitToView(dbIDs);
  // });

  window.viewerInstance.search(
    document.getElementById("filter").value,
    function (dbIDs) {
      var models = window.viewerInstance.impl.modelQueue().getModels();
      // Loop through the models only once
      models.forEach((model) => {
        // Hide all objects first
        window.viewerInstance.isolate([], model);

        // Isolate the found objects
        window.viewerInstance.isolate(dbIDs, model);
      });

      // Fit to view and highlight the found objects
      window.viewerInstance.fitToView(dbIDs);

      const color = new THREE.Vector4(1, 0, 0, 1); // Red color with full intensity (RGBA)
      window.viewerInstance.setThemingColor(dbIDs, color); // Optionally highlight the objects

      // window.viewerInstance.setSelectionColor(new THREE.Color(1, 0, 0));  // RGB: red, green, blue
      // window.viewerInstance.select(dbIDs);  // Optionally highlight the objects

      // Disable further selections after this point
    },
    function (error) {
      console.error("Search error:", error); // Handle any potential search errors
    }
  );
});







// ------------------------------------------ FILE UPLOAD LANDING PAGE ------------------------------------------------ 
const fileInput = document.getElementById("upload-input");
const fileLabel = document.querySelector(".custom-file-label");

fileInput.addEventListener("change", () => {
  if (fileInput.files.length > 0) {
    fileLabel.textContent = fileInput.files[0].name;
  } else {
    fileLabel.textContent = "Choose a file";
  }
});

const triggerBtn = document.getElementById('uploadBtn');
const uploadBtn = document.getElementById('upload-btn');

triggerBtn.addEventListener('click', () => {
  fileInput.click(); // trigger file picker
});

// Wait for file to be selected
fileInput.addEventListener('change', () => {
  if (fileInput.files.length > 0) {
    uploadBtn.click(); // now trigger upload
  }
});




// ------------------------------------------ FILE UPLOAD BACKEND PROCESS ------------------------------------------------ 
document.getElementById("upload-btn").onclick = async () => {
  const fileInput = document.getElementById("upload-input");

  if (!fileInput.files.length) return alert("Select a file");

  const filename = fileInput.files[0].name;

  showInfoNotification("Processing your upload. Please wait...."); //show notif

  let hubId = 'b.7a656dca-000a-494b-9333-d9012c464554';  // static hub ID
  let params = new URLSearchParams(window.location.search);
  const projectId = 'b.' + params.get('id');

  // const folderUrn = 'urn:adsk.wipemea:fs.folder:co.pJtm7c96SquVtn6AmedMow';
  const authToken = localStorage.getItem('authToken');


  try {
    // Step 0: Get top folder ID
    const folderRes = await fetch('/api/acc/upload/folderUrn', {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({ projectId })
    });
  
    if (!folderRes.ok) throw new Error("Failed to get folder");
    const { folderId } = await folderRes.json();
    const folderUrn = folderId;
  
    // Step 1: Create storage location for file
    const initRes = await fetch('/api/acc/upload/initiate', {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({ filename, projectId, folderUrn, authToken })
    });
  
    if (!initRes.ok) throw new Error("Storage creation failed");
    const { bucketKey, objectKey, objectUrn } = await initRes.json();
    const parts = objectUrn.split(':');
    const bucketKeyCorrected = parts[parts.length - 1].split('/')[0];
  
    // Step 2: Get signed S3 URL
    const signedUrlRes = await fetch(`/api/acc/upload/signed-url?bucketKey=${bucketKeyCorrected}&objectKey=${objectKey}`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
  
    if (!signedUrlRes.ok) throw new Error("Failed to get signed URL");
    const { urls, uploadKey } = await signedUrlRes.json();
    const signedUrl = urls[0];
  
    // Step 3: Convert file to base64
    const fileInput = document.getElementById("upload-input");
    const file = fileInput.files[0];
    if (!file) return alert("No file selected");
  
    const base64DataUrl = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
    });
  
    const base64Data = base64DataUrl.split(',')[1]; // Remove data: prefix
  
    // Step 4: Upload file to S3 via signed URL
    const uploadResp = await fetch('/api/acc/upload/execute', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        signedUrl,
        base64File: base64Data
      })
    });
  
    if (!uploadResp.ok) throw new Error("Upload to S3 failed");
  
    // Step 5: Check if file already exists in folder (by filename)
    const checkRes = await fetch(`https://developer.api.autodesk.com/data/v1/projects/${projectId}/folders/${folderUrn}/contents`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/vnd.api+json'
      }
    });
  
    if (!checkRes.ok) throw new Error("Failed to check existing items");
    const folderContents = await checkRes.json();
    const existingItem = folderContents.data.find(item => item.attributes.displayName === filename);
  
    const isUpdate = !!existingItem;
    const existingItemId = existingItem?.id;
  
    // Step 6: Finalize the upload (create item or version)
    const finalizeRes = await fetch('/api/acc/upload/finalize', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({
        bucketKeyCorrected,
        objectKey,
        uploadKey,
        projectId,
        folderUrn,
        filename,
        isUpdate,
        existingItemId
      })
    });
  
    if (!finalizeRes.ok) throw new Error("Finalize failed");
    showNotification("Upload complete!");
  } catch (err) {
    showErrorNotification("Upload failed: " + err.message);
  }
  
};



// ------------------------------------------ ISSUES LIST ------------------------------------------------ 





// ------------------------------------------ CREATE ISSUES ------------------------------------------------ 
document.getElementById("create-issue-btn").onclick = async () => { 
  const viewer = window.viewerInstance;
  const panel = document.getElementById("issue-panel");
  panel.style.visibility = "hidden";
  document.getElementById("preview").style.width = "97%"
  let params = new URLSearchParams(window.location.search);
  const projectId = 'b.' + params.get('id');

  setTimeout(() => {
    window.viewerInstance.resize();
    window.viewerInstance.fitToView();
  }, 300);


  const pushpin_ext = await viewer.loadExtension(
    "Autodesk.BIM360.Extension.PushPin"
  );

  pushpin_ext.startCreateItem({
    label: "New Issue",
    status: "open",
    type: "issues",
  });

  pushpin_ext.pushPinManager.addEventListener('pushpin.created', function (e) {
    const pushpinId = e.value?.itemData?.id;
  
    if (pushpinId) {
      pushpin_ext.endCreateItem();
      pushpin_ext.setDraggableById(pushpinId, true);
    }
  
    const issuePanel = document.getElementById("issue-details-panel");
    issuePanel.style.visibility = "visible";
    document.getElementById("preview").style.width = "72%";
  
    setTimeout(() => {
      window.viewerInstance.resize();
      window.viewerInstance.fitToView();
    }, 300);
  
    document.getElementById("save-issue-btn").onclick = async () => {
      const issue = pushpin_ext.getItemById(pushpinId);
      const model = viewer.impl.modelQueue().getModels()[0];
      const versionUrn = model.getData().urn;
      const seedUrn = model.getSeedUrn();
      const loadedDocument = viewer.model.getDocumentNode();
  
      if (!versionUrn) {
        console.error("❌ versionUrn is missing from model.getData().urn");
        alert("Version ID not found in loaded model.");
        return;
      }
  
      let params = new URLSearchParams(window.location.search);
      const projectId = params.get('id');
      const authToken = localStorage.getItem("authToken");
      const title = document.getElementById("issue-title").value;
      
      function fixBase64UrlEncoding(str) {
        // Remove 'urn:' prefix if present
        str = str.replace(/^urn:/, '');

        // Replace URL-safe chars back to standard Base64
        str = str.replace(/-/g, '+').replace(/_/g, '/');

        // Add padding if needed
        while (str.length % 4 !== 0) {
          str += '=';
        }

        return str;
      }

      let version = null;

      try {
        const fixedVersionUrn = fixBase64UrlEncoding(versionUrn);
        const decodedVersionUrn = atob(fixedVersionUrn);
        console.log("✅ Decoded Version URN:", decodedVersionUrn);

        const match = decodedVersionUrn.match(/version=(\d+)/);
        version = match ? parseInt(match[1], 10) : null;
        console.log("📦 Version number:", version);
      } catch (e) {
        console.warn("⚠️ Failed to decode version URN:", e.message);
      }


      const payload = {
        title: title,
        status: "open",
        description: "Pushpin issue created",
        // dueDate: new Date().toISOString().split("T")[0],
        issueSubtypeId: "e931d7af-e1fd-42d0-a1f5-6b570cf0c26f", // Use your correct subtype ID
        linkedDocuments: [
          {
            type: "TwoDVectorPushpin",
            urn: window.lineageUrn, // ✅ use decoded URN, not base64
            createdAtVersion: Number(version), // ✅ must be integer
            details: {
              viewable: {
                name: loadedDocument.data.name,
                guid: loadedDocument.data.guid,
                is3D: loadedDocument.data.role === "3d",
                viewableId: loadedDocument.data.viewableID
              },
              externalId: issue.externalId,
              position: issue.position,
              objectId: issue.objectId,
              viewerState: issue.viewerState
            }
          }
        ]
      };
      
  
      try {
        const issueRes = await fetch('/api/acc/postissue', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
          },
          body: JSON.stringify({ projectId, payload, title }) // ✅ send full payload
        });
        
  
        if (!issueRes.ok) {
          const responseText = await issueRes.text();
          throw new Error(`❌ Failed to create issue. Status: ${issueRes.status}`);
          showErrorNotification(`Error creating issue: ${responseText}`);
        }
  
        const data = await issueRes.json();
        showNotification("Issue created successfully");
        document.getElementById("issue-details-panel").style.visibility = "hidden";
        viewer.resize();
      } catch (err) {
        console.error(err);
        alert("Error creating issue. See console for details.");
      }
    };
  });
  
  
};





window.svgData = window.svgData || [];

window.addEventListener("message", (event) => {
  // Optional: check event.origin to verify sender
  if (event.data?.type === "SVG_DATA") {
    console.log("Received SVGs:", event.data.payload);
    window.svgData.push(...event.data.payload);
    // event.data.payload.forEach(svg => {
    //     const container = document.createElement("div");
    //     container.innerHTML = svg.content;
    //     container.style.border = "1px solid #ddd";
    //     container.style.margin = "10px";
    //     document.body.appendChild(container);
    // });
  }
});


// ----------------------------------------------------- EVENTS -----------------------------------------------------
// ----------------------------------------------------- EVENTS -----------------------------------------------------
// ----------------------------------------------------- EVENTS -----------------------------------------------------

function showInfoNotification(message) {
  const notif = document.getElementById('notifInfo');
  const notifMessage = document.getElementById('notifInfo-message');
  notifMessage.textContent = message;
  notif.classList.remove('hidden');
  notif.classList.add('show');

  setTimeout(() => {
    notif.classList.remove('show');
    setTimeout(() => notif.classList.add('hidden'), 400); // Wait for transition
  }, 5000); // Visible for 3 seconds
}

function showNotification(message) {
  const notif = document.getElementById('notif');
  const notifMessage = document.getElementById('notif-message');
  notifMessage.textContent = message;
  notif.classList.remove('hidden');
  notif.classList.add('show');

  setTimeout(() => {
    notif.classList.remove('show');
    setTimeout(() => notif.classList.add('hidden'), 400); // Wait for transition
  }, 5000); // Visible for 3 seconds
}


function showErrorNotification(message) {
  const notif = document.getElementById('notifError');
  const notifMessage = document.getElementById('notifError-message');
  notifMessage.textContent = message;
  notif.classList.remove('hidden');
  notif.classList.add('show');

  setTimeout(() => {
    notif.classList.remove('show');
    setTimeout(() => notif.classList.add('hidden'), 400); // Wait for transition
  }, 5000); // Visible for 3 seconds
}



function sheetsPanel() {
  const modelBrowserPanel = document.getElementById("model-browser-panel");
  const filesPanel = document.getElementById("fileContainer");
  modelBrowserPanel.style.visibility = "hidden";
  filesPanel.style.visibility = "hidden";

  const panel = document.getElementById("sheetsPanel");
  const isVisible = panel.style.visibility === "visible";
  panel.style.visibility = isVisible ? "hidden" : "visible";
  panel.style.visibility = isVisible
    ? (document.getElementById("preview").style.width = "97%")
    : (document.getElementById("preview").style.width = "72%");

  setTimeout(() => {
    window.viewerInstance.resize();
    window.viewerInstance.fitToView();
  }, 300);

  const viewer = window.viewerInstance;
  if (!viewer) {
    console.warn("Viewer not initialized yet.");
    return;
  }

  try {
    const models = viewer.impl.modelQueue().getModels();
    if (!models.length) return;

    const docRoot = models[0].getDocumentNode();

    // --- 2D Viewables ---
    function find2DFilesDeep(node, results = [], visited = new Set()) {
      if (!node || !node.data || visited.has(node.id)) return results;
      visited.add(node.id);

      if (node.data.type === "geometry" && node.data.role === "2d") {
        results.push(node);
      }

      if (Array.isArray(node.children)) {
        node.children.forEach((child) =>
          find2DFilesDeep(child, results, visited)
        );
      }

      if (node.parent && !visited.has(node.parent.id)) {
        find2DFilesDeep(node.parent, results, visited);
      }

      return results;
    }

    // --- 3D Viewables ---
    function find3DFilesDeep(node, results3d = [], visited = new Set()) {
      if (!node || !node.data || visited.has(node.id)) return results3d;
      visited.add(node.id);

      if (node.data.type === "geometry" && node.data.role === "3d") {
        results3d.push(node);
      }

      if (Array.isArray(node.children)) {
        node.children.forEach((child) =>
          find3DFilesDeep(child, results3d, visited)
        );
      }

      if (node.parent && !visited.has(node.parent.id)) {
        find3DFilesDeep(node.parent, results3d, visited);
      }

      return results3d;
    }

    const viewables2d = find2DFilesDeep(docRoot);
    const tab2d = document.querySelector(".tab2d");
    tab2d.innerHTML = "";

    viewables2d.forEach((viewable) => {
      const item = document.createElement("div");
      item.className = "sheet-item";
      item.dataset.guid = viewable.data.guid;
      item.innerHTML = `
        <img src="images/3d.svg" alt="2D View">
        <span>${viewable.data.name}</span>
      `;

      item.addEventListener("click", () => {
        const guid = item.dataset.guid;
        Autodesk.Viewing.Document.load(
          "urn:" + window.modelUrn,
          (doc) => loadViewable(doc, guid),
          onDocumentLoadFailure
        );
      });

      tab2d.appendChild(item);
    });

    // --- 3D Viewables ---
    const viewables3d = find3DFilesDeep(docRoot);
    const tab3d = document.querySelector(".tab3d");
    tab3d.innerHTML = "";

    viewables3d.forEach((viewable) => {
      const item = document.createElement("div");
      item.className = "sheet-item";
      item.dataset.guid = viewable.data.guid;
      item.innerHTML = `
        <img src="images/3d.svg" alt="3D View">
        <span>${viewable.data.name}</span>
      `;

      item.addEventListener("click", () => {
        const guid = item.dataset.guid;
        Autodesk.Viewing.Document.load(
          "urn:" + window.modelUrn,
          (doc) => loadViewable(doc, guid),
          onDocumentLoadFailure
        );
      });

      tab3d.appendChild(item);
    });

    // --- Helper Functions ---
    async function loadViewable(doc, viewableId) {
      const loadOptions = {
        globalOffset: { x: 0, y: 0, z: 0 },
        applyRefPoint: true,
      };

      try {
        const geometryItems = doc.getRoot().search({ type: "geometry" });
        const viewableNode = geometryItems.find(
          (node) => node.data.guid === viewableId
        );
        if (!viewableNode) {
          console.error("Viewable not found for ID:", viewableId);
          return;
        }

        viewer.getVisibleModels().forEach((model) => viewer.unloadModel(model));
        await viewer.loadDocumentNode(doc, viewableNode, loadOptions);
      } catch (error) {
        console.error("Error loading model:", error);
      }
    }

    function onDocumentLoadFailure(code, message) {
      console.error("Failed to load model:", message);
      alert("Could not load model. See console for details.");
    }
  } catch (error) {
    console.error("Error in sheetsPanel:", error);
  }
}

function filesPanel() {
  const modelBrowserPanel = document.getElementById("model-browser-panel");
  const sheetsPanel = document.getElementById("sheetsPanel");
  modelBrowserPanel.style.visibility = "hidden";
  sheetsPanel.style.visibility = "hidden";

  const viewer = window.viewerInstance;
  const model = viewer.impl.modelQueue().getModels()[0];

  const panel = document.getElementById("fileContainer");
  const preview = document.getElementById("preview");
  const isVisible = panel.style.visibility === "visible";
  panel.style.visibility = isVisible ? "hidden" : "visible";
  panel.style.visibility = isVisible
    ? (preview.style.width = "97%")
    : (preview.style.width = "0%");
  document.getElementById("fileContainer").style.left = "3%";

  setTimeout(() => {
    viewer.resize();
    viewer.fitToView();
  }, 300);
}

function modelBrowserPanel() {
  const modelBrowserPanel = document.getElementById("model-browser-panel");
  const filesPanel = document.getElementById("fileContainer");
  modelBrowserPanel.style.visibility = "hidden";
  filesPanel.style.visibility = "hidden";

  const panel = document.getElementById("model-browser-panel");
  const isVisible = panel.style.visibility === "visible";
  panel.style.visibility = isVisible ? "hidden" : "visible";
  panel.style.visibility = isVisible
    ? (document.getElementById("preview").style.width = "97%")
    : (document.getElementById("preview").style.width = "72%");

  setTimeout(() => {
    window.viewerInstance.resize();
    window.viewerInstance.fitToView();
  }, 300);

  const viewer = window.viewerInstance;
  const model = viewer.impl.modelQueue().getModels()[0];
  const instanceTree = model.getData().instanceTree;
  const rootId = instanceTree.getRootId();

  const treeContainer = document.querySelector(".tree");
  treeContainer.innerHTML = "";

  instanceTree.enumNodeChildren(rootId, (childId) => {
    buildTreeNode(childId, treeContainer);
  });

  function buildTreeNode(dbId, container) {
    viewer.getProperties(dbId, (props) => {
      const nodeName = props.name || "Unnamed";

      const nodeDiv = document.createElement("div");
      nodeDiv.className = "tree-item parent";
      nodeDiv.dataset.id = dbId;
      nodeDiv.innerHTML = `
        <span class="expand">▸</span>
        <img class="eye" src="./images/visible.svg" data-dbId="${dbId}" />
        ${nodeName} [${dbId}]
      `;

      const childrenDiv = document.createElement("div");
      childrenDiv.className = "children hidden";
      childrenDiv.dataset.parent = dbId;

      // Expand/collapse behavior
      nodeDiv.querySelector(".expand").addEventListener("click", () => {
        const isHidden = childrenDiv.classList.contains("hidden");
        if (isHidden) {
          childrenDiv.classList.remove("hidden");
          childrenDiv.classList.add("show");
          nodeDiv.querySelector(".expand").textContent = "▾";
        } else {
          childrenDiv.classList.remove("show");
          childrenDiv.classList.add("hidden");
          nodeDiv.querySelector(".expand").textContent = "▸";
        }
      });

      // Visibility toggle
      nodeDiv.querySelector(".eye").addEventListener("click", (e) => {
        const targetDbId = parseInt(e.target.dataset.dbid);
        const visible = viewer.isNodeVisible(targetDbId);
        if (visible) {
          viewer.hide(targetDbId);
          e.target.src = "./images/hidden.svg";
        } else {
          viewer.show(targetDbId);
          e.target.src = "./images/visible.svg";
        }
      });

      container.appendChild(nodeDiv);
      container.appendChild(childrenDiv);

      // Recurse into children
      instanceTree.enumNodeChildren(dbId, (childDbId) => {
        buildTreeNode(childDbId, childrenDiv);
      });
    });
  }
}

function fileUploadPanel() {
  const modelBrowserPanel = document.getElementById("model-browser-panel");
  const filesPanel = document.getElementById("fileContainer");
  modelBrowserPanel.style.visibility = "hidden";
  filesPanel.style.visibility = "hidden";

  const panel = document.getElementById("file-upload-panel");
  const isVisible = panel.style.visibility === "visible";
  panel.style.visibility = isVisible ? "hidden" : "visible";
  panel.style.visibility = isVisible
    ? (document.getElementById("preview").style.width = "97%")
    : (document.getElementById("preview").style.width = "72%");

  setTimeout(() => {
    window.viewerInstance.resize();
    window.viewerInstance.fitToView();
  }, 300);
}


async function createIssuePanel() {
  const viewer = window.viewerInstance;
  const modelBrowserPanel = document.getElementById("model-browser-panel");
  const filesPanel = document.getElementById("fileContainer");
  modelBrowserPanel.style.visibility = "hidden";
  filesPanel.style.visibility = "hidden";

  const panel = document.getElementById("issue-panel");
  const isVisible = panel.style.visibility === "visible";
  panel.style.visibility = isVisible ? "hidden" : "visible";
  panel.style.visibility = isVisible
    ? (document.getElementById("preview").style.width = "97%")
    : (document.getElementById("preview").style.width = "72%");

  setTimeout(() => {
    window.viewerInstance.resize();
    window.viewerInstance.fitToView();
  }, 300);


  const authToken = localStorage.getItem('authToken');
  let params = new URLSearchParams(window.location.search);
  const projectId = params.get('id');
  const lineageUrn = window.lineageUrn;

  try {
    const issueRes = await fetch('/api/acc/getissues', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({ projectId, lineageUrn })
    });

    if (!issueRes.ok) {
      const responseText = await issueRes.text();
      throw new Error(`❌ Failed to get issues. Status: ${issueRes.status}\n${responseText}`);
    }

    const data = await issueRes.json();
    showNotification("Issue list retrieved successfully");

    const issues = data.details?.results || [];
    populateIssueList(issues); // 👈 Your own function to populate the cards
    viewer.resize();
  } catch (err) {
    console.error(err);
    alert("Error retrieving issues. See console for details.");
  }
}

async function populateIssueList(issues) {
  const container = document.querySelector('.issue-list-container');
  container.innerHTML = ''; // Clear old cards

  const viewer = window.viewerInstance;
  const viewerNode = viewer.model.getDocumentNode();

  // Load PushPin extension if not already loaded
  if (!viewer.getExtension("Autodesk.BIM360.Extension.PushPin")) {
    await viewer.loadExtension("Autodesk.BIM360.Extension.PushPin");
  }

  const pushpin_ext = viewer.getExtension("Autodesk.BIM360.Extension.PushPin");

  // Optional: clear existing pushpins
  pushpin_ext.pushPinManager.removeAllItems();

  issues.forEach((issue) => {
    const linkedDoc = issue.linkedDocuments?.[0]?.details;

    // 🟢 Render issue card
    const card = document.createElement('div');
    card.className = 'issue-card';
    card.innerHTML = `
      <div>Issue: ${issue.title || '[Untitled]'}</div>
      <div>Type: ${issue.issueTypeId || '-'} &nbsp; Status: ${issue.status || '-'}</div>
    `;
    container.appendChild(card);

    // 🟡 Create pushpin if it's for the current viewable
    if (linkedDoc?.viewable?.guid === viewerNode.guid()) {
      pushpin_ext.pushPinManager.createItem({
        id: issue.id,
        label: issue.displayId?.toString() || issue.title || "Issue",
        status: issue.issueTypeId && issue.status.indexOf(issue.issueTypeId) === -1
          ? `${issue.issueTypeId}-${issue.status}`
          : issue.status,
        position: linkedDoc.position,
        type: issue.issueTypeId,
        objectId: linkedDoc.objectId,
        viewerState: linkedDoc.viewerState
      });

      // 🔍 On card click, restore viewer state
      card.addEventListener('click', () => {
        if (linkedDoc.viewerState) {
          viewer.restoreState(linkedDoc.viewerState);
        }
      });
    }
  });
}



