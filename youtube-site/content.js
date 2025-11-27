// Content script that runs on YouTube pages

// Helper function to safely call chrome.storage APIs
async function safeStorageGet(keys) {
  try {
    if (!chrome?.storage?.local) {
      return {};
    }
    return await chrome.storage.local.get(keys);
  } catch (error) {
    if (error.message.includes("Extension context invalidated")) {
      console.log(
        "Extension context invalidated, page will need to be refreshed"
      );
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
      console.log(
        "Extension context invalidated, page will need to be refreshed"
      );
      return;
    }
    throw error;
  }
}

(async () => {
  try {
    // Check if blocking is enabled
    const result = await safeStorageGet([
      "isBlocked",
      "enableBlocking",
      "allowlistKeywords",
    ]);

    if (result.enableBlocking && result.isBlocked) {
      // Check if current video matches allowlist
      const isAllowed = await checkAllowlist(result.allowlistKeywords || []);
      if (!isAllowed) {
        showBlockPage();
        return;
      }
    }

    // Track time if enabled
    if (result.enableTracking !== false) {
      trackTime();
      trackVisit();
    }
  } catch (error) {
    console.error("Error in content script:", error);
  }
})();

async function checkAllowlist(keywords) {
  // Only check allowlist on video pages
  if (!window.location.pathname.includes("/watch")) {
    return false; // Not a video page, so blocking applies
  }

  if (keywords.length === 0) {
    return false; // No keywords, so blocking applies
  }

  // Try to get video title with retries (YouTube loads content dynamically)
  let videoTitle = await getVideoTitle();

  if (!videoTitle) {
    // Wait a bit and try again
    await new Promise((resolve) => setTimeout(resolve, 500));
    videoTitle = await getVideoTitle();
  }

  if (!videoTitle) {
    return false; // Can't find title, apply blocking
  }

  // Check if any keyword matches (case-insensitive)
  const titleLower = videoTitle.toLowerCase();
  return keywords.some((keyword) => titleLower.includes(keyword.toLowerCase()));
}

function getVideoTitle() {
  // Try multiple selectors to get video title (YouTube changes these sometimes)
  const titleSelectors = [
    "h1.ytd-watch-metadata yt-formatted-string",
    "h1.ytd-video-primary-info-renderer yt-formatted-string",
    "h1.title.style-scope.ytd-video-primary-info-renderer",
    "h1.ytd-watch-metadata",
    ".watch-main-col h1",
    "ytd-watch-metadata h1",
  ];

  for (const selector of titleSelectors) {
    const element = document.querySelector(selector);
    if (element) {
      const title = element.textContent || element.innerText || "";
      if (title.trim()) {
        return title.trim();
      }
    }
  }

  // Fallback: try to get title from page title
  const pageTitle = document.title.replace(" - YouTube", "").trim();
  if (pageTitle && pageTitle !== "YouTube") {
    return pageTitle;
  }

  return null;
}

function showBlockPage() {
  // Hide YouTube content
  document.body.innerHTML = "";
  document.body.style.margin = "0";
  document.body.style.padding = "0";
  document.body.style.fontFamily =
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';

  // Create block page
  const blockDiv = document.createElement("div");
  blockDiv.className = "youtube-block-page";
  blockDiv.innerHTML = `
    <div style="
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100vh;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      text-align: center;
      padding: 20px;
    ">
      <h1 style="font-size: 48px; margin-bottom: 20px;">🚫</h1>
      <h2 style="font-size: 32px; margin-bottom: 15px; font-weight: 600;">YouTube is Blocked</h2>
      <p style="font-size: 18px; margin-bottom: 30px; opacity: 0.9;">
        You've chosen to block YouTube. Take a break and do something productive!
      </p>
      <button id="unblockBtn" style="
        padding: 12px 24px;
        font-size: 16px;
        background: white;
        color: #667eea;
        border: none;
        border-radius: 6px;
        cursor: pointer;
        font-weight: 600;
      ">Unblock YouTube</button>
    </div>
  `;

  document.body.appendChild(blockDiv);

  // Handle unblock button
  document.getElementById("unblockBtn").addEventListener("click", async () => {
    try {
      await safeStorageSet({ isBlocked: false });
      location.reload();
    } catch (error) {
      console.error("Error unblocking:", error);
      // Still reload even if storage fails
      location.reload();
    }
  });
}

async function trackTime() {
  try {
    // Get current time tracking data
    const result = await safeStorageGet([
      "timeToday",
      "lastActiveTime",
      "today",
    ]);

    const now = new Date();
    const today = now.toDateString();

    // Reset if it's a new day
    if (result.today !== today) {
      await safeStorageSet({
        timeToday: 0,
        visitsToday: 0,
        today: today,
      });
    }

    // Track active time
    let timeToday = result.timeToday || 0;
    const lastActiveTime = result.lastActiveTime;

    if (lastActiveTime) {
      const timeDiff = Math.floor((now - new Date(lastActiveTime)) / 1000 / 60);
      if (timeDiff > 0 && timeDiff < 60) {
        // Only count if less than 60 minutes (prevents large jumps)
        timeToday += timeDiff;
        await safeStorageSet({ timeToday });
      }
    }

    // Update last active time
    await safeStorageSet({ lastActiveTime: now.toISOString() });

    // Update every minute
    setInterval(async () => {
      try {
        const currentResult = await safeStorageGet([
          "timeToday",
          "lastActiveTime",
        ]);
        const currentTime = new Date();
        const lastTime = new Date(currentResult.lastActiveTime);
        const timeDiff = Math.floor((currentTime - lastTime) / 1000 / 60);

        if (timeDiff > 0 && timeDiff < 60) {
          const newTime = (currentResult.timeToday || 0) + timeDiff;
          await safeStorageSet({
            timeToday: newTime,
            lastActiveTime: currentTime.toISOString(),
          });
        }
      } catch (error) {
        // Silently fail if extension context is invalidated
        if (!error.message.includes("Extension context invalidated")) {
          console.error("Error updating time:", error);
        }
      }
    }, 60000); // Update every minute
  } catch (error) {
    console.error("Error in trackTime:", error);
  }
}

async function trackVisit() {
  try {
    const result = await safeStorageGet(["visitsToday", "today"]);
    const today = new Date().toDateString();

    if (result.today !== today) {
      await safeStorageSet({
        visitsToday: 1,
        today: today,
      });
    } else {
      const visitsToday = (result.visitsToday || 0) + 1;
      await safeStorageSet({ visitsToday });
    }
  } catch (error) {
    console.error("Error tracking visit:", error);
  }
}
