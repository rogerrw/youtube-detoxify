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

    // Get allowlist settings - blocking is always enabled
    const result = await safeStorageGet([
      "allowlistKeywords",
      "allowlistChannels",
    ]);

    console.log("result", result);

    // Always check allowlists - blocking is always enabled
    await processYouTubeEmbeds(
      result.allowlistKeywords || [],
      result.allowlistChannels || []
    );

    // Watch for dynamically added iframes
    observeNewEmbeds(
      result.allowlistKeywords || [],
      result.allowlistChannels || []
    );
  } catch (error) {
    console.error("Error in embed detector:", error);
  }
})();

async function processYouTubeEmbeds(keywords, channels) {
  const iframes = document.querySelectorAll("iframe");

  for (const iframe of iframes) {
    const src = iframe.src || iframe.getAttribute("src") || "";
    if (isYouTubeEmbed(src)) {
      console.log("iframe", iframe);
      const videoId = extractVideoId(src);
      if (videoId) {
        const shouldBlock = await shouldBlockEmbed(videoId, keywords, channels);
        if (shouldBlock) {
          blockEmbeddedVideo(iframe);
        }
      }
    }
  }
}

function observeNewEmbeds(keywords, channels) {
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
                shouldBlockEmbed(videoId, keywords, channels).then(
                  (shouldBlock) => {
                    if (shouldBlock) {
                      blockEmbeddedVideo(node);
                    }
                  }
                );
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
                  shouldBlockEmbed(videoId, keywords, channels).then(
                    (shouldBlock) => {
                      if (shouldBlock) {
                        blockEmbeddedVideo(iframe);
                      }
                    }
                  );
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

async function shouldBlockEmbed(videoId, keywords, channels) {
  // If both allowlists are empty, block all videos by default
  if (keywords.length === 0 && channels.length === 0) {
    return true; // Block: no allowlists configured, default to blocking
  }

  // Try to get video info using YouTube oEmbed API
  try {
    const videoInfo = await getVideoInfoFromAPI(videoId);
    if (!videoInfo) {
      return true; // Can't get info, block it
    }

    let channelMatches = false;
    let keywordMatches = false;

    // Check channel allowlist
    if (channels.length > 0 && videoInfo.author_name) {
      const channelLower = videoInfo.author_name.toLowerCase();
      channelMatches = channels.some((channel) =>
        channelLower.includes(channel.toLowerCase())
      );
    }

    // Check title keywords allowlist
    if (keywords.length > 0 && videoInfo.title) {
      const titleLower = videoInfo.title.toLowerCase();
      keywordMatches = keywords.some((keyword) =>
        titleLower.includes(keyword.toLowerCase())
      );
    }

    // Block if:
    // 1. Channel is NOT in allowlist (or channels list is empty), AND
    // 2. Title does NOT have allowlist keyword (or keywords list is empty)
    // Allow if either channel matches OR title keyword matches
    return !channelMatches && !keywordMatches;
  } catch (error) {
    console.log("Error fetching video info:", error);
    return true; // On error, block it
  }
}

async function getVideoInfoFromAPI(videoId) {
  try {
    // Use YouTube oEmbed API (no API key required for public videos)
    // This returns title and author_name (channel name)
    const response = await fetch(
      `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`
    );

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return {
      title: data.title || null,
      author_name: data.author_name || null,
    };
  } catch (error) {
    console.log("Error fetching video info from oEmbed:", error);
    return null;
  }
}

function blockEmbeddedVideo(iframe) {
  const parent = iframe.parentElement;
  parent.classList.add("youtube-embed-block");
  iframe.style.display = "none";
}
