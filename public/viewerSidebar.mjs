const tabs = document.querySelectorAll(".tab");
const contents = document.querySelectorAll(".tab-content");
var viewer = window.viewerInstance;
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
});

document.getElementById("sheets").addEventListener("click", sheetsPanel);
document.getElementById("files").addEventListener("click", filesPanel);
document.getElementById("model-browser").addEventListener("click", modelBrowserPanel);

document.getElementById('filter').addEventListener('keydown', function(event) { 
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
})


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

// ------------------ EVENTS ------------------

function sheetsPanel() {
  // window.markupsExt.enterEditMode();
  // window.markupsExt.show();
  // window.markupsExt.setEditMode("Freehand"); // Other modes: 'Arrow', 'Cloud', 'Rectangle', 'Ellipse', 'Freehand'

  const panel = document.getElementById("sheetsPanel");
  const isVisible = panel.style.visibility === "visible";
  panel.style.visibility = isVisible ? "hidden" : "visible";

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
  const viewer = window.viewerInstance;
  const model = viewer.impl.modelQueue().getModels()[0];

  const panel = document.getElementById("sidebar");
  const preview = document.getElementById("preview");
  const isVisible = panel.style.visibility === "visible";
  panel.style.visibility = isVisible ? "hidden" : "visible";
  panel.style.visibility = isVisible
    ? (preview.style.width = "97%")
    : (preview.style.width = "70%");
  document.getElementById("sidebar").style.left = "3%";

  setTimeout(() => {
    viewer.resize();
    viewer.fitToView();
  }, 300);
}

function modelBrowserPanel() {
  const panel = document.getElementById("model-browser-panel");
  const isVisible = panel.style.visibility === "visible";
  panel.style.visibility = isVisible ? "hidden" : "visible";

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

// function modelBrowserPanel() {
//   const panel = document.getElementById('model-browser-panel');
//   const isVisible = panel.style.visibility === 'visible';
//   panel.style.visibility = isVisible ? 'hidden' : 'visible';

//   const viewer = window.viewerInstance;
//   const model = viewer.impl.modelQueue().getModels()[0];
//   const instanceTree = model.getData().instanceTree;
//   const rootId = instanceTree.getRootId();
//   const categorizedDbIds = {};

//   // Clear existing tree
//   const treeContainer = document.querySelector('.tree');
//   treeContainer.innerHTML = '';

//   // Recursive function to collect all dbIds
//   function collectDbIds(dbId, dbIds) {
//     dbIds.push(dbId);
//     instanceTree.enumNodeChildren(dbId, (childId) => {
//       collectDbIds(childId, dbIds);
//     });
//   }

//   const allDbIds = [];
//   collectDbIds(rootId, allDbIds);

//   let processed = 0;

//   allDbIds.forEach((dbId) => {
//     viewer.getProperties(dbId, (props) => {
//       const category = props.name || 'Unknown';

//       if (!categorizedDbIds[category]) {
//         categorizedDbIds[category] = [];
//       }

//       categorizedDbIds[category].push({
//         dbId,
//         properties: props.properties
//       });

//       processed++;

//       // When all dbIds are processed, build the tree
//       if (processed === allDbIds.length) {
//         treeContainer.innerHTML = ''; // Clear again to avoid duplicates

//         for (const [categoryName, items] of Object.entries(categorizedDbIds)) {
//           const parentId = categoryName.toLowerCase().replace(/\s+/g, '-');

//           const parentDiv = document.createElement('div');
//           parentDiv.className = 'tree-item parent';
//           parentDiv.dataset.id = parentId;
//           parentDiv.innerHTML = `
//             <span class="expand">▸</span>
//             <span class="eye">👁️</span>
//             ${categoryName}
//           `;

//           const childrenDiv = document.createElement('div');
//           childrenDiv.className = 'children';
//           childrenDiv.dataset.parent = parentId;

//           items.forEach(({ dbId, properties }) => {
//             const childDiv = document.createElement('div');
//             childDiv.className = 'tree-item';
//             childDiv.innerHTML = `
//               <span class="expand"></span>
//               <span class="eye">👁️</span>
//               dbId: ${dbId}
//             `;

//             // Optional: Add property details to tooltip or expandable section
//             childDiv.title = properties
//               .map(p => `${p.displayName}: ${p.displayValue}`)
//               .join('\n');

//             childrenDiv.appendChild(childDiv);
//           });

//           treeContainer.appendChild(parentDiv);
//           treeContainer.appendChild(childrenDiv);
//         }
//       }
//     });
//   });
// }
