document.addEventListener('DOMContentLoaded', () => {
    loadBlockedWebsites();
    loadFeatureSettings();
    setupEventListeners();
    checkTimerStatus();
    
    setInterval(checkTimerStatus, 1000);
});

function setupEventListeners() {
    document.querySelectorAll('.tab').forEach(tab => {
        tab.addEventListener('click', (e) => {
            const tabName = e.target.getAttribute('data-tab');
            switchTab(tabName, e.target);
        });
    });

    document.getElementById('addWebsiteBtn').addEventListener('click', addWebsite);

    document.getElementById('extremeMode').addEventListener('click', () => {
        toggleFeature('extremeMode');
    });

    document.getElementById('pomodoroMode').addEventListener('click', () => {
        toggleFeature('pomodoroMode');
    });

    document.querySelectorAll('.time-adjust-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const action = e.target.getAttribute('data-action');
            const target = e.target.getAttribute('data-target');
            adjustPomodoroTime(action, target);
        });
    });

    document.querySelectorAll('.time-input').forEach(input => {
        input.addEventListener('change', savePomodoroSettings);
    });

    document.getElementById('websiteInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            addWebsite();
        }
    });
}

function switchTab(tabName, clickedTab) {
    document.querySelectorAll('.tab').forEach(tab => {
        tab.classList.remove('active');
    });
    clickedTab.classList.add('active');

    document.querySelectorAll('.tab-panel').forEach(panel => {
        panel.classList.remove('active');
    });
    document.getElementById(tabName).classList.add('active');
}

