var viewer = window.viewerInstance;
document.getElementById("issues").addEventListener("click", createIssuePanel);
document.getElementById("issue-filter-btn").addEventListener("click", filterPanel);
document.getElementById("clear-issue-filter-btn").addEventListener("click", resetIssueFilter);

document.getElementById("cancel-issue-btn").onclick = () => {
  document.getElementById("issue-form").reset;
  const panel = document.getElementById("issue-panel");
  const issuePanel = document.getElementById("issue-details-panel");
  panel.style.visibility = "hidden";
  issuePanel.style.visibility = "hidden";

  document.getElementById("preview").style.width = "97%";
  document.getElementById("issue-form").style.display = "none"; // Hide the form
  document.querySelector(".issue-type-selector").style.display = "block"; // Show the issue type selector
  setTimeout(() => {
    window.viewerInstance.resize();
  }, 300);

  const extName = "Autodesk.BIM360.Extension.PushPin";
  const pushpin_ext = window.viewerInstance.getExtension(extName);

  if (pushpin_ext && pushpin_ext.pushPinManager) {
    pushpin_ext.pushPinManager.removeAllItems(); // ✅ Remove pushpins
  } else {
    console.warn("PushPin extension is not loaded or has no pushPinManager");
  }
};


document.getElementById("cancel-issue-filter-btn").onclick = () => {
  document.getElementById("issue-filter-form").reset;
  const issuePanel = document.getElementById("issue-filter-panel");
  issuePanel.style.visibility = "hidden";

  // document.getElementById("preview").style.width = "97%";

  // const extName = "Autodesk.BIM360.Extension.PushPin";
  // const pushpin_ext = window.viewerInstance.getExtension(extName);

  // if (pushpin_ext && pushpin_ext.pushPinManager) {
  //   pushpin_ext.pushPinManager.removeAllItems(); // ✅ Remove pushpins
  // } else {
  //   console.warn("PushPin extension is not loaded or has no pushPinManager");
  // }
};

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
    const issue = pushpin_ext.getItemById(pushpinId);

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

    // automated fields
    // title
    viewer.getProperties(issue.objectId, function (props) {
      // console.log('Properties ', props.properties)
      const categoryProp = props.properties.find(
        (p) => p.displayName === "Category"
      );

      if (categoryProp) {
        document.getElementById("issue-title").value =
          categoryProp.displayValue;
      }
    });

    // placement
    document.getElementById("issue-placement").value = window.modelName;

    // prepare post issue
    document.getElementById("issue-form").onsubmit = async (e) => {
      e.preventDefault();
      const model = viewer.impl.modelQueue().getModels()[0];
      const versionUrn = model.getData().urn;
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
      const selectedWatchers = Array.from(watcherSelect.selectedOptions).map(
        (opt) => opt.value
      );
      const assignSelect = document.getElementById("issue-assigned-to");
      const assignedTo = assignSelect.value;
      const assignedToType =
        assignSelect.selectedOptions[0]?.getAttribute("data-type");
      const startDateRaw = document.getElementById("issue-start-date").value;
      const dueDateRaw = document.getElementById("issue-due-date").value;

      const startDate = startDateRaw
        ? new Date(startDateRaw).toISOString().split("T")[0]
        : null;
      const dueDate = dueDateRaw
        ? new Date(dueDateRaw).toISOString().split("T")[0]
        : null;

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
            value: document.getElementById("issue-task").value,
          },
          {
            attributeDefinitionId: getAttrIdByTitle("Hard Asset Name"),
            value: document.getElementById("issue-hard-asset").value,
          },
          {
            attributeDefinitionId: getAttrIdByTitle("Functional Location"),
            value: document.getElementById("issue-functional-location").value,
          },
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
                viewableId: loadedDocument.data.viewableID,
              },
              externalId: issue.externalId,
              position: issue.position,
              objectId: issue.objectId,
              viewerState: issue.viewerState,
            },
          },
        ],
      };

      console.log("📦 Payload to send:", payload);
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





