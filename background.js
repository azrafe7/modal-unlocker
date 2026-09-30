chrome.action.onClicked.addListener(async (tab) => {
  if (!tab.id) return;
  try {
    await chrome.scripting.executeScript({
      target: { tabId: tab.id, allFrames: false },
      files: ["content.js"]
    });
  } catch (err) {
    console.error("Could not inject into this page:", err);
  }
});
