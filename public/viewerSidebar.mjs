const tabs = document.querySelectorAll('.tab');
const contents = document.querySelectorAll('.tab-content');

tabs.forEach(tab => {
  tab.addEventListener('click', () => {
    tabs.forEach(t => t.classList.remove('active'));
    contents.forEach(c => c.classList.remove('active-tab'));
    
    tab.classList.add('active');
    const targetClass = tab.getAttribute('data-tab');
    document.querySelector(`.${targetClass}`).classList.add('active-tab');
  });
});

document.querySelector('.close-btn').addEventListener('click', () => {
  document.getElementById('sheetsPanel').style.visibility = 'hidden';
});

document.getElementById("sheets").addEventListener("click", sheetsPanel);
document.getElementById("files").addEventListener("click", filesPanel);
document.getElementById("model-browser").addEventListener("click", modelBrowserPanel);




  // // Toggle expand/collapse
  // document.querySelectorAll('.parent .expand').forEach(expandIcon => {
  //   expandIcon.addEventListener('click', function (e) {
  //     const parent = e.target.closest('.parent');
  //     const id = parent.getAttribute('data-id');
  //     const children = document.querySelector(`.children[data-parent="${id}"]`);

  //     if (children.classList.contains('show')) {
  //       children.classList.remove('show');
  //       expandIcon.textContent = '▸';
  //     } else {
  //       children.classList.add('show');
  //       expandIcon.textContent = '▾';
  //     }
  //   });
  // });

  // // Toggle visibility (eye icon)
  // document.querySelectorAll('.eye').forEach(eye => {
  //   eye.addEventListener('click', function (e) {
  //     e.stopPropagation(); // Prevent triggering expand
  //     eye.textContent = (eye.textContent === '👁️') ? '🚫' : '👁️';
  //   });
  // });

// ------------------ EVENTS ------------------