// ------------------------------------------ ISSUE FILTER SUBMIT ------------------------------------------------
document.getElementById("issue-filter-form").onsubmit = async (e) => {
  e.preventDefault();
  let params = new URLSearchParams(window.location.search);
  const projectId = params.get("id");
  const lineageUrn = window.lineageUrn;
  const authToken = localStorage.getItem("authToken");
  const issueType = document.getElementById("issue-types-filter").value;
  const hardAssetId = getAttrIdByTitle("Hard Asset Name");
  const hardAsset = document.getElementById("issue-filter-hard-asset").value;
  const functionalLocation = document.getElementById("issue-filter-functional-location").value;
  const functionalLocationId = getAttrIdByTitle("Functional Location");
  const assignedTo = document.getElementById("issue-filter-assigned-to").value;
  const startDate = document.getElementById("issue-filter-start-date").value;
  const dueDate = document.getElementById("issue-filter-due-date").value;
  const status = document.getElementById("issue-filter-status").value;
  try {
    const issueRes = await fetch("/api/acc/getissuesFiltered", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({ lineageUrn, projectId, issueType, hardAsset, hardAssetId, functionalLocation, functionalLocationId, assignedTo, startDate, dueDate, status }),
    });

    if (!issueRes.ok) {
      const responseText = await issueRes.text();
      throw new Error(
        `❌ Failed to get issues. Status: ${issueRes.status}\n${responseText}`
      );
    }

    const data = await issueRes.json();
    showNotification("Issue list retrieved successfully");

    const issues = data.details?.results || [];
    populateIssueList(issues); // function to populate the cards
    document.getElementById("issue-filter-panel").style.visibility = "hidden";
    document.getElementById("issue-panel").style.visibility = "visible";
    // viewer.resize();
  } catch (err) {
    console.error(err);
    alert("Error retrieving issues. See console for details.");
  }
};




// ------------------------------------------ RESET ISSUE FILTER ------------------------------------------------
async function resetIssueFilter() {
  document.getElementById("issue-filter-form").reset();
  const authToken = localStorage.getItem("authToken");
  let params = new URLSearchParams(window.location.search);
  const projectId = params.get("id");
  const lineageUrn = window.lineageUrn;

    try {
      const issueRes = await fetch("/api/acc/getissues", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ projectId, lineageUrn }),
      });

      if (!issueRes.ok) {
        const responseText = await issueRes.text();
        throw new Error(
          `❌ Failed to get issues. Status: ${issueRes.status}\n${responseText}`
        );
        showErrorNotification(`Error retrieving issues: ${responseText}`);
      }

      const data = await issueRes.json();
      showNotification("Issue list retrieved successfully");

      const issues = data.details?.results || [];
      populateIssueList(issues); // function to populate the cards
      document.getElementById("issue-filter-panel").style.visibility = "hidden";
      document.getElementById("issue-panel").style.visibility = "visible";
    } catch (err) {
      console.error(err);
      alert("Error retrieving issues. See console for details.");
    }
}





//-------------------------------- ISSUES LIST --------------------------------
async function createIssuePanel() {
  const viewer = window.viewerInstance;
  const modelBrowserPanel = document.getElementById("model-browser-panel");
  const filesPanel = document.getElementById("fileContainer");
  const panel = document.getElementById("issue-panel");

  modelBrowserPanel.style.visibility = "hidden";
  filesPanel.style.visibility = "hidden";

  const isVisible = panel.style.visibility === "visible";
  panel.style.visibility = isVisible ? "hidden" : "visible";
  panel.style.visibility = isVisible
    ? (document.getElementById("preview").style.width = "97%")
    : (document.getElementById("preview").style.width = "72%");

  setTimeout(() => {
    viewer.resize();
    viewer.fitToView();
  }, 300);

  // 🛑 Check if already populated
  const container = document.querySelector(".issue-list-container");
  console.log("Issue list container children:", container.children.length);
  console.log("Is issue list visible?", isVisible);
  if (isVisible || container.children.length > 0) {
    console.log("Issue list already populated. Skipping fetch.");
    return;
  }

  const authToken = localStorage.getItem("authToken");
  let params = new URLSearchParams(window.location.search);
  const projectId = params.get("id");
  const lineageUrn = window.lineageUrn;

  try {
    const issueRes = await fetch("/api/acc/getissues", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({ projectId, lineageUrn }),
    });

    if (!issueRes.ok) {
      const responseText = await issueRes.text();
      throw new Error(
        `❌ Failed to get issues. Status: ${issueRes.status}\n${responseText}`
      );
    }

    const data = await issueRes.json();
    showNotification("Issue list retrieved successfully");

    const issues = data.details?.results || [];
    populateIssueList(issues);
    viewer.resize();
  } catch (err) {
    console.error(err);
    alert("Error retrieving issues. See console for details.");
  }
}






