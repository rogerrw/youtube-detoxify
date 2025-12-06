// Background service worker for YouTube Detoxify

// Listen for extension installation
chrome.runtime.onInstalled.addListener(() => {
  console.log("YouTube Detoxify extension installed");

  // Initialize default settings
  chrome.storage.local.set({
    allowlistKeywords: [],
    allowlistChannels: [],
  });
});
