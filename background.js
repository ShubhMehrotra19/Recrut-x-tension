// ============================================
// ENHANCED BACKGROUND SERVICE WORKER
// ============================================

// Track extension state
let extensionReady = false;

// Listen for extension installation
chrome.runtime.onInstalled.addListener((details) => {
    console.log('✅ Scaler HR Intern Selector extension installed');
    console.log('Installation reason:', details.reason);

    // Clean up and create context menu
    setupContextMenu();

    // Initialize storage
    chrome.storage.local.get(['lastAnalysis'], (result) => {
        if (!result.lastAnalysis) {
            chrome.storage.local.set({ lastAnalysis: null });
        }
        console.log('💾 Storage initialized');
    });

    extensionReady = true;
});

// Set up context menu with error handling
function setupContextMenu() {
    chrome.contextMenus.removeAll(() => {
        chrome.contextMenus.create({
            id: 'analyzeLinkedInProfile',
            title: 'Analyze with Scaler HR Selector',
            contexts: ['page'],
            documentUrlPatterns: ['https://www.linkedin.com/*', 'https://linkedin.com/*']
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
    console.log('📨 Background received message:', {
        action: request.action,
        from: sender.tab ? `Tab ${sender.tab.id}` : 'Extension',
        timestamp: new Date().toISOString()
    });

    try {
        if (request.action === 'log') {
            console.log('[Content Script Log]:', request.message);
            sendResponse({ success: true, timestamp: Date.now() });
            return true;
        }

        if (request.action === 'saveAnalysis') {
            // Validate data before saving
            if (!request.data) {
                console.error('❌ No data provided for saveAnalysis');
                sendResponse({ success: false, error: 'No data provided' });
                return true;
            }

            // Save analysis to Chrome storage
            chrome.storage.local.set({
                lastAnalysis: {
                    ...request.data,
                    savedAt: new Date().toISOString()
                }
            }, () => {
                if (chrome.runtime.lastError) {
                    console.error('❌ Storage error:', chrome.runtime.lastError);
                    sendResponse({
                        success: false,
                        error: chrome.runtime.lastError.message
                    });
                } else {
                    console.log('💾 Analysis saved to storage');
                    sendResponse({ success: true });
                }
            });
            return true; // Required for async sendResponse
        }

        if (request.action === 'getLastAnalysis') {
            chrome.storage.local.get(['lastAnalysis'], (result) => {
                sendResponse({
                    success: true,
                    data: result.lastAnalysis
                });
            });
            return true;
        }

        if (request.action === 'ping') {
            sendResponse({
                success: true,
                message: 'Background service worker is alive',
                ready: extensionReady
            });
            return true;
        }

        // Unknown action
        console.warn('⚠️ Unknown action:', request.action);
        sendResponse({
            success: false,
            error: 'Unknown action: ' + request.action
        });

    } catch (error) {
        console.error('❌ Error handling message:', error);
        sendResponse({
            success: false,
            error: error.message
        });
    }

    return true; // Keep message channel open
});

// Handle context menu click
chrome.contextMenus.onClicked.addListener((info, tab) => {
    console.log('🖱️ Context menu clicked:', info.menuItemId);

    if (info.menuItemId === 'analyzeLinkedInProfile') {
        // Verify we're on LinkedIn
        if (tab.url && tab.url.includes('linkedin.com')) {
            console.log('✅ Opening popup for LinkedIn profile');
            // Note: openPopup() only works in user gesture context
            chrome.action.openPopup();
        } else {
            console.warn('⚠️ Not on LinkedIn profile page');
        }
    }
});

// Monitor when service worker starts
console.log('🚀 Background service worker loaded at', new Date().toISOString());
extensionReady = true;

// Periodic health check (optional)
setInterval(() => {
    console.log('💓 Service worker heartbeat:', new Date().toISOString());
}, 60000); // Every minute

// Handle errors globally
self.addEventListener('error', (event) => {
    console.error('❌ Global error in service worker:', event.error);
});

self.addEventListener('unhandledrejection', (event) => {
    console.error('❌ Unhandled promise rejection:', event.reason);
});