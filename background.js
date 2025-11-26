// background.js - Service worker for Recrut-X-tension

// Listen for extension installation
chrome.runtime.onInstalled.addListener((details) => {
    if (details.reason === 'install') {
        console.log('Recrut-X-tension installed successfully!');

        // Set default settings
        chrome.storage.sync.set({
            autoAnalyze: false,
            matchScoreThreshold: 50,
            exportFormat: 'json'
        });
    } else if (details.reason === 'update') {
        console.log('Recrut-X-tension updated to version', chrome.runtime.getManifest().version);
    }
});

// Listen for messages from content script or popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'saveProfile') {
        // Save profile data to storage
        saveProfileToStorage(request.data)
            .then(() => sendResponse({success: true}))
            .catch(error => sendResponse({success: false, error: error.message}));
        return true;
    }

    if (request.action === 'getProfiles') {
        // Retrieve saved profiles
        getProfilesFromStorage()
            .then(profiles => sendResponse({success: true, profiles: profiles}))
            .catch(error => sendResponse({success: false, error: error.message}));
        return true;
    }
});

// Save profile data to Chrome storage
async function saveProfileToStorage(profileData) {
    return new Promise((resolve, reject) => {
        chrome.storage.local.get(['profiles'], (result) => {
            const profiles = result.profiles || [];

            // Add timestamp if not present
            if (!profileData.savedAt) {
                profileData.savedAt = new Date().toISOString();
            }

            // Check if profile already exists (by URL)
            const existingIndex = profiles.findIndex(p => p.url === profileData.url);

            if (existingIndex >= 0) {
                // Update existing profile
                profiles[existingIndex] = profileData;
            } else {
                // Add new profile
                profiles.push(profileData);
            }

            // Keep only last 100 profiles
            const trimmedProfiles = profiles.slice(-100);

            chrome.storage.local.set({ profiles: trimmedProfiles }, () => {
                if (chrome.runtime.lastError) {
                    reject(chrome.runtime.lastError);
                } else {
                    resolve();
                }
            });
        });
    });
}

// Retrieve profiles from storage
async function getProfilesFromStorage() {
    return new Promise((resolve, reject) => {
        chrome.storage.local.get(['profiles'], (result) => {
            if (chrome.runtime.lastError) {
                reject(chrome.runtime.lastError);
            } else {
                resolve(result.profiles || []);
            }
        });
    });
}

// Context menu integration (optional)
if (chrome.contextMenus) {
    chrome.runtime.onInstalled.addListener(() => {
        try {
            chrome.contextMenus.create({
                id: 'analyzeProfile',
                title: 'Analyze LinkedIn Profile',
                contexts: ['page'],
                documentUrlPatterns: ['https://*.linkedin.com/in/*']
            });
        } catch (error) {
            console.log('Context menu creation failed:', error);
        }
    });

    chrome.contextMenus.onClicked.addListener((info, tab) => {
        if (info.menuItemId === 'analyzeProfile') {
            // Trigger profile analysis
            chrome.tabs.sendMessage(tab.id, { action: 'scrapeProfile' });
        }
    });
}

// Badge update to show profile status
function updateBadge(text, color) {
    chrome.action.setBadgeText({ text: text });
    chrome.action.setBadgeBackgroundColor({ color: color });
}

// Listen for tab updates to detect LinkedIn profile pages
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete' && tab.url?.includes('linkedin.com/in/')) {
        try {
            updateBadge('✓', '#2ecc71');
        } catch (error) {
            console.log('Badge update failed:', error);
        }
    }
});