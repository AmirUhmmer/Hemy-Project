export function toolbarButtons(viewer) {
  viewer.addEventListener(Autodesk.Viewing.GEOMETRY_LOADED_EVENT, function () {
    let models = window.viewerInstance.impl.modelQueue().getModels();
    let urn = models[0].getDocumentNode().getDefaultGeometry().children[1]
      .data.urn; // Get the URN of the first model
    const modelUrn = urn.split("fs.file:")[1].split("/")[0];
    window.modelUrn = modelUrn;

    viewer
      .loadExtension("Autodesk.Viewing.MarkupsCore")
      .then(function (markupsExt) {
        console.log("MarkupsCore loaded");
        window.markupsExt = markupsExt;

        // Now load your toolbar button extension — markupsExt guaranteed ready!
        window.viewerInstance.loadExtension("PencilButton");
        window.viewerInstance.loadExtension("ShapeButton");
        window.viewerInstance.loadExtension("TextButton");
        window.viewerInstance.loadExtension("SaveButton");
      });

    viewer.unloadExtension("Autodesk.Explode");
    const modelTools = viewer.toolbar.getControl("modelTools");
    const navTools = viewer.toolbar.getControl("navTools");

    const measureTools = viewer.toolbar.getControl("measureTools");
    viewer.loadExtension("Autodesk.Viewing.ZoomWindow");
    //navTools.removeControl('toolbar-zoomTool');

    const settingsTools = viewer.toolbar.getControl("settingsTools");
    settingsTools.removeControl("toolbar-modelStructureTool");

    document.getElementById("preview").style.width = "97%";
    document.getElementById("sidebar").style.visibility = "hidden";
    document.getElementById("viewerSidebar").style.visibility = "visible";
    // window.viewerInstance.loadExtension('RightSideToggleButton');

    setTimeout(() => {
      viewer.resize();
      viewer.fitToView();
    }, 300);
  });
}

// ******************** TOOLBAR BUTTONS ********************

class PencilButton extends Autodesk.Viewing.Extension {
  constructor(viewer, options) {
    super(viewer, options);
    this.button = null;
    this.group = null;
    this.toggled = false;
  }

  load() {
    this.createButton();
    return true;
  }

  unload() {
    if (this.group) {
      this.viewer.toolbar.removeControl(this.group);
    }
    return true;
  }

  createButton() {
    this.button = new Autodesk.Viewing.UI.Button("PencilButton");
    this.button.setToolTip("Toggle Something");
    this.button.setIcon("url(./images/faro.svg)");

    this.button.onClick = () => {
      this.group = this.viewer.toolbar.getControl("markupsTools");
      this.group.container.style.display = "flex";
      this.toggled = !this.toggled;
      console.log("Toggled:", this.toggled);
      this.button.container.classList.toggle("active");
      this.button.container.style.backgroundImage = this.toggled
        ? "url(./images/pencil-toggled.svg)"
        : "url(./images/pencil.svg)";

      if (this.toggled) {
        // Create markup sheet if needed
        this.group = this.viewer.toolbar.getControl("markupsTools");
        this.group.container.style.display = "flex";
        if (!window.markupsExt.markups) {
          window.markupsExt.createMarkupSheet();
        }
        // Enter edit mode **********************************************************************************************************
        window.markupsExt.loadMarkups(window.svgData[0].content, "markupLayer1", () => {
            console.log("Markup layer loaded");
            window.markupsExt.enterEditMode("markupLayer1");
        });


        setTimeout(() => {
          try {
            const rectTool =
              new Autodesk.Viewing.Extensions.Markups.Core.EditModeFreehand(
                window.markupsExt
              );
            window.markupsExt.changeEditMode(rectTool);

            Autodesk.Viewing.Extensions.Markups.Core.Utils.showLmvToolsAndPanels(
              window.viewerInstance
            );
          } catch (err) {
            console.error("Failed to change edit mode:", err);
          }
        }, 200);
      } else {
        window.markupsExt.leaveEditMode();
      }
    };

    // Use a toolbar group to contain the button
    let toolbar = this.viewer.getToolbar();
    this.group = this.viewer.toolbar.getControl("markupsTools");
    if (!this.group) {
      this.group = new Autodesk.Viewing.UI.ControlGroup("markupsTools");
      toolbar.addControl(this.group);
      console.log("added pencil button");
    }
    this.group.addControl(this.button);

    // Place this group absolutely at the far right and center it vertically
    this.group.container.style.position = "absolute";
    this.group.container.style.right = "10px";
    this.group.container.style.top = "-50vh";
    this.group.container.style.display = "flex";
    this.group.container.style.flexDirection = "column";
    this.group.container.style.alignItems = "flex-start";
    this.group.container.style.zIndex = "10000"; // Make sure it's above markup UI
    this.group.container.style.pointerEvents = "auto"; // Ensure it can receive clicks
    // Style the button
    // toggled color -- #004eeb  #fffafa
    // not toggled color -- #fffafa
    this.button.container.style.backgroundImage = "url(./images/pencil.svg)";
    this.button.container.style.backgroundSize = "contain";
    this.button.container.style.backgroundRepeat = "no-repeat";
    this.button.container.style.backgroundPosition = "center";
    this.button.container.style.backgroundSize = "25px"; // Adjust size of the background image
    // this.button.container.style.top = '-50vh';           // Adjust the top position as needed
  }
}

