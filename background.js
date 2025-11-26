// ============================================
// BACKGROUND SERVICE WORKER
// ============================================

// Listen for extension installation
chrome.runtime.onInstalled.addListener(() => {
    console.log('✅ Scaler HR Intern Selector extension installed');
});

// Handle messages between popup and content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('📨 Background received message:', request);

    if (request.action === 'log') {
        console.log('[Content Script Log]:', request.message);
    }

    if (request.action === 'saveAnalysis') {
        // Save analysis to Chrome storage for reference
        chrome.storage.local.set({
            lastAnalysis: request.data
        }, () => {
            console.log('💾 Analysis saved to storage');
        });
    }
});

// Set up context menu for quick access
chrome.contextMenus.create({
    id: 'analyzeLinkedInProfile',
    title: 'Analyze with Scaler HR Selector',
    contexts: ['page'],
    documentUrlPatterns: ['https://www.linkedin.com/*']
}, () => {
    if (chrome.runtime.lastError) {
        console.log('Context menu creation note:', chrome.runtime.lastError);
    }
});

// Handle context menu click
chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === 'analyzeLinkedInProfile') {
        // Open extension popup
        chrome.action.openPopup();
    }
});

console.log('✅ Background service worker loaded');