// ------------------------------------------ FILTER PANEL ------------------------------------------------
async function filterPanel() {
  const viewer = window.viewerInstance;
  const modelBrowserPanel = document.getElementById("model-browser-panel");
  const filesPanel = document.getElementById("fileContainer");
  modelBrowserPanel.style.visibility = "hidden";
  filesPanel.style.visibility = "hidden";

  const panel = document.getElementById("issue-filter-panel");
  const isVisible = panel.style.visibility === "visible";
  panel.style.visibility = isVisible ? "hidden" : "visible";
  panel.style.visibility = isVisible
    ? (document.getElementById("preview").style.width = "97%")
    : (document.getElementById("preview").style.width = "72%");

  setTimeout(() => {
    window.viewerInstance.resize();
  }, 300);
}





// ------------------------------------------ POPULATE ISSUE LIST ------------------------------------------------
async function populateIssueList(issues) {
  const container = document.querySelector(".issue-list-container");
  container.innerHTML = ""; // Clear old cards

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
    const card = document.createElement("div");
    card.className = "issue-card";
    card.innerHTML = `
          <div>Issue: ${issue.title || "[Untitled]"}</div>
          <div>Type: ${issue.issueTypeId || "-"} </div> 
          <div>Status: ${issue.status || "-"}</div>
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
        viewerState: linkedDoc.viewerState,
      };

      pushpinItems.push(pushpinItem);

      // 🔍 Restore viewer state on card click
      card.addEventListener("click", () => {
        if (linkedDoc.viewerState) {
          viewer.restoreState(linkedDoc.viewerState);
        }

        // 🔄 Remove 'selected' from all cards
        document
          .querySelectorAll(".issue-card")
          .forEach((c) => c.classList.remove("selected"));

        // ✅ Mark this one as selected
        card.classList.add("selected");

        card.scrollIntoView({ behavior: "smooth", block: "nearest" });
      });
    }
  });

  // 🟢 Load all pushpins once
  if (pushpinItems.length > 0) {
    pushpin_ext.loadItemsV2(pushpinItems);

    // Update pin colors after a slight delay to let DOM render them
    setTimeout(() => {
      issues.forEach((issue) => {
        const el = document.getElementById(issue.id);
        if (el) {
          el.style.backgroundColor = "#F54927"; // your custom red-orange
        }
      });
    }, 200); // delay ensures elements are in DOM
  }
}





// ------------------------------------------ ISSUE TYPES ------------------------------------------------
export async function loadIssueTypes(projectId, authToken) {
  await getCustomAttributes(projectId, authToken);
  await getProjectMembers(projectId, authToken);
  await getCompanies(projectId, authToken);
  const res = await fetch(`/api/acc/getIssueType?projectId=${projectId}`, {
    method: "GET",
    credentials: "include",
    headers: {
      Authorization: `Bearer ${authToken}`,
    },
  });

  if (!res.ok) {
    console.error("Failed to fetch issue types");
    return;
  }

  const { results } = await res.json();

  const select = document.getElementById("issue-types");
  select.innerHTML = "";

  const selectFilter = document.getElementById("issue-types-filter");

  const listContainer = document.querySelector(".issue-type-selector");
  listContainer.innerHTML = "<h4>Select Issue Type</h4>";

  results.forEach((type) => {
    if (!type.isActive) return;

    const group = document.createElement("div");
    group.classList.add("issue-group");

    const label = document.createElement("div");
    label.classList.add("group-label");
    label.textContent = type.title;
    group.appendChild(label);

    const optgroup = document.createElement("optgroup");
    optgroup.label = type.title;

    type.subtypes.forEach((subtype) => {
      if (!subtype.isActive) return;

      // Options for form submission
      const option = document.createElement("option");
      option.value = subtype.id;
      option.textContent = subtype.title;
      optgroup.appendChild(option); // ✅ Append the option to optgroup

      // Visual list item
      const visual = document.createElement("div");
      visual.classList.add("issue-option");
      visual.textContent = subtype.title;
      visual.dataset.subtypeId = subtype.id;
      group.appendChild(visual);
    });

    if (optgroup.children.length > 0) {
      select.appendChild(optgroup);
      selectFilter.appendChild(optgroup.cloneNode(true)); // Clone to filter select
    }

    listContainer.appendChild(group);
  });

  // Add selection behavior
  document.querySelectorAll(".issue-option").forEach((opt) => {
    opt.addEventListener("click", () => {
      document
        .querySelectorAll(".issue-option")
        .forEach((o) => o.classList.remove("selected"));
      opt.classList.add("selected");

      // Set the hidden select value
      const subtypeId = opt.dataset.subtypeId;
      document.getElementById("issue-types").value = subtypeId;

      // Show the form
      document.getElementById("issue-form").style.display = "block";

      //hide the issue type selector
      document.querySelector(".issue-type-selector").style.display = "none";

      // Optional scroll
      document
        .getElementById("issue-form")
        .scrollIntoView({ behavior: "smooth" });

      //automate title
      document.getElementById("issue-title").value =
        opt.textContent + " - " + document.getElementById("issue-title").value;
    });
  });
}





// ------------------------------------------ CUSTOM ATTRIBUTES ------------------------------------------------
async function getCustomAttributes(projectId, authToken) {
  const res = await fetch("/api/acc/getCustomAttributes", {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${authToken}`,
    },
    body: JSON.stringify({ projectId }),
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

  const match = window.customAttributeDefinitions.find(
    (attr) => attr.title === title
  );
  if (!match) {
    console.warn(`Attribute with title "${title}" not found`);
    return null;
  }

  return match.id;
}