// ***************** TEXT BUTTON *****************

class TextButton extends Autodesk.Viewing.Extension {
  constructor(viewer, options) {
    super(viewer, options);
    this.button = null;
    this.group = null;
    this.toggled = false;
  }

  load() {
    this.createButton();
    return true;
  }

  unload() {
    if (this.group) {
      this.viewer.toolbar.removeControl(this.group);
    }
    return true;
  }

  createButton() {
    this.button = new Autodesk.Viewing.UI.Button("TextButton");
    this.button.setToolTip("Text Markup");

    this.button.onClick = () => {
      this.group = this.viewer.toolbar.getControl("markupsTools");
      this.group.container.style.display = "flex";
      this.toggled = !this.toggled;
      console.log("Toggled:", this.toggled);
      this.button.container.classList.toggle("active");
      this.button.container.style.backgroundImage = this.toggled
        ? "url(./images/text-toggled.svg)"
        : "url(./images/text.svg)";

      if (this.toggled) {
        this.group = this.viewer.toolbar.getControl("markupsTools");
        this.group.container.style.display = "flex";
        // Create markup sheet if needed
        if (!window.markupsExt.markups) {
          window.markupsExt.createMarkupSheet();
        }

        window.markupsExt.enterEditMode();

        setTimeout(() => {
          try {
            const rectTool =
              new Autodesk.Viewing.Extensions.Markups.Core.EditModeText(
                window.markupsExt
              );
            window.markupsExt.changeEditMode(rectTool);

            Autodesk.Viewing.Extensions.Markups.Core.Utils.showLmvToolsAndPanels(
              window.viewerInstance
            );
          } catch (err) {
            console.error("Failed to change edit mode:", err);
          }
        }, 200);
      } else {
        window.markupsExt.leaveEditMode();
      }
    };

    // Use a toolbar group to contain the button
    let toolbar = this.viewer.getToolbar();
    this.group = this.viewer.toolbar.getControl("markupsTools");
    if (!this.group) {
      this.group = new Autodesk.Viewing.UI.ControlGroup("markupsTools");
      toolbar.addControl(this.group);
      console.log("added text button");
    }
    this.group.addControl(this.button);

    // Place this group absolutely at the far right and center it vertically
    this.group.container.style.position = "absolute";
    this.group.container.style.right = "10px";
    this.group.container.style.top = "-50vh";
    this.group.container.style.display = "flex";
    this.group.container.style.flexDirection = "column";
    this.group.container.style.alignItems = "flex-start";
    this.group.container.style.zIndex = "10000"; // Make sure it's above markup UI
    this.group.container.style.pointerEvents = "auto"; // Ensure it can receive clicks
    // Style the button
    // toggled color -- #004eeb  #fffafa
    // not toggled color -- #fffafa
    this.button.container.style.backgroundImage = "url(./images/text.svg)";
    this.button.container.style.backgroundSize = "contain";
    this.button.container.style.backgroundRepeat = "no-repeat";
    this.button.container.style.backgroundPosition = "center";
    this.button.container.style.backgroundSize = "25px"; // Adjust size of the background image
  }
}






