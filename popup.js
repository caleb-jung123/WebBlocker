class Timer {
    constructor( {hours, minutes, seconds} ) {
        this.display = {
            hours: document.querySelector(`#clock [data-value="hours"]`),
            minutes: document.querySelector(`#clock [data-value="minutes"]`),
            seconds: document.querySelector(`#clock [data-value="seconds"]`)
        }
        this.timeLeft = parseInt(hours) * 3600 + parseInt(minutes) * 60 + parseInt(seconds);
        this.id = null;
        this.stopped = true
    }

    timeRemaining(timeLeft) {
        const hours = Math.floor(timeLeft / 3600)
        const minutes = Math.floor((timeLeft % 3600) / 60)
        const seconds = Math.floor(timeLeft % 60)
        return {hours, minutes, seconds};
    }

    updater({ hours, minutes, seconds }) {
        this.display.hours.textContent = this.addZero(hours),
        this.display.minutes.textContent = this.addZero(minutes),
        this.display.seconds.textContent = this.addZero(seconds),
        this.timeLeft = (parseInt(hours) * 3600 + parseInt(minutes) * 60 + parseInt(seconds))
    }

    start() {
        let timer = this.timeRemaining(this.timeLeft)
        this.updater(timer)
        this.stopped = false
        this.disableButtons()

        this.id = setInterval(() => {
            if (this.stopped || this.timeLeft == 0) {
                this.stop()

                const prefs = {
                    hrs: parseInt(this.display.hours.textContent),
                    mins: parseInt(this.display.minutes.textContent),
                    secs: parseInt(this.display.seconds.textContent)
                }
            
                chrome.runtime.sendMessage({event: 'StoppedTimer', prefs})
                
                if (this.timeLeft == 0 && this.onComplete) {
                    this.onComplete();
                }
            }
            else if (this.timeLeft > 0) {
                this.timeLeft--;
                timer = this.timeRemaining(this.timeLeft)
                this.updater(timer)
            }
        }, 1000)
    }

    stop() {
        this.stopped = true;
        this.enableButtons()
        if (this.id) {
            clearInterval(this.id)
            this.id = null
        }
    }

    addZero(time) {
        return time < 10 ? `0${time}` : time;
    }

    disableButtons() {
        let divider = document.getElementById('clock')
        let buttons = divider.querySelectorAll('button')
        buttons.forEach(button => {
            if (button.id !== "stop" && button.id !== "reset") {
                button.disabled = true
            }
        })
    }
    
    enableButtons() {
        let divider = document.getElementById('clock')
        let buttons = divider.querySelectorAll('button')
        buttons.forEach(button => {
            button.disabled = false
        })
    }

}