function sheetsPanel() {
  const panel = document.getElementById('sheetsPanel');
  const isVisible = panel.style.visibility === 'visible';
  panel.style.visibility = isVisible ? 'hidden' : 'visible';

  const viewer = window.viewerInstance;
  if (!viewer) {
    console.warn('Viewer not initialized yet.');
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

      if (node.data.type === 'geometry' && node.data.role === '2d') {
        results.push(node);
      }

      if (Array.isArray(node.children)) {
        node.children.forEach(child => find2DFilesDeep(child, results, visited));
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

      if (node.data.type === 'geometry' && node.data.role === '3d') {
        results3d.push(node);
      }

      if (Array.isArray(node.children)) {
        node.children.forEach(child => find3DFilesDeep(child, results3d, visited));
      }

      if (node.parent && !visited.has(node.parent.id)) {
        find3DFilesDeep(node.parent, results3d, visited);
      }

      return results3d;
    }

    const viewables2d = find2DFilesDeep(docRoot);
    const tab2d = document.querySelector('.tab2d');
    tab2d.innerHTML = '';

    viewables2d.forEach(viewable => {
      const item = document.createElement('div');
      item.className = 'sheet-item';
      item.dataset.guid = viewable.data.guid;
      item.innerHTML = `
        <img src="images/3d.svg" alt="2D View">
        <span>${viewable.data.name}</span>
      `;

      item.addEventListener('click', () => {
        const guid = item.dataset.guid;
        Autodesk.Viewing.Document.load(
          'urn:' + window.modelUrn,
          (doc) => loadViewable(doc, guid),
          onDocumentLoadFailure
        );
      });

      tab2d.appendChild(item);
    });

    // --- 3D Viewables ---
    const viewables3d = find3DFilesDeep(docRoot);
    const tab3d = document.querySelector('.tab3d');
    tab3d.innerHTML = '';

    viewables3d.forEach(viewable => {
      const item = document.createElement('div');
      item.className = 'sheet-item';
      item.dataset.guid = viewable.data.guid;
      item.innerHTML = `
        <img src="images/3d.svg" alt="3D View">
        <span>${viewable.data.name}</span>
      `;

      item.addEventListener('click', () => {
        const guid = item.dataset.guid;
        Autodesk.Viewing.Document.load(
          'urn:' + window.modelUrn,
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
        applyRefPoint: true
      };

      try {
        const geometryItems = doc.getRoot().search({ type: 'geometry' });
        const viewableNode = geometryItems.find(node => node.data.guid === viewableId);
        if (!viewableNode) {
          console.error('Viewable not found for ID:', viewableId);
          return;
        }

        viewer.getVisibleModels().forEach(model => viewer.unloadModel(model));
        await viewer.loadDocumentNode(doc, viewableNode, loadOptions);
      } catch (error) {
        console.error('Error loading model:', error);
      }
    }

    function onDocumentLoadFailure(code, message) {
      console.error('Failed to load model:', message);
      alert('Could not load model. See console for details.');
    }

  } catch (error) {
    console.error('Error in sheetsPanel:', error);
  }
}



function filesPanel() {
  const viewer = window.viewerInstance;
  const model = viewer.impl.modelQueue().getModels()[0];


  const panel = document.getElementById('sidebar');
  const preview = document.getElementById('preview');
  const isVisible = panel.style.visibility === 'visible';
  panel.style.visibility = isVisible ? 'hidden' : 'visible';
  panel.style.visibility = isVisible ? preview.style.width = '97%' : preview.style.width = '70%';
  document.getElementById('sidebar').style.left = '3%';

  setTimeout(() => {
    viewer.resize();
    viewer.fitToView();
  }, 300);
}






function modelBrowserPanel() {
  const panel = document.getElementById('model-browser-panel');
  const isVisible = panel.style.visibility === 'visible';
  panel.style.visibility = isVisible ? 'hidden' : 'visible';

  const viewer = window.viewerInstance;
  const model = viewer.impl.modelQueue().getModels()[0];
  const instanceTree = model.getData().instanceTree;
  const rootId = instanceTree.getRootId();

  const treeContainer = document.querySelector('.tree');
  treeContainer.innerHTML = '';

  instanceTree.enumNodeChildren(rootId, (parentDbId) => {
  viewer.getProperties(parentDbId, (parentProps) => {
    const parentName = parentProps.name || 'Unknown';

    console.log(`Parent: ${parentName} [dbId: ${parentDbId}]`);

    const parentId = `${parentDbId}`; // Use dbId directly for matching
    const parentDiv = document.createElement('div');
    parentDiv.className = 'tree-item parent';
    parentDiv.dataset.id = parentId;
    parentDiv.innerHTML = `
      <span class="expand">▸</span>
      <img class="eye" src="./images/visible.svg" data-dbId="${parentDbId}"></img>
      ${parentName} [${parentDbId}]
    `;

    const childrenDiv = document.createElement('div');
    childrenDiv.className = 'children';
    childrenDiv.dataset.parent = parentId;
    childrenDiv.classList.add('hidden'); // hidden by default

    // Expand/collapse logic
    parentDiv.querySelector('.expand').addEventListener('click', () => {
      const isHidden = childrenDiv.classList.toggle('hidden');
      parentDiv.querySelector('.expand').textContent = isHidden ? '▸' : '▾';
    });

// Parent visibility toggle
parentDiv.querySelector('.eye').addEventListener('click', (e) => {
  const dbId = parseInt(e.target.dataset.dbid);
  const isVisible = viewer.isNodeVisible(dbId);
  if (isVisible) {
    viewer.hide(dbId);
    e.target.src = './images/hidden.svg';
  } else {
    viewer.show(dbId);
    e.target.src = './images/visible.svg';
  }
});

// Add child elements
instanceTree.enumNodeChildren(parentDbId, (childDbId) => {
  viewer.getProperties(childDbId, (childProps) => {
    const childName = childProps.name || 'Unnamed';
    console.log(`Parent: ${parentDbId}  -> Child: ${childName} [dbId: ${childDbId}]`);

    const childDiv = document.createElement('div');
    childDiv.className = 'tree-item';
    childDiv.innerHTML = `
      <span class="expand"></span>
      <img class="eye" src="./images/visible.svg" data-dbId="${childDbId}" style="width: 16px; height: 16px; cursor: pointer; margin-right: 6px;" />
      ${childName} [${childDbId}]
    `;

    // Child visibility toggle
    childDiv.querySelector('.eye').addEventListener('click', (e) => {
      const dbId = parseInt(e.target.dataset.dbid);
      const isVisible = viewer.isNodeVisible(dbId);
      if (isVisible) {
        viewer.hide(dbId);
        e.target.src = './images/hidden.svg';
      } else {
        viewer.show(dbId);
        e.target.src = './images/visible.svg';
      }
    });


        childrenDiv.appendChild(childDiv);
      });
    });

    treeContainer.appendChild(parentDiv);
    treeContainer.appendChild(childrenDiv);
  });
});

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