// ***************** SHAPE BUTTON *****************

class ShapeButton extends Autodesk.Viewing.Extension {
  constructor(viewer, options) {
    super(viewer, options);
    this.button = null;
    this.group = null;
    this.toggled = false;
  }

  load() {
    this.createButton();
    return true;
  }

  unload() {
    if (this.group) {
      this.viewer.toolbar.removeControl(this.group);
    }
    return true;
  }

  createButton() {
    this.button = new Autodesk.Viewing.UI.Button("ShapeButton");
    this.button.setToolTip("Shape Markup");

    this.button.onClick = () => {
      this.group = this.viewer.toolbar.getControl("markupsTools");
      this.group.container.style.display = "flex";
      this.toggled = !this.toggled;
      console.log("Toggled:", this.toggled);
      this.button.container.classList.toggle("active");
      this.button.container.style.backgroundImage = this.toggled
        ? "url(./images/shapes-toggled.svg)"
        : "url(./images/shapes.svg)";

      if (this.toggled) {
        // Create markup sheet if needed
        if (!window.markupsExt.markups) {
          window.markupsExt.createMarkupSheet();
        }

        window.markupsExt.loadMarkups(window.svgData[0].content, "markupLayer1");
        window.markupsExt.enterEditMode("markupLayer1");

        setTimeout(() => {
          try {
            const rectTool =
              new Autodesk.Viewing.Extensions.Markups.Core.EditModeRectangle(
                window.markupsExt
              );
            window.markupsExt.changeEditMode(rectTool);

            Autodesk.Viewing.Extensions.Markups.Core.Utils.showLmvToolsAndPanels(
              window.viewerInstance
            );
          } catch (err) {
            console.error("Failed to change edit mode:", err);
          }
        }, 200);
      } else {
        window.markupsExt.leaveEditMode();
      }
    };

    // Use a toolbar group to contain the button
    let toolbar = this.viewer.getToolbar();
    this.group = this.viewer.toolbar.getControl("markupsTools");
    if (!this.group) {
      this.group = new Autodesk.Viewing.UI.ControlGroup("markupsTools");
      toolbar.addControl(this.group);
      console.log("added shapes button");
    }
    this.group.addControl(this.button);

    // Place this group absolutely at the far right and center it vertically
    this.group.container.style.position = "absolute";
    this.group.container.style.right = "10px";
    this.group.container.style.top = "-50vh";
    this.group.container.style.display = "flex";
    this.group.container.style.flexDirection = "column";
    this.group.container.style.alignItems = "flex-start";
    this.group.container.style.zIndex = "10000"; // Make sure it's above markup UI
    this.group.container.style.pointerEvents = "auto"; // Ensure it can receive clicks
    // Style the button
    // toggled color -- #004eeb  #fffafa
    // not toggled color -- #fffafa
    this.button.container.style.backgroundImage = "url(./images/shapes.svg)";
    this.button.container.style.backgroundSize = "contain";
    this.button.container.style.backgroundRepeat = "no-repeat";
    this.button.container.style.backgroundPosition = "center";
    this.button.container.style.backgroundSize = "25px"; // Adjust size of the background image
  }
}





// ***************** save BUTTON *****************

class SaveButton extends Autodesk.Viewing.Extension {
  constructor(viewer, options) {
    super(viewer, options);
    this.button = null;
    this.group = null;
    this.toggled = false;
  }