document.addEventListener('DOMContentLoaded', () => {

    const startButton = document.getElementById('start');
    const stopButton = document.getElementById('stop');
    const resetButton = document.getElementById('reset');
    const plusHourButton = document.getElementById('plusHour');
    const minusHourButton = document.getElementById('minusHour');
    const plusMinButton = document.getElementById('plusMin');
    const minusMinButton = document.getElementById('minusMin');
    const plusSecButton = document.getElementById('plusSec');
    const minusSecButton = document.getElementById('minusSec');
    const settingsButton = document.getElementById('settings');

    let pomodoroSettings = null;
    let pomodoroState = {
        enabled: false,
        currentCycle: 1,
        phase: 'work',
        totalCycles: 8
    };

    if (startButton) {
        startButton.addEventListener('click', start); 
    }

    if (stopButton) {
        stopButton.addEventListener('click', stop);
    }

    if (resetButton) {
        resetButton.addEventListener('click', reset);
    }

    if (plusHourButton) {
        plusHourButton.addEventListener('click', plusHour);
    }

    if (minusHourButton) {
        minusHourButton.addEventListener('click', minusHour);
    }

    if (plusMinButton) {
        plusMinButton.addEventListener('click', plusMin);
    }

    if (minusMinButton) {
        minusMinButton.addEventListener('click', minusMin);
    }

    if (plusSecButton) {
        plusSecButton.addEventListener('click', plusSec);
    }

    if (minusSecButton) {
        minusSecButton.addEventListener('click', minusSec);
    }

    if (settingsButton) {
        settingsButton.addEventListener('click', openSettings);
    }

    // Listen for storage changes to update pomodoro settings in real-time
    chrome.storage.onChanged.addListener((changes, namespace) => {
        if (namespace === 'sync' && (changes.pomodoroModeEnabled || changes.pomodoroSettings)) {
            loadPomodoroSettings();
        }
    });

    loadPomodoroSettings(() => {
        chrome.runtime.sendMessage({ event: "init" }, (result) => {
            if(result.time !== undefined && result.status !== undefined) {
                let h = Math.floor(result.time / 3600)
                let m = Math.floor((result.time % 3600) / 60)
                let s = Math.floor(result.time % 60)

                document.querySelector(`#clock [data-value="hours"]`).textContent = addZero(h)
                document.querySelector(`#clock [data-value="minutes"]`).textContent = addZero(m)
                document.querySelector(`#clock [data-value="seconds"]`).textContent = addZero(s)

                if (result.pomodoroState) {
                    pomodoroState = result.pomodoroState;
                    updatePomodoroUI();
                }

                if (result.status == false) {
                    start()
                    started = true
                }
            }
        })
    })

    let started = false
    let timer = null
    let hours, minutes, seconds;

    let defaultHours = 0
    let defaultMinutes = 30
    let defaultSeconds = 0
    
    function start() {
        if (pomodoroState.enabled) {
            startPomodoroSession();
        } else {
            let hours = parseInt(getHours())
            let minutes = parseInt(getMins())
            let seconds = parseInt(getSeconds())

            if (hours > 0 || minutes > 0 || seconds > 0) {
                timer = new Timer( {hours, minutes, seconds} )
                timer.stopped = false
                started = true
            
                const prefs = {
                    hrs: hours,
                    mins: minutes,
                    secs: seconds
                }
            
                chrome.runtime.sendMessage( {event: 'StartedTimer', prefs})
                timer.start()
            }
        }
    }
    
    function stop() {
        if (timer && started) {
            timer.stopped = true
            timer.stop()
        }

        if (pomodoroState.enabled && started) {
            // In pomodoro mode, stop acts as skip to next phase
            handlePomodoroCompletion();
            return;
        }
    
        hours = parseInt(getHours())
        minutes = parseInt(getMins())
        seconds = parseInt(getSeconds())
    
        const prefs = {
            hrs: hours,
            mins: minutes,
            secs: seconds
        }
    
        chrome.runtime.sendMessage({event: 'StoppedTimer', prefs})
        chrome.runtime.sendMessage({event: 'UpdateTime', prefs})
    
    }
    
    function reset() {
        if (timer && started) {
            timer.stopped = true
            timer.stop()
        }

        if (pomodoroState.enabled) {
            // Reset pomodoro cycles and phase
            resetPomodoroState()
            const prefs = {
                hrs: 0,
                mins: pomodoroSettings.workTime,
                secs: 0
            }
            chrome.runtime.sendMessage({event: 'StoppedTimer', prefs})
            chrome.runtime.sendMessage({event: 'UpdateTime', prefs})
        } else {
            // Regular timer reset
            displayUpdateHours(defaultHours)
            displayUpdateMinutes(defaultMinutes)
            displayUpdateSeconds(defaultSeconds)

            const prefs = {
                hrs: defaultHours,
                mins: defaultMinutes,
                secs: defaultSeconds
            }

            chrome.runtime.sendMessage({event: 'StoppedTimer', prefs})
            chrome.runtime.sendMessage({event: 'UpdateTime', prefs})
        }

        timer = null
    }
    
    function addZero(time) {
        return time < 10 ? `0${time}` : time;
    }
    
    function plusHour() {
        hours = getHours()
        if (hours == 23) {
            hours = 0
        }
        else {
            hours++
        }
        displayUpdateHours(hours)

        hours = parseInt(getHours())
        minutes = parseInt(getMins())
        seconds = parseInt(getSeconds())

        const prefs = {
            hrs: hours,
            mins: minutes,
            secs: seconds
        }
    
        chrome.runtime.sendMessage({event: 'UpdateTime', prefs})
    }
    
    function minusHour() {
        hours = getHours()
        if (hours == 0) {
            hours = 23
        }
        else {
            hours--
        }
        displayUpdateHours(hours)

        hours = parseInt(getHours())
        minutes = parseInt(getMins())
        seconds = parseInt(getSeconds())

        const prefs = {
            hrs: hours,
            mins: minutes,
            secs: seconds
        }
    
        chrome.runtime.sendMessage({event: 'UpdateTime', prefs})
    }
    
    function plusMin() {
        minutes = getMins()
        if (minutes == 59) {
            minutes = 0
        }
        else {
            minutes++
        }
        displayUpdateMinutes(minutes)

        hours = parseInt(getHours())
        minutes = parseInt(getMins())
        seconds = parseInt(getSeconds())

        const prefs = {
            hrs: hours,
            mins: minutes,
            secs: seconds
        }
    
        chrome.runtime.sendMessage({event: 'UpdateTime', prefs})
    }
    
    function minusMin() {
        minutes = getMins()
        if (minutes == 0) {
            minutes = 59
        }
        else {
            minutes--
        }
        displayUpdateMinutes(minutes)

        hours = parseInt(getHours())
        minutes = parseInt(getMins())
        seconds = parseInt(getSeconds())

        const prefs = {
            hrs: hours,
            mins: minutes,
            secs: seconds
        }
    
        chrome.runtime.sendMessage({event: 'UpdateTime', prefs})
    }
    
    function plusSec() {
        seconds = getSeconds()
        if (seconds == 59) {
            seconds = 0
        }
        else {
            seconds++
        }
        displayUpdateSeconds(seconds)

        hours = parseInt(getHours())
        minutes = parseInt(getMins())
        seconds = parseInt(getSeconds())

        const prefs = {
            hrs: hours,
            mins: minutes,
            secs: seconds
        }
    
        chrome.runtime.sendMessage({event: 'UpdateTime', prefs})
    }
    
    function minusSec() {
        seconds = getSeconds()
        if (seconds == 0) {
            seconds = 59
        }
        else {
            seconds--
        }
        displayUpdateSeconds(seconds)

        hours = parseInt(getHours())
        minutes = parseInt(getMins())
        seconds = parseInt(getSeconds())

        const prefs = {
            hrs: hours,
            mins: minutes,
            secs: seconds
        }
    
        chrome.runtime.sendMessage({event: 'UpdateTime', prefs})
    }
    
    function getHours() {
        hours = document.querySelector(`#clock [data-value="hours"]`).textContent
        return hours
    }
    
    function getMins() {
        minutes = document.querySelector(`#clock [data-value="minutes"]`).textContent
        return minutes
    }
    
    function getSeconds() {
        seconds = document.querySelector(`#clock [data-value="seconds"]`).textContent
        return seconds
    }
    
    function displayUpdateHours(hours) {
        document.querySelector(`#clock [data-value="hours"]`).textContent = addZero(hours)
    }
    
    function displayUpdateMinutes(minutes) {
        document.querySelector(`#clock [data-value="minutes"]`).textContent = addZero(minutes)
    }
    
    function displayUpdateSeconds(seconds) {
        document.querySelector(`#clock [data-value="seconds"]`).textContent = addZero(seconds)
    }

    function openSettings() {
        chrome.tabs.create({ url: chrome.runtime.getURL('settings.html') });
    }

    function loadPomodoroSettings(callback) {
        chrome.storage.sync.get(['pomodoroModeEnabled', 'pomodoroSettings'], (result) => {
            pomodoroState.enabled = result.pomodoroModeEnabled || false;
            pomodoroSettings = result.pomodoroSettings || {
                workTime: 25,
                breakTime: 5,
                longBreakTime: 15,
                cyclesUntilLongBreak: 4,
                totalCycles: 8
            };
            pomodoroState.totalCycles = pomodoroSettings.totalCycles;
            updatePomodoroUI();
            if (callback) callback();
        });
    }

    function updatePomodoroUI() {
        const clock = document.getElementById('clock');
        const timerLabel = document.getElementById('timerLabel');
        const pomodoroStatus = document.getElementById('pomodoroStatus');
        const pomodoroPhase = document.getElementById('pomodoroPhase');
        const pomodoroCycleCounter = document.getElementById('pomodoroCycleCounter');
        const progressFill = document.getElementById('progressFill');

        if (pomodoroState.enabled) {
            clock.classList.add('pomodoro-mode');
            timerLabel.textContent = 'Pomodoro Mode';
            pomodoroStatus.style.display = 'block';
            
            const phaseText = pomodoroState.phase === 'work' ? 'Work Session' : 
                             pomodoroState.phase === 'longBreak' ? 'Long Break' : 'Short Break';
            pomodoroPhase.textContent = phaseText;
            pomodoroCycleCounter.textContent = `Cycle ${pomodoroState.currentCycle} of ${pomodoroState.totalCycles}`;
            
            // Update progress bar
            const progress = (pomodoroState.currentCycle - 1) / pomodoroState.totalCycles * 100;
            progressFill.style.width = `${progress}%`;
            
            // Update button labels for pomodoro mode
            const stopButton = document.getElementById('stop');
            const resetButton = document.getElementById('reset');
            if (stopButton) {
                stopButton.querySelector('span').textContent = 'Skip';
            }
            if (resetButton) {
                resetButton.querySelector('span').textContent = 'Reset Cycles';
            }
            
            // Update timer display with current phase time
            let timeMinutes;
            if (pomodoroState.phase === 'work') {
                timeMinutes = pomodoroSettings.workTime;
            } else if (pomodoroState.phase === 'longBreak') {
                timeMinutes = pomodoroSettings.longBreakTime;
            } else {
                timeMinutes = pomodoroSettings.breakTime;
            }
            
            displayUpdateHours(0);
            displayUpdateMinutes(timeMinutes);
            displayUpdateSeconds(0);
        } else {
            clock.classList.remove('pomodoro-mode');
            timerLabel.textContent = 'Set Your Focus Time';
            pomodoroStatus.style.display = 'none';
            
            // Reset button labels for normal mode
            const stopButton = document.getElementById('stop');
            const resetButton = document.getElementById('reset');
            if (stopButton) {
                stopButton.querySelector('span').textContent = 'Stop';
            }
            if (resetButton) {
                resetButton.querySelector('span').textContent = 'Reset';
            }
            
            // Reset to default timer values when pomodoro mode is disabled
            displayUpdateHours(defaultHours);
            displayUpdateMinutes(defaultMinutes);
            displayUpdateSeconds(defaultSeconds);
        }
    }

    function startPomodoroSession() {
        let timeMinutes;
        
        if (pomodoroState.phase === 'work') {
            timeMinutes = pomodoroSettings.workTime;
        } else if (pomodoroState.phase === 'longBreak') {
            timeMinutes = pomodoroSettings.longBreakTime;
        } else {
            timeMinutes = pomodoroSettings.breakTime;
        }

        displayUpdateHours(0);
        displayUpdateMinutes(timeMinutes);
        displayUpdateSeconds(0);

        timer = new Timer({ hours: 0, minutes: timeMinutes, seconds: 0 });
        timer.stopped = false;
        started = true;

        const prefs = {
            hrs: 0,
            mins: timeMinutes,
            secs: 0,
            pomodoroState: pomodoroState
        };

        chrome.runtime.sendMessage({ event: 'StartedPomodoroTimer', prefs });
        
        timer.start();
        
        timer.onComplete = () => {
            handlePomodoroCompletion();
        };
    }

    function handlePomodoroCompletion() {
        if (pomodoroState.phase === 'work') {
            if (pomodoroState.currentCycle % pomodoroSettings.cyclesUntilLongBreak === 0) {
                pomodoroState.phase = 'longBreak';
            } else {
                pomodoroState.phase = 'break';
            }
        } else {
            pomodoroState.currentCycle++;
            if (pomodoroState.currentCycle > pomodoroState.totalCycles) {
                completePomodoroSession();
                return;
            }
            pomodoroState.phase = 'work';
        }

        updatePomodoroUI();
        
        setTimeout(() => {
            if (pomodoroState.currentCycle <= pomodoroState.totalCycles) {
                startPomodoroSession();
            }
        }, 1000);
    }

    function completePomodoroSession() {
        // Reset state first
        pomodoroState.currentCycle = 1;
        pomodoroState.phase = 'work';
        updatePomodoroUI();
        
        // Show completion message only when naturally completing all cycles
        const timerLabel = document.getElementById('timerLabel');
        timerLabel.textContent = '🎉 All Pomodoro Cycles Complete!';
        
        setTimeout(() => {
            if (pomodoroState.enabled) {
                timerLabel.textContent = 'Pomodoro Mode';
            }
        }, 3000);
    }

    function resetPomodoroState() {
        // Manual reset - no completion message
        pomodoroState.currentCycle = 1;
        pomodoroState.phase = 'work';
        updatePomodoroUI();
    }
});