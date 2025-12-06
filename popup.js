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
    // Load allowlists
    await loadAllowlists();

    // Set up event listeners
    setupEventListeners();
  } catch (error) {
    console.error("Error initializing popup:", error);
  }
});

function setupEventListeners() {

  // Title keyword allowlist management
  const keywordInput = document.getElementById("keywordInput");
  const addKeywordBtn = document.getElementById("addKeywordBtn");

  if (addKeywordBtn) {
    addKeywordBtn.addEventListener("click", async () => {
      await addKeyword();
    });
  }

  if (keywordInput) {
    keywordInput.addEventListener("keypress", async (e) => {
      if (e.key === "Enter") {
        await addKeyword();
      }
    });
  }

  // Channel allowlist management
  const channelInput = document.getElementById("channelInput");
  const addChannelBtn = document.getElementById("addChannelBtn");

  if (addChannelBtn) {
    addChannelBtn.addEventListener("click", async () => {
      await addChannel();
    });
  }

  if (channelInput) {
    channelInput.addEventListener("keypress", async (e) => {
      if (e.key === "Enter") {
        await addChannel();
      }
    });
  }
}

async function loadAllowlists() {
  try {
    const result = await safeStorageGet([
      "allowlistKeywords",
      "allowlistChannels",
    ]);
    const keywords = result.allowlistKeywords || [];
    const channels = result.allowlistChannels || [];
    displayKeywords(keywords);
    displayChannels(channels);
  } catch (error) {
    console.error("Error loading allowlists:", error);
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

function displayChannels(channels) {
  const channelsList = document.getElementById("channelsList");
  if (!channelsList) return;

  channelsList.innerHTML = "";

  channels.forEach((channel, index) => {
    const channelItem = document.createElement("div");
    channelItem.className = "keyword-item";
    channelItem.innerHTML = `
      <span class="keyword-text">${escapeHtml(channel)}</span>
      <button class="btn btn-remove" data-index="${index}">Remove</button>
    `;
    channelsList.appendChild(channelItem);

    // Add remove event listener
    channelItem
      .querySelector(".btn-remove")
      .addEventListener("click", async () => {
        await removeChannel(index);
      });
  });
}

async function addChannel() {
  try {
    const channelInput = document.getElementById("channelInput");
    const channel = channelInput.value.trim();

    if (!channel) {
      return;
    }

    const result = await safeStorageGet(["allowlistChannels"]);
    const channels = result.allowlistChannels || [];

    // Check if channel already exists (case-insensitive)
    const channelLower = channel.toLowerCase();
    if (channels.some((c) => c.toLowerCase() === channelLower)) {
      alert("This channel is already in the allowlist.");
      channelInput.value = "";
      return;
    }

    channels.push(channel);
    await safeStorageSet({ allowlistChannels: channels });
    channelInput.value = "";
    displayChannels(channels);
  } catch (error) {
    console.error("Error adding channel:", error);
    alert("Error adding channel. Please try again.");
  }
}

async function removeChannel(index) {
  try {
    const result = await safeStorageGet(["allowlistChannels"]);
    const channels = result.allowlistChannels || [];
    channels.splice(index, 1);
    await safeStorageSet({ allowlistChannels: channels });
    displayChannels(channels);
  } catch (error) {
    console.error("Error removing channel:", error);
    alert("Error removing channel. Please try again.");
  }
}

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}
