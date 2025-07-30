var viewer = window.viewerInstance;
document.getElementById("issues").addEventListener("click", createIssuePanel);

// ------------------------------------------ CREATE ISSUES ------------------------------------------------ 
document.getElementById("create-issue-btn").onclick = async () => {
  const viewer = window.viewerInstance;
  const panel = document.getElementById("issue-panel");
  panel.style.visibility = "hidden";
  document.getElementById("preview").style.width = "97%";
  let params = new URLSearchParams(window.location.search);
  const projectId = "b." + params.get("id");

  setTimeout(() => {
    window.viewerInstance.resize();
  }, 300);

  const pushpin_ext = await viewer.loadExtension(
    "Autodesk.BIM360.Extension.PushPin"
  );

  await pushpin_ext.pushPinManager.removeAllItems();

  pushpin_ext.startCreateItem({
    label: "New Issue",
    status: "open",
    type: "issues",
  });


  pushpin_ext.pushPinManager.addEventListener("pushpin.created", function (e) {
    const pushpinId = e.value?.itemData?.id;

    if (pushpinId) {
      pushpin_ext.endCreateItem();
      pushpin_ext.setDraggableById(pushpinId, true);
    //   document.getElementsByClassName("pushpin-billboard-marker").style.backgroundColor = "#F54927"; //red
    }


    // Show issue details panel
    const issuePanel = document.getElementById("issue-details-panel");
    issuePanel.style.visibility = "visible";
    document.getElementById("preview").style.width = "72%";
    document.getElementById("issue-task").value = "Issue";
    viewer.model.getData().name;
    console.log("Model Name:", viewer.getVisibleModels());

    setTimeout(() => {
      window.viewerInstance.resize();
    }, 300);

    document.getElementById("issue-form").onsubmit = async (e) => {
      e.preventDefault();
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
      const projectId = params.get("id");
      const authToken = localStorage.getItem("authToken");
      const title = document.getElementById("issue-title").value;

      function fixBase64UrlEncoding(str) {
        // Remove 'urn:' prefix if present
        str = str.replace(/^urn:/, "");

        // Replace URL-safe chars back to standard Base64
        str = str.replace(/-/g, "+").replace(/_/g, "/");

        // Add padding if needed
        while (str.length % 4 !== 0) {
          str += "=";
        }

        return str;
      }

      let version = null;


      // subtype & wacthers
      const subtypeId = document.getElementById("issue-types").value;
      const watcherSelect = document.getElementById("issue-watchers");
      const selectedWatchers = Array.from(watcherSelect.selectedOptions).map(opt => opt.value);
      const assignSelect = document.getElementById("issue-assigned-to");
      const assignedTo = assignSelect.value;
      const assignedToType = assignSelect.selectedOptions[0]?.getAttribute("data-type");
      const startDateRaw = document.getElementById('issue-start-date').value;
      const dueDateRaw = document.getElementById('issue-due-date').value;

      const startDate = startDateRaw ? new Date(startDateRaw).toISOString().split("T")[0] : null;
      const dueDate = dueDateRaw ? new Date(dueDateRaw).toISOString().split("T")[0] : null;



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
        description: document.getElementById("issue-description").value,
        issueSubtypeId: subtypeId,
        assignedTo: assignedTo,
        assignedToType: assignedToType,
        watchers: selectedWatchers,
        startDate: startDate,
        dueDate: dueDate,
        customAttributes: [
          {
            attributeDefinitionId: getAttrIdByTitle("Issue/Task"),
            value: document.getElementById("issue-task").value
          },
          {
            attributeDefinitionId: getAttrIdByTitle("Hard Asset Name"),
            value: document.getElementById("issue-hard-asset").value
          },
          {
            attributeDefinitionId: getAttrIdByTitle("Functional Location"),
            value: document.getElementById("issue-functional-location").value
          }
        ],

        linkedDocuments: [
          {
            type: "TwoDVectorPushpin",
            urn: window.lineageUrn,
            createdAtVersion: Number(version),
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
        const issueRes = await fetch("/api/acc/postissue", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify({ projectId, payload, title }), // ✅ send full payload
        });

        if (!issueRes.ok) {
          const responseText = await issueRes.text();
          throw new Error(
            `❌ Failed to create issue. Status: ${issueRes.status}`
          );
          showErrorNotification(`Error creating issue: ${responseText}`);
        }

        const data = await issueRes.json();
        showNotification("Issue created successfully");
        document.getElementById("issue-details-panel").style.visibility =
          "hidden";
        

        document.getElementById("preview").style.width = "97%";

        setTimeout(() => {
          viewer.resize();
        }, 300);

      } catch (err) {
        console.error(err);
        alert("Error creating issue. See console for details.");
      }
    };
  });
};