// project members elligble for being assigned to or being watcher
async function getProjectMembers(projectId, authToken) {
  const res = await fetch("/api/acc/getProjectMembers", {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${authToken}`,
    },
    body: JSON.stringify({ projectId }),
  });

  if (!res.ok) {
    console.error("Failed to fetch issue types");
    return;
  }

  const { results } = await res.json(); // APS returns raw object with `results` array

  const select = document.getElementById("issue-assigned-to");
  const selectFilter = document.getElementById("issue-filter-assigned-to");
  const selectWatchers = document.getElementById("issue-watchers");
  select.innerHTML = ""; // clear old options
  selectWatchers.innerHTML = ""; // clear old options

  results.forEach((user) => {
    const option = document.createElement("option");
    option.value = user.autodeskId;
    option.textContent = user.name;
    option.setAttribute("data-type", "user"); // <-- Add this line
    select.appendChild(option);
    selectFilter.appendChild(option.cloneNode(true)); // Clone to filter select

    const watcherOption = document.createElement("option");
    watcherOption.value = user.autodeskId;
    watcherOption.textContent = user.name;
    watcherOption.setAttribute("data-type", "user"); // <-- Add this line
    selectWatchers.appendChild(watcherOption);
  });
}

// project members elligble for being assigned to or being watcher
async function getCompanies(projectId, authToken) {
  const res = await fetch("/api/acc/getCompanies", {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${authToken}`,
    },
    body: JSON.stringify({ projectId }),
  });

  if (!res.ok) {
    console.error("Failed to fetch issue types");
    return;
  }

  const { results } = await res.json(); // APS returns raw object with `results` array

  const select = document.getElementById("issue-assigned-to");
  const selectWatchers = document.getElementById("issue-watchers");

  results.forEach((companies) => {
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

  const watchersSelect = new Choices("#issue-watchers", {
    placeholderValue: "Select watchers",
    removeItemButton: true,
    shouldSort: false,
  });
}
