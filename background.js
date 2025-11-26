// ============================================
// BACKGROUND SERVICE WORKER - FIXED
// ============================================

// Listen for extension installation
chrome.runtime.onInstalled.addListener(() => {
    console.log('✅ Scaler HR Intern Selector extension installed');

    // Set up context menu after installation
    setupContextMenu();
});

// Function to set up context menu with proper error handling
function setupContextMenu() {
    // Remove any existing context menus first
    chrome.contextMenus.removeAll(() => {
        // Create new context menu
        chrome.contextMenus.create({
            id: 'analyzeLinkedInProfile',
            title: 'Analyze with Scaler HR Selector',
            contexts: ['page'],
            documentUrlPatterns: [
                'https://www.linkedin.com/*',
                'https://linkedin.com/*'
            ]
        }, () => {
            if (chrome.runtime.lastError) {
                console.error('❌ Context menu error:', chrome.runtime.lastError.message);
            } else {
                console.log('✅ Context menu created successfully');
            }
        });
    });
}

// Handle messages between popup and content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('📨 Background received message:', request);

    if (request.action === 'log') {
        console.log('[Content Script Log]:', request.message);
        sendResponse({ success: true });
        return true;
    }

    if (request.action === 'saveAnalysis') {
        // Save analysis to Chrome storage for reference
        chrome.storage.local.set({
            lastAnalysis: request.data
        }, () => {
            if (chrome.runtime.lastError) {
                console.error('❌ Storage error:', chrome.runtime.lastError);
                sendResponse({ success: false, error: chrome.runtime.lastError.message });
            } else {
                console.log('💾 Analysis saved to storage');
                sendResponse({ success: true });
            }
        });
        return true; // Required for async response
    }

    // Default response
    sendResponse({ success: false, error: 'Unknown action' });
    return true;
});

// Handle context menu click
chrome.contextMenus.onClicked.addListener((info, tab) => {
    console.log('🖱️ Context menu clicked');

    if (info.menuItemId === 'analyzeLinkedInProfile') {
        // Open extension popup
        // Note: This may not work in all contexts
        // User can also click the extension icon
        console.log('✅ Analyze LinkedIn Profile action triggered');
    }
});

console.log('✅ Background service worker loaded');