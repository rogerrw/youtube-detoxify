// Content script to detect and handle embedded YouTube videos on any website

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

(async () => {
  try {
    console.log("window.location", window.location);
    // Only run on pages that aren't YouTube itself
    if (
      window.location.hostname === "www.youtube.com" ||
      window.location.hostname === "youtube.com"
    ) {
      return;
    }

    // Check if blocking is enabled
    const result = await safeStorageGet([
      "isBlocked",
      "enableBlocking",
      "allowlistKeywords",
    ]);

    console.log("result", result);

    if (result.enableBlocking) {
      // Find and process all YouTube iframes
      await processYouTubeEmbeds(result.allowlistKeywords || []);

      // Watch for dynamically added iframes
      observeNewEmbeds(result.allowlistKeywords || []);
    }
  } catch (error) {
    console.error("Error in embed detector:", error);
  }
})();

async function processYouTubeEmbeds(keywords) {
  const iframes = document.querySelectorAll("iframe");

  for (const iframe of iframes) {
    const src = iframe.src || iframe.getAttribute("src") || "";
    if (isYouTubeEmbed(src)) {
      console.log("iframe", iframe);
      const videoId = extractVideoId(src);
      if (videoId) {
        const shouldBlock = await shouldBlockEmbed(videoId, keywords);
        if (shouldBlock) {
          blockEmbeddedVideo(iframe);
        }
      }
    }
  }
}

function observeNewEmbeds(keywords) {
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        if (node.nodeType === 1) {
          // Check if the added node is an iframe
          if (node.tagName === "IFRAME") {
            const src = node.src || node.getAttribute("src") || "";
            if (isYouTubeEmbed(src)) {
              const videoId = extractVideoId(src);
              if (videoId) {
                shouldBlockEmbed(videoId, keywords).then((shouldBlock) => {
                  if (shouldBlock) {
                    blockEmbeddedVideo(node);
                  }
                });
              }
            }
          }
          // Check for iframes inside the added node
          const iframes = node.querySelectorAll?.("iframe");
          if (iframes) {
            iframes.forEach((iframe) => {
              const src = iframe.src || iframe.getAttribute("src") || "";
              if (isYouTubeEmbed(src)) {
                const videoId = extractVideoId(src);
                if (videoId) {
                  shouldBlockEmbed(videoId, keywords).then((shouldBlock) => {
                    if (shouldBlock) {
                      blockEmbeddedVideo(iframe);
                    }
                  });
                }
              }
            });
          }
        }
      });
    });
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });
}

function isYouTubeEmbed(src) {
  if (!src) return false;
  return (
    src.includes("youtube.com/embed/") ||
    src.includes("youtube-nocookie.com/embed/") ||
    src.includes("youtube.com/v/") ||
    src.includes("youtu.be/")
  );
}

function extractVideoId(src) {
  // Extract video ID from various YouTube embed URL formats
  const patterns = [
    /(?:embed|v)\/([a-zA-Z0-9_-]{11})/, // youtube.com/embed/VIDEO_ID or youtube.com/v/VIDEO_ID
    /youtu\.be\/([a-zA-Z0-9_-]{11})/, // youtu.be/VIDEO_ID
    /[?&]v=([a-zA-Z0-9_-]{11})/, // youtube.com/watch?v=VIDEO_ID (in iframe src)
  ];

  for (const pattern of patterns) {
    const match = src.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }

  return null;
}

async function shouldBlockEmbed(videoId, keywords) {
  if (keywords.length === 0) {
    return true; // No keywords, block all
  }

  // Try to get video title using YouTube oEmbed API
  try {
    const title = await getVideoTitleFromAPI(videoId);
    if (!title) {
      return true; // Can't get title, block it
    }

    // Check if any keyword matches (case-insensitive)
    const titleLower = title.toLowerCase();
    const matches = keywords.some((keyword) =>
      titleLower.includes(keyword.toLowerCase())
    );

    return !matches; // Block if no keywords match
  } catch (error) {
    console.log("Error fetching video title:", error);
    return true; // On error, block it
  }
}

async function getVideoTitleFromAPI(videoId) {
  try {
    // Use YouTube oEmbed API (no API key required for public videos)
    const response = await fetch(
      `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`
    );

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return data.title || null;
  } catch (error) {
    console.log("Error fetching video title from oEmbed:", error);
    return null;
  }
}

function blockEmbeddedVideo(iframe) {
  // Store original iframe attributes
  const originalSrc = iframe.src;
  const originalStyle = iframe.style.cssText;
  const parent = iframe.parentElement;
  parent.classList.add("youtube-embed-block");
  // Hide the iframe
  iframe.style.display = "none";
  iframe.setAttribute("data-youtube-detoxify-blocked", "true");
  iframe.setAttribute("data-youtube-detoxify-original-src", originalSrc);
}
