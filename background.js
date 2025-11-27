// Background service worker for YouTube Detoxify

// Listen for extension installation
chrome.runtime.onInstalled.addListener(() => {
  console.log("YouTube Detoxify extension installed");

  // Initialize default settings
  chrome.storage.local.set({
    enableTracking: true,
    enableBlocking: true,
    isBlocked: false,
    timeToday: 0,
    visitsToday: 0,
    today: new Date().toDateString(),
    allowlistKeywords: [],
  });
});

function getNextMidnight() {
  const now = new Date();
  const midnight = new Date();
  midnight.setHours(24, 0, 0, 0);
  return midnight.getTime();
}
