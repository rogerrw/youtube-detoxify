# YouTube Detoxify Chrome Extension

YouTube is great--there's all kinds of amazing and helpful content on the platform for good purposes. Educational videos, tutorials, fun and interesting content, etc. etc. However, there's also ways that we can use YouTube addictively, and ways that YouTube itself promotes addictive usage (shorts, suggestions, autoplay) that keep a user's attention locked into the platform.

This extension is an attempt to make YouTube work FOR the person, rather than pulling the person in beyond their will.

## Setup Instructions

### 1. Load the Extension in Chrome

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" (toggle in the top right)
3. Click "Load unpacked"
4. Select the `youtube-detoxify` folder
5. The extension should now appear in your extensions list

### 2. Pin the Extension (Optional)

1. Click the puzzle piece icon in Chrome's toolbar
2. Find "YouTube Detoxify" and click the pin icon to keep it visible

## Technologies Used

- **HTML/CSS/JavaScript**: Standard web technologies for Chrome extensions
- **Chrome Extension Manifest V3**: Latest extension API
- **Chrome Storage API**: For persisting user data and settings

### Key Files

- `manifest.json`: Defines permissions, content scripts, and extension metadata
- `popup.html/js/css`: The extension popup interface
- `content.js`: Runs on YouTube pages to track usage and handle blocking
- `embed-detector.js`: Detects and blocks YouTube videos embedded on any website
- `background.js`: Service worker for background tasks and daily resets

## Troubleshooting

- **Extension not loading**: Make sure all files are in the correct location and `manifest.json` is valid
- **Icons not showing**: Ensure the `icons` folder exists with all three icon files
- **Stats not updating**: Check that "Enable time tracking" is checked in the popup
- **Blocking not working**: Make sure "Enable blocking" is checked and you've refreshed the YouTube page

## Permissions Explained

- `storage`: Used to save your statistics and settings
- `activeTab`: Allows the extension to interact with YouTube tabs
- `host_permissions` (youtube.com, youtube-nocookie.com, youtu.be): Required for content scripts to run on YouTube and to fetch video information for embedded videos
- Content scripts run on all websites to detect embedded YouTube videos

## License

This project is open source and available for personal use and modification.
