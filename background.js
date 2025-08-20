let totalTime;
let stopped = true;
let id = null;
let pomodoroState = null;

chrome.runtime.onStartup.addListener(() => {
    loadUserAddedWebsites();
});

chrome.runtime.onInstalled.addListener(() => {
    loadUserAddedWebsites();
});

chrome.runtime.onMessage.addListener((data, sender, sendResponse) => {

    switch(data.event) {

        case 'init':
            let msg = {
                time: totalTime,
                status: stopped,
                pomodoroState: pomodoroState
            }
            sendResponse(msg)
            break;
        
        case 'StartedTimer':
            enableBlock()
            enableDynamicRulesForTimer()
            stopped = false
            pomodoroState = null
            if (id) {
                clearInterval(id)
                id = null
            }
            HandleTimer(data.prefs)
            break;
            
        case 'StartedPomodoroTimer':
            enableBlock()
            enableDynamicRulesForTimer()
            stopped = false
            pomodoroState = data.prefs.pomodoroState
            if (id) {
                clearInterval(id)
                id = null
            }
            HandleTimer(data.prefs)
            break;
        
        case 'StoppedTimer':
            disableBlock()
            disableDynamicRulesForTimer()
            stopped = true
            pomodoroState = null
            break;

        case 'UpdateTime':
            totalTime = data.prefs.hrs * 3600 + data.prefs.mins * 60 + data.prefs.secs;
            break;
            
        case 'CheckTimerStatus':
            sendResponse({ 
                isRunning: !stopped,
                timeLeft: totalTime 
            });
            break;
    }
})

const HandleTimer = (prefs) => {
    totalTime = prefs.hrs * 3600 + prefs.mins * 60 + prefs.secs;
    id = setInterval(() => {
        if (stopped || totalTime == 0) {
            clearInterval(id)
            id = null
        }
        else if (totalTime > 0) {
            totalTime--;
            timeValues = updateTime(totalTime)
    
        }
    }, 1000)
}

function updateTime(time) {
    const hours = Math.floor(time / 3600)
    const minutes = Math.floor((time % 3600) / 60)
    const seconds = Math.floor(time % 60)
    return {hours, minutes, seconds}
}

function enableBlock() {
    chrome.declarativeNetRequest.updateEnabledRulesets({
        enableRulesetIds: ["rules"]
    })
}

function disableBlock() {
    chrome.declarativeNetRequest.updateEnabledRulesets({
        disableRulesetIds: ["rules"]
    })
}

function loadUserAddedWebsites() {

    chrome.storage.sync.get(['blockedWebsites'], (result) => {
        const blockedWebsites = result.blockedWebsites || [];

        
        chrome.declarativeNetRequest.getDynamicRules((existingRules) => {

            if (existingRules.length > 0) {
                const ruleIds = existingRules.map(rule => rule.id);
                chrome.declarativeNetRequest.updateDynamicRules({
                    removeRuleIds: ruleIds
                }, () => {

                });
            }
        });
    });
}

function enableDynamicRulesForTimer() {

    chrome.storage.sync.get(['blockedWebsites'], (result) => {
        const blockedWebsites = result.blockedWebsites || [];

        
        if (blockedWebsites.length > 0) {
            recreateDynamicRules(blockedWebsites);
        } else {

        }
    });
}

function disableDynamicRulesForTimer() {

    chrome.declarativeNetRequest.getDynamicRules((existingRules) => {
        const ruleIds = existingRules.map(rule => rule.id);
        if (ruleIds.length > 0) {
            chrome.declarativeNetRequest.updateDynamicRules({
                removeRuleIds: ruleIds
            }, () => {
                if (chrome.runtime.lastError) {
                    console.error('Error disabling dynamic rules:', chrome.runtime.lastError);
                } else {

                }
            });
        } else {

        }
    });
}

function recreateDynamicRules(websites) {
    chrome.declarativeNetRequest.getDynamicRules((existingRules) => {
        const ruleIds = existingRules.map(rule => rule.id);
        
        chrome.declarativeNetRequest.updateDynamicRules({
            removeRuleIds: ruleIds,
            addRules: createRulesFromWebsitesBackground(websites)
        }, () => {
            if (chrome.runtime.lastError) {
                console.error('Error recreating dynamic rules:', chrome.runtime.lastError);
            } else {

            }
        });
    });
}

function createRulesFromWebsitesBackground(websites) {
    const rules = [];
    let ruleId = 1000;

    websites.forEach(website => {
        const baseDomain = website.replace(/^www\./, '');
        const patterns = [
            `*://${baseDomain}/*`,
            `*://www.${baseDomain}/*`,
            `*://*.${baseDomain}/*`
        ];
        
        patterns.forEach(pattern => {
            const rule = {
                id: ruleId++,
                priority: 1,
                action: {
                    type: "redirect",
                    redirect: {
                        extensionPath: "/redirect.html"
                    }
                },
                condition: {
                    urlFilter: pattern,
                    resourceTypes: ["main_frame", "sub_frame"]
                }
            };

            rules.push(rule);
        });
    });


    return rules;
}