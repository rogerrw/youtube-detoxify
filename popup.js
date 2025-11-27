// Popup script for YouTube Detoxify extension

// Helper function to safely call chrome.storage APIs
async function safeStorageGet(keys) {
  try {
    if (!chrome?.storage?.local) {
      return {};
    }
    return await chrome.storage.local.get(keys);
  } catch (error) {
    if (error.message.includes("Extension context invalidated")) {
      console.log("Extension context invalidated");
      // Show error message to user
      document.body.innerHTML = `
        <div style="padding: 20px; text-align: center;">
          <p>Extension context invalidated. Please reload the extension.</p>
        </div>
      `;
      return {};
    }
    throw error;
  }
}

async function safeStorageSet(items) {
  try {
    if (!chrome?.storage?.local) {
      return;
    }
    await chrome.storage.local.set(items);
  } catch (error) {
    if (error.message.includes("Extension context invalidated")) {
      console.log("Extension context invalidated");
      alert("Extension context invalidated. Please reload the extension.");
      return;
    }
    throw error;
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  try {
    // Load and display stats
    await loadStats();

    // Load settings
    await loadSettings();

    // Load allowlist keywords
    await loadAllowlist();

    // Set up event listeners
    setupEventListeners();
  } catch (error) {
    console.error("Error initializing popup:", error);
  }
});

async function loadStats() {
  try {
    const result = await safeStorageGet(["timeToday", "visitsToday"]);

    const timeToday = result.timeToday || 0;
    const visitsToday = result.visitsToday || 0;

    // Format time
    const hours = Math.floor(timeToday / 60);
    const minutes = timeToday % 60;
    const timeElement = document.getElementById("timeToday");
    const visitsElement = document.getElementById("visitsToday");

    if (timeElement) {
      timeElement.textContent = `${hours}h ${minutes}m`;
    }
    if (visitsElement) {
      visitsElement.textContent = visitsToday;
    }
  } catch (error) {
    console.error("Error loading stats:", error);
  }
}

async function loadSettings() {
  try {
    const result = await safeStorageGet(["enableTracking", "enableBlocking"]);

    const trackingCheckbox = document.getElementById("enableTracking");
    const blockingCheckbox = document.getElementById("enableBlocking");

    if (trackingCheckbox) {
      trackingCheckbox.checked = result.enableTracking !== false;
    }
    if (blockingCheckbox) {
      blockingCheckbox.checked = result.enableBlocking !== false;
    }
  } catch (error) {
    console.error("Error loading settings:", error);
  }
}

function setupEventListeners() {
  // Block/Unblock buttons
  const blockBtn = document.getElementById("blockBtn");
  const unblockBtn = document.getElementById("unblockBtn");

  if (blockBtn) {
    blockBtn.addEventListener("click", async () => {
      try {
        await safeStorageSet({ isBlocked: true });
        try {
          chrome.tabs.query({ url: "https://www.youtube.com/*" }, (tabs) => {
            tabs.forEach((tab) => {
              chrome.tabs.reload(tab.id);
            });
          });
        } catch (error) {
          console.error("Error reloading tabs:", error);
        }
        alert("YouTube has been blocked. Refresh the page to see the effect.");
      } catch (error) {
        console.error("Error blocking YouTube:", error);
      }
    });
  }

  if (unblockBtn) {
    unblockBtn.addEventListener("click", async () => {
      try {
        await safeStorageSet({ isBlocked: false });
        try {
          chrome.tabs.query({ url: "https://www.youtube.com/*" }, (tabs) => {
            tabs.forEach((tab) => {
              chrome.tabs.reload(tab.id);
            });
          });
        } catch (error) {
          console.error("Error reloading tabs:", error);
        }
        alert("YouTube has been unblocked.");
      } catch (error) {
        console.error("Error unblocking YouTube:", error);
      }
    });
  }

  // Settings checkboxes
  const trackingCheckbox = document.getElementById("enableTracking");
  const blockingCheckbox = document.getElementById("enableBlocking");

  if (trackingCheckbox) {
    trackingCheckbox.addEventListener("change", async (e) => {
      try {
        await safeStorageSet({ enableTracking: e.target.checked });
      } catch (error) {
        console.error("Error updating tracking setting:", error);
      }
    });
  }

  if (blockingCheckbox) {
    blockingCheckbox.addEventListener("change", async (e) => {
      try {
        await safeStorageSet({ enableBlocking: e.target.checked });
      } catch (error) {
        console.error("Error updating blocking setting:", error);
      }
    });
  }

  // Allowlist keyword management
  const keywordInput = document.getElementById("keywordInput");
  const addKeywordBtn = document.getElementById("addKeywordBtn");

  addKeywordBtn.addEventListener("click", async () => {
    await addKeyword();
  });

  keywordInput.addEventListener("keypress", async (e) => {
    if (e.key === "Enter") {
      await addKeyword();
    }
  });
}

async function loadAllowlist() {
  try {
    const result = await safeStorageGet(["allowlistKeywords"]);
    const keywords = result.allowlistKeywords || [];
    displayKeywords(keywords);
  } catch (error) {
    console.error("Error loading allowlist:", error);
  }
}

function displayKeywords(keywords) {
  const keywordsList = document.getElementById("keywordsList");
  keywordsList.innerHTML = "";

  keywords.forEach((keyword, index) => {
    const keywordItem = document.createElement("div");
    keywordItem.className = "keyword-item";
    keywordItem.innerHTML = `
      <span class="keyword-text">${escapeHtml(keyword)}</span>
      <button class="btn btn-remove" data-index="${index}">Remove</button>
    `;
    keywordsList.appendChild(keywordItem);

    // Add remove event listener
    keywordItem
      .querySelector(".btn-remove")
      .addEventListener("click", async () => {
        await removeKeyword(index);
      });
  });
}

async function addKeyword() {
  try {
    const keywordInput = document.getElementById("keywordInput");
    const keyword = keywordInput.value.trim().toLowerCase();

    if (!keyword) {
      return;
    }

    const result = await safeStorageGet(["allowlistKeywords"]);
    const keywords = result.allowlistKeywords || [];

    // Check if keyword already exists
    if (keywords.includes(keyword)) {
      alert("This keyword is already in the allowlist.");
      keywordInput.value = "";
      return;
    }

    keywords.push(keyword);
    await safeStorageSet({ allowlistKeywords: keywords });
    keywordInput.value = "";
    displayKeywords(keywords);
  } catch (error) {
    console.error("Error adding keyword:", error);
    alert("Error adding keyword. Please try again.");
  }
}

async function removeKeyword(index) {
  try {
    const result = await safeStorageGet(["allowlistKeywords"]);
    const keywords = result.allowlistKeywords || [];
    keywords.splice(index, 1);
    await safeStorageSet({ allowlistKeywords: keywords });
    displayKeywords(keywords);
  } catch (error) {
    console.error("Error removing keyword:", error);
    alert("Error removing keyword. Please try again.");
  }
}

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}
