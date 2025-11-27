# YouTube Detoxify Chrome Extension

A Chrome extension to help you manage and reduce your YouTube usage through time tracking, visit monitoring, and optional blocking features.

## Features

- **Time Tracking**: Monitor how much time you spend on YouTube each day
- **Visit Tracking**: Count how many times you visit YouTube per day
- **Blocking**: Optionally block access to YouTube with a customizable block page
- **Allowlist Keywords**: Allow videos with specific keywords in their titles (e.g., "tutorial", "educational")
- **Embedded Video Detection**: Automatically detects and blocks YouTube videos embedded on any website
- **Daily Reset**: Statistics automatically reset at midnight
- **Settings**: Toggle tracking and blocking features on/off

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

## Usage

1. **View Statistics**: Click the extension icon to see your daily time and visit statistics
2. **Block YouTube**: Click "Block YouTube" to prevent access to YouTube (requires page refresh)
3. **Unblock YouTube**: Click "Unblock YouTube" to restore access
4. **Toggle Features**: Use the checkboxes to enable/disable tracking and blocking
5. **Manage Allowlist**: Add keywords to the allowlist - videos with these keywords in their titles will not be blocked
6. **Embedded Videos**: When blocking is enabled, YouTube videos embedded on other websites will also be blocked (unless they match your allowlist keywords)

## Development

### Technologies Used

- **HTML/CSS/JavaScript**: Standard web technologies for Chrome extensions
- **Chrome Extension Manifest V3**: Latest extension API
- **Chrome Storage API**: For persisting user data and settings

### Key Files

- `manifest.json`: Defines permissions, content scripts, and extension metadata
- `popup.html/js/css`: The extension popup interface
- `content.js`: Runs on YouTube pages to track usage and handle blocking
- `embed-detector.js`: Detects and blocks YouTube videos embedded on any website
- `background.js`: Service worker for background tasks and daily resets

## Customization Ideas

Here are some features you might want to add:

- **Time Limits**: Set daily time limits with automatic blocking
- **Break Reminders**: Show notifications after X minutes of usage
- **Whitelist Channels**: Allow specific channels while blocking others
- **Weekly Reports**: Track usage over time with charts
- **Focus Mode**: Block recommendations and sidebar to reduce distractions
- **Custom Block Messages**: Personalize the block page with your own message

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

## Next Steps

1. Add the icon files to the `icons/` folder
2. Customize the block page design
3. Add any additional features you'd like
4. Test the extension thoroughly
5. Consider publishing to the Chrome Web Store (requires additional setup)

## License

This project is open source and available for personal use and modification.