function addWebsite() {
    const input = document.getElementById('websiteInput');
    const website = input.value.trim();

    if (!website) {
        alert('Please enter a website URL');
        return;
    }

    let cleanUrl = website.toLowerCase()
        .replace(/^https?:\/\//, '')
        .replace(/^www\./, '')
        .replace(/\/$/, '');

    if (!cleanUrl) {
        alert('Please enter a valid website URL');
        return;
    }

    chrome.storage.sync.get(['blockedWebsites'], (result) => {
        const blockedWebsites = result.blockedWebsites || [];
        
        if (blockedWebsites.includes(cleanUrl)) {
            alert('This website is already blocked');
            return;
        }

        blockedWebsites.push(cleanUrl);
        
        chrome.storage.sync.set({ blockedWebsites }, () => {
            input.value = '';
            loadBlockedWebsites();

        });
    });
}

function removeWebsite(website) {
    chrome.storage.sync.get(['blockedWebsites'], (result) => {
        const blockedWebsites = result.blockedWebsites || [];
        const updatedWebsites = blockedWebsites.filter(site => site !== website);
        
        chrome.storage.sync.set({ blockedWebsites: updatedWebsites }, () => {
            loadBlockedWebsites();

        });
    });
}

function loadBlockedWebsites() {
    chrome.storage.sync.get(['blockedWebsites'], (result) => {
        const userBlockedWebsites = result.blockedWebsites || [];
        const websiteList = document.getElementById('websiteList');
        
        const defaultWebsites = [
            'youtube.com',
            'twitch.tv', 
            'netflix.com',
            'instagram.com',
            'tiktok.com',
            'facebook.com',
            'x.com'
        ];

        const allWebsites = {
            default: defaultWebsites,
            user: userBlockedWebsites
        };
        
        websiteList.innerHTML = '';

        if (defaultWebsites.length === 0 && userBlockedWebsites.length === 0) {
            const emptyState = document.createElement('div');
            emptyState.className = 'empty-state';
            emptyState.textContent = 'No websites blocked yet. Add a website above to get started.';
            websiteList.appendChild(emptyState);
            return;
        }

        if (defaultWebsites.length > 0) {
            const defaultSection = document.createElement('div');
            defaultSection.className = 'website-list-section';
            
            const defaultHeader = document.createElement('h3');
            defaultHeader.className = 'section-header';
            defaultHeader.textContent = 'Default Blocked Websites';
            defaultSection.appendChild(defaultHeader);

            defaultWebsites.forEach(website => {
                const websiteItem = document.createElement('div');
                websiteItem.className = 'website-item default';
                
                const websiteUrl = document.createElement('span');
                websiteUrl.className = 'website-url';
                websiteUrl.textContent = website;
                
                const defaultBadge = document.createElement('span');
                defaultBadge.className = 'default-badge';
                defaultBadge.textContent = 'Default';
                
                websiteItem.appendChild(websiteUrl);
                websiteItem.appendChild(defaultBadge);
                defaultSection.appendChild(websiteItem);
            });
            
            websiteList.appendChild(defaultSection);
        }

        if (userBlockedWebsites.length > 0) {
            const userSection = document.createElement('div');
            userSection.className = 'website-list-section';
            
            const userHeader = document.createElement('h3');
            userHeader.className = 'section-header';
            userHeader.textContent = 'Custom Blocked Websites';
            userSection.appendChild(userHeader);

            userBlockedWebsites.forEach((website, index) => {
                const websiteItem = document.createElement('div');
                websiteItem.className = 'website-item';
                
                const websiteUrl = document.createElement('span');
                websiteUrl.className = 'website-url';
                websiteUrl.textContent = website;
                
                const removeBtn = document.createElement('button');
                removeBtn.className = 'remove-btn';
                removeBtn.textContent = 'Remove';
                removeBtn.setAttribute('data-website', website);
                removeBtn.setAttribute('data-index', index);
                
                removeBtn.addEventListener('click', (e) => {
                    const websiteToRemove = e.target.getAttribute('data-website');
                    removeWebsite(websiteToRemove);
                });
                
                websiteItem.appendChild(websiteUrl);
                websiteItem.appendChild(removeBtn);
                userSection.appendChild(websiteItem);
            });
            
            websiteList.appendChild(userSection);
        }
    });
}

function toggleFeature(featureId) {
    const toggle = document.getElementById(featureId);
    const isActive = toggle.classList.contains('active');
    
    if (isActive) {
        toggle.classList.remove('active');
    } else {
        toggle.classList.add('active');
    }

    const featureState = !isActive;
    const storageKey = featureId + 'Enabled';
    chrome.storage.sync.set({ [storageKey]: featureState });

    if (featureId === 'pomodoroMode') {
        const pomodoroSettings = document.getElementById('pomodoroSettings');
        if (featureState) {
            pomodoroSettings.classList.add('enabled');
        } else {
            pomodoroSettings.classList.remove('enabled');
        }
    }
}

function loadFeatureSettings() {
    chrome.storage.sync.get(['extremeModeEnabled', 'pomodoroModeEnabled'], (result) => {
        const extremeModeEnabled = result.extremeModeEnabled || false;
        const extremeModeToggle = document.getElementById('extremeMode');
        
        if (extremeModeEnabled) {
            extremeModeToggle.classList.add('active');
        }

        const pomodoroModeEnabled = result.pomodoroModeEnabled || false;
        const pomodoroModeToggle = document.getElementById('pomodoroMode');
        const pomodoroSettings = document.getElementById('pomodoroSettings');
        
        if (pomodoroModeEnabled) {
            pomodoroModeToggle.classList.add('active');
            pomodoroSettings.classList.add('enabled');
        }
    });
    
    loadPomodoroSettings();
}

function checkTimerStatus() {
    chrome.runtime.sendMessage({ event: 'CheckTimerStatus' }, (response) => {
        if (chrome.runtime.lastError) {
            console.error('Error checking timer status:', chrome.runtime.lastError);
            return;
        }
        
        if (response) {
            updateSettingsState(response.isRunning, response.timeLeft);
        }
    });
}

function updateSettingsState(isTimerRunning, timeLeft) {
    const websitesPanel = document.getElementById('websites');
    const timerNotice = document.getElementById('timerStatusNotice');
    const timerIcon = document.getElementById('timerStatusIcon');
    const timerText = document.getElementById('timerStatusText');
    
    if (isTimerRunning) {
        websitesPanel.classList.add('settings-disabled');
        timerNotice.classList.add('running');
        timerNotice.style.display = 'block';
        timerIcon.textContent = '🔒';
        
        const minutes = Math.floor(timeLeft / 60);
        const seconds = timeLeft % 60;
        const timeString = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        timerText.textContent = `Timer is running (${timeString}) - settings are read-only. New rules will take effect when timer is restarted.`;
        
    } else {
        websitesPanel.classList.remove('settings-disabled');
        timerNotice.classList.remove('running');
        timerNotice.style.display = 'none';
    }
}

function loadPomodoroSettings() {
    const defaults = {
        workTime: 25,
        breakTime: 5,
        longBreakTime: 15,
        cyclesUntilLongBreak: 4,
        totalCycles: 8
    };

    chrome.storage.sync.get(['pomodoroSettings'], (result) => {
        const settings = result.pomodoroSettings || defaults;
        
        document.getElementById('workTime').value = settings.workTime;
        document.getElementById('breakTime').value = settings.breakTime;
        document.getElementById('longBreakTime').value = settings.longBreakTime;
        document.getElementById('cyclesUntilLongBreak').value = settings.cyclesUntilLongBreak;
        document.getElementById('totalCycles').value = settings.totalCycles;
    });
}

function savePomodoroSettings() {
    const settings = {
        workTime: parseInt(document.getElementById('workTime').value),
        breakTime: parseInt(document.getElementById('breakTime').value),
        longBreakTime: parseInt(document.getElementById('longBreakTime').value),
        cyclesUntilLongBreak: parseInt(document.getElementById('cyclesUntilLongBreak').value),
        totalCycles: parseInt(document.getElementById('totalCycles').value)
    };

    chrome.storage.sync.set({ pomodoroSettings: settings });
}

function adjustPomodoroTime(action, target) {
    const input = document.getElementById(target);
    let currentValue = parseInt(input.value);
    const min = parseInt(input.getAttribute('min'));
    const max = parseInt(input.getAttribute('max'));

    if (action === 'increase' && currentValue < max) {
        currentValue++;
    } else if (action === 'decrease' && currentValue > min) {
        currentValue--;
    }

    input.value = currentValue;
    savePomodoroSettings();
}