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

// Function to perform allowlist check
async function performAllowlistCheck() {
  try {
    // Get allowlist settings
    const { allowlistKeywords, allowlistChannels } = await safeStorageGet([
      "allowlistKeywords",
      "allowlistChannels",
    ]);

    console.log("allowlistKeywords", allowlistKeywords);
    console.log("allowlistChannels", allowlistChannels);

    // Always check allowlists - blocking is always enabled
    const isAllowed = await checkAllowlist(
      allowlistKeywords || [],
      allowlistChannels || []
    );
    if (!isAllowed) {
      redirectToBlockedPage();
      return;
    }
  } catch (error) {
    console.error("Error in allowlist check:", error);
  }
}

// Initial check on page load
(async () => {
  await performAllowlistCheck();
})();

// Watch for URL changes
(function watchUrlChanges() {
  let currentUrl = window.location.href;

  // Function to check if URL changed and trigger allowlist check
  function checkUrlChange() {
    const newUrl = window.location.href;
    if (newUrl !== currentUrl) {
      currentUrl = newUrl;
      console.log("URL changed to:", currentUrl);

      // Wait for YouTube to load content, then check allowlist
      const delay = 500;

      setTimeout(() => {
        performAllowlistCheck();
      }, delay);
    }
  }

  // Override pushState to detect navigation
  const originalPushState = history.pushState;
  history.pushState = function (...args) {
    originalPushState.apply(history, args);
    checkUrlChange();
  };

  // Override replaceState to detect navigation
  const originalReplaceState = history.replaceState;
  history.replaceState = function (...args) {
    originalReplaceState.apply(history, args);
    checkUrlChange();
  };

  // Listen for popstate (back/forward navigation)
  window.addEventListener("popstate", checkUrlChange);

  // Watch for URL changes using MutationObserver (for YouTube's SPA navigation)
  // Only observe significant changes to avoid too many checks
  const observer = new MutationObserver(() => {
    setTimeout(checkUrlChange, 200);
  });

  // Observe changes to the document body
  if (document.body) {
    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
  } else {
    // Wait for body to be available
    document.addEventListener("DOMContentLoaded", () => {
      observer.observe(document.body, {
        childList: true,
        subtree: true,
      });
    });
  }

  // Periodic check as fallback (less frequent)
  setInterval(checkUrlChange, 2000);
})();

async function checkAllowlist(keywords, channels) {
  // Only check allowlist on video pages (URLs starting with /watch?)
  const isVideoPage =
    window.location.pathname.startsWith("/watch") ||
    window.location.href.includes("youtube.com/watch");

  console.log("isVideoPage", isVideoPage);
  if (!isVideoPage) {
    return true; // Not a video page, so allow all videos
  }

  // If both allowlists are empty, block all videos by default
  if (keywords.length === 0 && channels.length === 0) {
    return false; // Block: no allowlists configured, default to blocking
  }

  let channelMatches = false;
  let keywordMatches = false;

  // Check channel allowlist
  if (channels.length > 0) {
    const channelName = getChannelName();
    if (channelName) {
      const channelLower = channelName.toLowerCase();
      channelMatches = channels.some((channel) =>
        channelLower.includes(channel.toLowerCase())
      );
    }
  }

  // Check title keywords allowlist
  if (keywords.length > 0) {
    // Try to get video title with retries (YouTube loads content dynamically)
    let videoTitle = await getVideoTitle();

    if (!videoTitle) {
      // Wait a bit and try again
      await new Promise((resolve) => setTimeout(resolve, 500));
      videoTitle = await getVideoTitle();
    }

    if (videoTitle) {
      // Check if any keyword matches (case-insensitive)
      const titleLower = videoTitle.toLowerCase();
      keywordMatches = keywords.some((keyword) =>
        titleLower.includes(keyword.toLowerCase())
      );
    }
  }

  // Block if:
  // 1. Channel is NOT in allowlist (or channels list is empty), AND
  // 2. Title does NOT have allowlist keyword (or keywords list is empty)
  // Allow if either channel matches OR title keyword matches
  const shouldBlock = !channelMatches && !keywordMatches;
  return !shouldBlock; // Return true to allow, false to block
}

function getChannelName() {
  // Try multiple selectors to get channel name (YouTube changes these sometimes)
  const channelSelectors = [
    "ytd-channel-name a",
    "ytd-video-owner-renderer #channel-name a",
    "ytd-channel-name #text",
    "ytd-video-owner-renderer #channel-name #text",
    ".ytd-channel-name a",
    "#owner-sub-count a",
    "#channel-name a",
  ];

  for (const selector of channelSelectors) {
    const element = document.querySelector(selector);
    if (element) {
      const channelName = element.textContent || element.innerText || "";
      if (channelName.trim()) {
        return channelName.trim();
      }
    }
  }

  // Fallback: try to get from link href
  const channelLink = document.querySelector(
    'ytd-channel-name a[href*="/channel/"], ytd-channel-name a[href*="/c/"], ytd-channel-name a[href*="/user/"], ytd-channel-name a[href*="/@"]'
  );
  if (channelLink) {
    const channelName = channelLink.textContent || channelLink.innerText || "";
    if (channelName.trim()) {
      return channelName.trim();
    }
  }

  return null;
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

function redirectToBlockedPage() {
  // Get the extension's blocked page URL
  const blockedPageUrl = chrome.runtime.getURL("blocked.html");
  // Redirect to the blocked page
  window.location.replace(blockedPageUrl);
}
