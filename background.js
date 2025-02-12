let totalTime;
let stopped = true;
let id = null;

// handle the event depending on the information received from popup.js

chrome.runtime.onMessage.addListener((data, sender, sendResponse) => {

    switch(data.event) {

        // This case is called during the initialization of the clock popup. It essentially takes the current time of the 
        // clock and sends it to popupjs to properly initialize the clock. It also sends info on whether we should start 
        // the clock right away upon initializing it (i.e. the user never stopped the clock when closing the popup). If the 
        // popup is being initialized for the first time, this time and status will correspond with popup.js but it starts 
        // becoming different as the popup is intialized in later times.
        case 'init':
            let msg = {
                time: totalTime,
                status: stopped
            }
            sendResponse(msg)
            break;
        
        // Called when the user starts the timer. Enable the netDeclarativeRequest ruleset to block (redirect) the chosen websites
        // and start a passive timer that continues running even if the popup is killed
        case 'StartedTimer':
            enableBlock()
            stopped = false
            if (id) {
                clearInterval(id)
                id = null
            }
            HandleTimer(data.prefs)
            break;
        
        // Called when the user stops the timer. We disable the ruleset since we no longer want to redirect the websites. 
        // We also set stopped to true so that the interval is killed.
        case 'StoppedTimer':
            disableBlock()
            stopped = true
            break;

        case 'UpdateTime':
            totalTime = data.prefs.hrs * 3600 + data.prefs.mins * 60 + data.prefs.secs;
            break;
    }
})

const HandleTimer = (prefs) => {
    // operate on the time as seconds, its easier
    totalTime = prefs.hrs * 3600 + prefs.mins * 60 + prefs.secs;
    id = setInterval(() => {
        // keep running while there is time remaining or the user stops the clock
        if (stopped || totalTime == 0) {
            clearInterval(id)
            id = null
        }
        else if (totalTime > 0) {
            totalTime--;
            timeValues = updateTime(totalTime)
            console.log(timeValues)
        }
    }, 1000)
}

// this was mostly used for testing, wanted to see in the console if the code was updating properl
function updateTime(time) {
    const hours = Math.floor(time / 3600)
    const minutes = Math.floor((time % 3600) / 60)
    const seconds = Math.floor(time % 60)
    return {hours, minutes, seconds}
}

// enable a ruleset
function enableBlock() {
    chrome.declarativeNetRequest.updateEnabledRulesets({
        enableRulesetIds: ["rules"]
    })
}

// disable a ruleset
function disableBlock() {
    chrome.declarativeNetRequest.updateEnabledRulesets({
        disableRulesetIds: ["rules"]
    })
}

