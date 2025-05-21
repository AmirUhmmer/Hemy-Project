export function toolbarButtons(viewer){
    viewer.addEventListener(Autodesk.Viewing.GEOMETRY_LOADED_EVENT, function () { 
        let models = window.viewerInstance.impl.modelQueue().getModels();
        let urn = models[0].getDocumentNode().getDefaultGeometry().children[1].data.urn; // Get the URN of the first model
        const modelUrn = urn.split('fs.file:')[1].split('/')[0];
        window.modelUrn = modelUrn;
        console.log('Model URN:', modelUrn);
        viewer.unloadExtension('Autodesk.Explode');
        const modelTools = viewer.toolbar.getControl('modelTools');
        const navTools = viewer.toolbar.getControl('navTools');
        
        const measureTools = viewer.toolbar.getControl('measureTools');
        viewer.loadExtension('Autodesk.Viewing.ZoomWindow')
        //navTools.removeControl('toolbar-zoomTool');

        const settingsTools = viewer.toolbar.getControl('settingsTools');
        settingsTools.removeControl('toolbar-modelStructureTool');

        document.getElementById('preview').style.width = '97%';
        document.getElementById('sidebar').style.visibility = 'hidden';
        document.getElementById('viewerSidebar').style.visibility = 'visible';
        filesButtonToolbar(viewer);

            setTimeout(() => {
                viewer.resize();
                viewer.fitToView();
            }, 300);
    });
}


// ******************** TOOLBAR BUTTONS ********************



class FileBarPanel extends Autodesk.Viewing.UI.DockingPanel {
  constructor(viewer, id, title) {
    super(viewer.container, id, title);

    this.viewer = viewer;

    // Style the panel
    this.container.style.height = '180px';
    this.container.style.width = '100%';
    this.container.style.bottom = '0';
    this.container.style.left = '0';
    this.container.style.position = 'absolute';
    this.container.style.background = 'rgba(33, 33, 33, 0.95)';
    this.container.style.overflowX = 'auto';
    this.container.style.overflowY = 'hidden';
    this.container.style.padding = '10px';
    this.container.style.display = 'flex';
    this.container.style.gap = '10px';
  }

  setVisible(visible) {
    this.container.style.display = visible ? 'flex' : 'none';
  }

  setFiles(files) {
    this.container.innerHTML = '';

    const label = document.createElement('div');
    label.textContent = `${files.length} Files`;
    label.style.color = '#fff';
    label.style.marginRight = '20px';
    label.style.minWidth = '80px';
    label.style.alignSelf = 'center';
    this.container.appendChild(label);

    for (const file of files) {
      const thumb = document.createElement('div');
      thumb.style.width = '120px';
      thumb.style.height = '120px';
      thumb.style.background = 'rgba(33, 33, 33, 0.95)';
      thumb.style.display = 'flex';
      thumb.style.flexDirection = 'column';
      thumb.style.alignItems = 'center';
      thumb.style.justifyContent = 'center';
      thumb.style.cursor = 'pointer';
      thumb.style.border = '2px solid transparent';

      const img = document.createElement('img');
      img.src = file.thumbnail || 'https://via.placeholder.com/100';
      img.style.width = '100px';
      img.style.height = '80px';
      img.style.objectFit = 'contain';

      const name = document.createElement('div');
      name.textContent = file.name;
      name.style.fontSize = '12px';
      name.style.textAlign = 'center';
      name.style.whiteSpace = 'nowrap';
      name.style.overflow = 'hidden';
      name.style.textOverflow = 'ellipsis';
      name.style.width = '100%';

      thumb.appendChild(img);
      thumb.appendChild(name);

      thumb.onclick = () => {
        alert(`Load model: ${file.name}`);
        // Optionally: this.viewer.loadModel(file.urn);
      };

      this.container.appendChild(thumb);
    }
  }
  
}

export function filesButtonToolbar(viewer) {
  const toolbar = viewer.getToolbar();
  if (!toolbar) {
    console.error('Toolbar not found');
    return;
  }

  const showFilesButton = new Autodesk.Viewing.UI.Button('showFilesButton');

  // Customize icon appearance
  const btnContainer = showFilesButton.container;
  btnContainer.style.backgroundImage = 'url(./images/folder-icon.svg)';
  btnContainer.style.backgroundColor = 'transparent';
  btnContainer.style.backgroundSize = '22px';
  btnContainer.style.backgroundRepeat = 'no-repeat';
  btnContainer.style.backgroundPosition = 'center';

  showFilesButton.setToolTip('Show Folder Files');

  showFilesButton.onClick = () => {
    if (viewer.FileBarPanel) {
      const visible = viewer.FileBarPanel.container.style.display !== 'none';
      viewer.FileBarPanel.setVisible(!visible);
    } else {
      showFolderFiles(viewer);
    }
  };

  // Add to custom toolbar group
  let subToolbar = viewer.toolbar.getControl('customToolbarGroup');
  if (!subToolbar) {
    subToolbar = new Autodesk.Viewing.UI.ControlGroup('customToolbarGroup');
    toolbar.addControl(subToolbar);
  }

  subToolbar.addControl(showFilesButton);
}

function showFolderFiles(viewer) {
  const panel = new FileBarPanel(viewer, 'fileBarPanel', 'Files');
  viewer.container.appendChild(panel.container);

  const files = [
    { name: 'File A', urn: 'urn:adsk.wipemea:dm.lineage:81XDnDhBRjyjPsSs4p5bUw', thumbnail: 'https://via.placeholder.com/100?text=A' },
    { name: 'File B', urn: '...', thumbnail: 'https://via.placeholder.com/100?text=B' },
    { name: 'File C', urn: '...', thumbnail: 'https://via.placeholder.com/100?text=C' },
  ];

  panel.setFiles(files);
  viewer.FileBarPanel = panel;
}

// async function showFolderFiles(viewer) {
//   // Create the panel only if it doesn't exist
//     let hubId = 'b.7a656dca-000a-494b-9333-d9012c464554';  // static hub ID
//     let params = new URLSearchParams(window.location.search);
//     let projectId = 'b.' + params.get('id');
//   if (!viewer.FileBarPanel) {
//     const panel = new FileBarPanel(viewer, 'fileBarPanel', 'Files');
//     viewer.container.appendChild(panel.container);
//     viewer.FileBarPanel = panel;
//   }

//   const files = await Promise.all(contents
//     .filter(item => item.type === 'items')
//     .map(async item => {
//       const versions = await getJSON(`/api/hubs/${hubId}/projects/${projectId}/contents/${item.id}/versions`);
//       if (versions.length === 0) return null;

//       const latest = versions[0];
//       const urn = latest.relationships.derivatives.data.id;

//       return {
//         name: item.attributes.displayName,
//         urn: urn,
//         thumbnail: `https://via.placeholder.com/100?text=C`
//       };
//     })
//   );

//   const filteredFiles = files.filter(f => f !== null);

//   viewer.FileBarPanel.setFiles(filteredFiles);
//   viewer.FileBarPanel.setVisible(true);
// }


// ******************** FILE BAR PANEL ********************