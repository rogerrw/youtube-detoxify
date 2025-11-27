# Quick Setup Guide

## Prerequisites

- Google Chrome browser
- Basic understanding of file systems (creating folders, navigating directories)

## Step-by-Step Setup

### Step 1: Add Extension Icons

1. Create a folder named `icons` in the project directory
2. Add three PNG image files:
   - `icon16.png` (16x16 pixels)
   - `icon48.png` (48x48 pixels)
   - `icon128.png` (128x128 pixels)

**Quick Option**: You can create simple placeholder icons using any image editor, or download free icons from sites like:

- [Flaticon](https://www.flaticon.com)
- [Icons8](https://icons8.com)
- Or use a simple colored square as a temporary placeholder

### Step 2: Load Extension in Chrome

1. **Open Chrome Extensions Page**

   - Type `chrome://extensions/` in the address bar, OR
   - Go to Menu (three dots) → Extensions → Manage Extensions

2. **Enable Developer Mode**

   - Toggle the "Developer mode" switch in the top-right corner

3. **Load the Extension**

   - Click the "Load unpacked" button
   - Navigate to and select the `youtube-detoxify` folder
   - Click "Select Folder" (or "Open" on Mac)

4. **Verify Installation**
   - You should see "YouTube Detoxify" in your extensions list
   - If there are any errors, check the error message and verify all files are present

### Step 3: Test the Extension

1. **Open the Extension Popup**

   - Click the extension icon in Chrome's toolbar (you may need to pin it first)
   - You should see the popup with statistics and controls

2. **Visit YouTube**

   - Go to `https://www.youtube.com`
   - The extension should start tracking your usage

3. **Test Blocking**
   - Click "Block YouTube" in the popup
   - Refresh the YouTube page
   - You should see the block page instead of YouTube

## Common Issues

### "Manifest file is missing or unreadable"

- Make sure you selected the correct folder (the one containing `manifest.json`)
- Verify `manifest.json` exists and is not corrupted

### "Icons are missing"

- Create the `icons` folder if it doesn't exist
- Add the three required icon files (icon16.png, icon48.png, icon128.png)
- Reload the extension

### "Extension not working on YouTube"

- Make sure you're visiting `https://www.youtube.com` (not `http://`)
- Check that the extension is enabled in `chrome://extensions/`
- Try refreshing the YouTube page

### "Statistics not updating"

- Open the popup and verify "Enable time tracking" is checked
- Make sure you're actually on a YouTube page (not just the extension popup)

## Verifying Everything Works

✅ Extension appears in `chrome://extensions/`  
✅ Extension icon appears in Chrome toolbar  
✅ Popup opens when clicking the icon  
✅ Statistics show in the popup  
✅ Visiting YouTube tracks your usage  
✅ Block button shows block page on YouTube  
✅ Unblock button restores YouTube access

## Next Steps After Setup

Once everything is working:

1. **Customize the Design**: Edit `popup.css` and `content.js` to change colors, fonts, and layout
2. **Add Features**: See the main README.md for customization ideas
3. **Test Thoroughly**: Use the extension for a few days to ensure it works as expected
4. **Share or Publish**: Consider sharing with others or publishing to the Chrome Web Store

## Getting Help

If you encounter issues:

1. Check the browser console (F12) for error messages
2. Check the extension's service worker logs in `chrome://extensions/`
3. Verify all files are in the correct locations
4. Make sure you're using a recent version of Chrome