//-------------------------------- ISSUES LIST --------------------------------
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
    populateIssueList(issues); // function to populate the cards
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
  const extName = "Autodesk.BIM360.Extension.PushPin";
  let pushpin_ext = viewer.getExtension(extName);
  if (!pushpin_ext) {
    pushpin_ext = await viewer.loadExtension(extName);
  }

  // Optional: clear existing pushpins
  pushpin_ext.pushPinManager.removeAllItems();

  const pushpinItems = [];

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

    // 🟡 Collect pushpin if it's for the current viewable
    if (linkedDoc?.viewable?.guid === viewerNode.guid()) {
      const pushpinItem = {
        id: issue.id,
        label: `#${issue.displayId} - ${issue.title}`,
        status: issue.status,
        position: linkedDoc.position,
        objectId: linkedDoc.objectId,
        viewerState: linkedDoc.viewerState
      };

      pushpinItems.push(pushpinItem);

      // 🔍 Restore viewer state on card click
        card.addEventListener('click', () => {
        if (linkedDoc.viewerState) {
            viewer.restoreState(linkedDoc.viewerState);
        }

        // 🔄 Remove 'selected' from all cards
        document.querySelectorAll('.issue-card').forEach(c => c.classList.remove('selected'));

        // ✅ Mark this one as selected
        card.classList.add('selected');

        card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

        });

    }
  });

  // 🟢 Load all pushpins once
  if (pushpinItems.length > 0) {
    pushpin_ext.loadItemsV2(pushpinItems);

    // Update pin colors after a slight delay to let DOM render them
    setTimeout(() => {
      issues.forEach(issue => {
        const el = document.getElementById(issue.id);
        if (el) {
          el.style.backgroundColor = '#F54927'; // your custom red-orange
        }
      });
    }, 200); // delay ensures elements are in DOM
  }
}



// ------------------------------------------ ISSUE TYPES ------------------------------------------------

export async function loadIssueTypes(projectId, authToken) {
  console.log("Model Name:", window.viewerInstance.getVisibleModels());
  await getCustomAttributes(projectId, authToken);
  await getProjectMembers(projectId, authToken);
  await getCompanies(projectId, authToken);
  const res = await fetch(`/api/acc/getIssueType?projectId=${projectId}`, {
    method: "GET",
    credentials: "include",
    headers: {
      Authorization: `Bearer ${authToken}`
    }
  });

  if (!res.ok) {
    console.error("Failed to fetch issue types");
    return;
  }

  const { results } = await res.json(); // APS returns raw object with `results` array
  const select = document.getElementById('issue-types');
  select.innerHTML = ''; // clear old options

  results.forEach(type => {
    if (!type.isActive) return;

    const optgroup = document.createElement("optgroup");
    optgroup.label = type.title;

    type.subtypes.forEach(subtype => {
      if (!subtype.isActive) return;

      const option = document.createElement("option");
      option.value = subtype.id; // you can change this to subtype.code or subtype.title
      option.textContent = subtype.title;
      optgroup.appendChild(option);
    });

    if (optgroup.children.length > 0) {
      select.appendChild(optgroup);
    }
  });
}




// ------------------------------------------ CUSTOM ATTRIBUTES ------------------------------------------------
async function getCustomAttributes(projectId, authToken) {
  const res = await fetch('/api/acc/getCustomAttributes', {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${authToken}`
    },
    body: JSON.stringify({ projectId })
  });


  if (!res.ok) {
    console.error("Failed to fetch issue types");
    return;
  }

  const { results } = await res.json(); // APS returns raw object with `results` array
  window.customAttributeDefinitions = results;
}


function getAttrIdByTitle(title) {
  if (!Array.isArray(window.customAttributeDefinitions)) {
    console.warn("Custom attribute definitions not loaded yet.");
    return null;
  }

  const match = window.customAttributeDefinitions.find(attr => attr.title === title);
  if (!match) {
    console.warn(`Attribute with title "${title}" not found`);
    return null;
  }

  return match.id;
}




// project members elligble for being assigned to or being watcher
async function getProjectMembers(projectId, authToken) {
  const res = await fetch('/api/acc/getProjectMembers', {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${authToken}`
    },
    body: JSON.stringify({ projectId })
  });


  if (!res.ok) {
    console.error("Failed to fetch issue types");
    return;
  }

  const { results } = await res.json(); // APS returns raw object with `results` array

  const select = document.getElementById('issue-assigned-to');
  const selectWatchers = document.getElementById('issue-watchers');
  select.innerHTML = ''; // clear old options
  selectWatchers.innerHTML = ''; // clear old options

  results.forEach(user => {
    const option = document.createElement("option");
    option.value = user.autodeskId;
    option.textContent = user.name;
    option.setAttribute("data-type", "user"); // <-- Add this line
    select.appendChild(option);

    const watcherOption = document.createElement("option");
    watcherOption.value = user.autodeskId;
    watcherOption.textContent = user.name;
    watcherOption.setAttribute("data-type", "user"); // <-- Add this line
    selectWatchers.appendChild(watcherOption);
  });
}




// project members elligble for being assigned to or being watcher
async function getCompanies(projectId, authToken) {
  const res = await fetch('/api/acc/getCompanies', {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${authToken}`
    },
    body: JSON.stringify({ projectId })
  });


  if (!res.ok) {
    console.error("Failed to fetch issue types");
    return;
  }

  const { results } = await res.json(); // APS returns raw object with `results` array

  const select = document.getElementById('issue-assigned-to');
  const selectWatchers = document.getElementById('issue-watchers');
  
  results.forEach(companies => {
    const option = document.createElement("option");
    option.value = companies.id;
    option.textContent = companies.name;
    option.setAttribute("data-type", "company"); // <-- Add this line
    select.appendChild(option);

    const watcherOption = document.createElement("option");
    watcherOption.value = companies.id;
    watcherOption.textContent = companies.name;
    watcherOption.setAttribute("data-type", "company"); // <-- Add this line
    selectWatchers.appendChild(watcherOption);

  });

  const watchersSelect = new Choices('#issue-watchers', {
    placeholderValue: "Select watchers",
    removeItemButton: true,
    shouldSort: false
  });
}