  load() {
    this.createButton();
    return true;
  }

  unload() {
    if (this.group) {
      this.viewer.toolbar.removeControl(this.group);
    }
    return true;
  }

  createButton() {
    this.button = new Autodesk.Viewing.UI.Button("SaveButton");
    this.button.setToolTip("Save Markup");
    this.group = this.viewer.toolbar.getControl("markupsTools");
    this.group.container.style.display = "flex";
    //1F54156C407D46EC8E55930338091819
    this.button.onClick = async () => {
      this.group = this.viewer.toolbar.getControl("markupsTools");
      this.group.container.style.display = "flex";
      this.toggled = !this.toggled;
      console.log("Saved:", this.toggled);
      let markupData = window.markupsExt.generateData();
      let urn = window.viewerInstance.model.getSeedUrn();
      let params = {};
      let queryString = window.location.search.substring(1);
      let queryParts = queryString.split("&");
      for (let i = 0; i < queryParts.length; i++) {
          let param = queryParts[i].split("=");
          params[decodeURIComponent(param[0])] = decodeURIComponent(param[1]);
      };
      let projectid = params["projectid"];
      const response = await fetch('https://prod-189.westeurope.logic.azure.com:443/workflows/648f7d062b8f4fb7bb200fb9a0cd7ca4/triggers/manual/paths/invoke?api-version=2016-06-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=0TJSRQdgZwnOnfxsrHgpuqeNJK5s1zkrx-4mctfQJ9U', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ urn: urn, data: markupData, projectid: projectid })
      });
      console.log(urn);
      console.log(markupData);
    };

    // Use a toolbar group to contain the button
    let toolbar = this.viewer.getToolbar();
    this.group = this.viewer.toolbar.getControl("markupsTools");
    if (!this.group) {
      this.group = new Autodesk.Viewing.UI.ControlGroup("markupsTools");
      toolbar.addControl(this.group);
    }
    this.group.addControl(this.button);

    // Place this group absolutely at the far right and center it vertically
    this.group.container.style.position = "absolute";
    this.group.container.style.right = "10px";
    this.group.container.style.top = "-50vh";
    this.group.container.style.display = "flex";
    this.group.container.style.flexDirection = "column";
    this.group.container.style.alignItems = "flex-start";
    this.group.container.style.zIndex = "10000"; // Make sure it's above markup UI
    this.group.container.style.pointerEvents = "auto"; // Ensure it can receive clicks
    // Style the button
    // toggled color -- #004eeb  #fffafa
    // not toggled color -- #fffafa
    this.button.container.style.backgroundImage = "url(./images/save.svg)";
    this.button.container.style.backgroundSize = "contain";
    this.button.container.style.backgroundRepeat = "no-repeat";
    this.button.container.style.backgroundPosition = "center";
    this.button.container.style.backgroundSize = "25px"; // Adjust size of the background image
  }
}

Autodesk.Viewing.theExtensionManager.registerExtension(
  "PencilButton",
  PencilButton
);
Autodesk.Viewing.theExtensionManager.registerExtension(
  "TextButton",
  TextButton
);
Autodesk.Viewing.theExtensionManager.registerExtension(
  "ShapeButton",
  ShapeButton
);
Autodesk.Viewing.theExtensionManager.registerExtension(
  "SaveButton",
  SaveButton
);


// class FileBarPanel extends Autodesk.Viewing.UI.DockingPanel {
//   constructor(viewer, id, title) {
//     super(viewer.container, id, title);

//     this.viewer = viewer;

//     // Style the panel
//     this.container.style.height = '180px';
//     this.container.style.width = '100%';
//     this.container.style.bottom = '0';
//     this.container.style.left = '0';
//     this.container.style.position = 'absolute';
//     this.container.style.background = 'rgba(33, 33, 33, 0.95)';
//     this.container.style.overflowX = 'auto';
//     this.container.style.overflowY = 'hidden';
//     this.container.style.padding = '10px';
//     this.container.style.display = 'flex';
//     this.container.style.gap = '10px';
//   }

//   setVisible(visible) {
//     this.container.style.display = visible ? 'flex' : 'none';
//   }

//   setFiles(files) {
//     this.container.innerHTML = '';

//     const label = document.createElement('div');
//     label.textContent = `${files.length} Files`;
//     label.style.color = '#fff';
//     label.style.marginRight = '20px';
//     label.style.minWidth = '80px';
//     label.style.alignSelf = 'center';
//     this.container.appendChild(label);

//     for (const file of files) {
//       const thumb = document.createElement('div');
//       thumb.style.width = '120px';
//       thumb.style.height = '120px';
//       thumb.style.background = 'rgba(33, 33, 33, 0.95)';
//       thumb.style.display = 'flex';
//       thumb.style.flexDirection = 'column';
//       thumb.style.alignItems = 'center';
//       thumb.style.justifyContent = 'center';
//       thumb.style.cursor = 'pointer';
//       thumb.style.border = '2px solid transparent';

//       const img = document.createElement('img');
//       img.src = file.thumbnail || 'https://via.placeholder.com/100';
//       img.style.width = '100px';
//       img.style.height = '80px';
//       img.style.objectFit = 'contain';

//       const name = document.createElement('div');
//       name.textContent = file.name;
//       name.style.fontSize = '12px';
//       name.style.textAlign = 'center';
//       name.style.whiteSpace = 'nowrap';
//       name.style.overflow = 'hidden';
//       name.style.textOverflow = 'ellipsis';
//       name.style.width = '100%';

//       thumb.appendChild(img);
//       thumb.appendChild(name);

//       thumb.onclick = () => {
//         alert(`Load model: ${file.name}`);
//         // Optionally: this.viewer.loadModel(file.urn);
//       };

//       this.container.appendChild(thumb);
//     }
//   }
// }

// export function filesButtonToolbar(viewer) {
//   const toolbar = viewer.getToolbar();
//   if (!toolbar) {
//     console.error('Toolbar not found');
//     return;
//   }

//   const showFilesButton = new Autodesk.Viewing.UI.Button('showFilesButton');

//   // Customize icon appearance
//   const btnContainer = showFilesButton.container;
//   btnContainer.style.backgroundImage = 'url(./images/folder-icon.svg)';
//   btnContainer.style.backgroundColor = 'transparent';
//   btnContainer.style.backgroundSize = '22px';
//   btnContainer.style.backgroundRepeat = 'no-repeat';
//   btnContainer.style.backgroundPosition = 'center';

//   showFilesButton.setToolTip('Show Folder Files');

//   showFilesButton.onClick = () => {
//     if (viewer.FileBarPanel) {
//       const visible = viewer.FileBarPanel.container.style.display !== 'none';
//       viewer.FileBarPanel.setVisible(!visible);
//     } else {
//       showFolderFiles(viewer);
//     }
//   };

//   // Add to custom toolbar group
//   let subToolbar = viewer.toolbar.getControl('customToolbarGroup');
//   if (!subToolbar) {
//     subToolbar = new Autodesk.Viewing.UI.ControlGroup('customToolbarGroup');
//     toolbar.addControl(subToolbar);
//   }

//   subToolbar.addControl(showFilesButton);
// }

// function showFolderFiles(viewer) {
//   const panel = new FileBarPanel(viewer, 'fileBarPanel', 'Files');
//   viewer.container.appendChild(panel.container);

//   const files = [
//     { name: 'File A', urn: 'urn:adsk.wipemea:dm.lineage:81XDnDhBRjyjPsSs4p5bUw', thumbnail: 'https://via.placeholder.com/100?text=A' },
//     { name: 'File B', urn: '...', thumbnail: 'https://via.placeholder.com/100?text=B' },
//     { name: 'File C', urn: '...', thumbnail: 'https://via.placeholder.com/100?text=C' },
//   ];

//   panel.setFiles(files);
//   viewer.FileBarPanel = panel;
// }
