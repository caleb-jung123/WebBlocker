// Class that represents the numerical values of the timer

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

// Need information from the popup (document)

document.addEventListener('DOMContentLoaded', () => {

    // popup interactions

    const startButton = document.getElementById('start');
    const stopButton = document.getElementById('stop');
    const resetButton = document.getElementById('reset');
    const plusHourButton = document.getElementById('plusHour');
    const minusHourButton = document.getElementById('minusHour');
    const plusMinButton = document.getElementById('plusMin');
    const minusMinButton = document.getElementById('minusMin');
    const plusSecButton = document.getElementById('plusSec');
    const minusSecButton = document.getElementById('minusSec');

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

    // constant update to the background

    chrome.runtime.sendMessage({ event: "init" }, (result) => {
        if(result.time !== undefined && result.status !== undefined) {
            let h = Math.floor(result.time / 3600)
            let m = Math.floor((result.time % 3600) / 60)
            let s = Math.floor(result.time % 60)

            document.querySelector(`#clock [data-value="hours"]`).textContent = addZero(h)
            document.querySelector(`#clock [data-value="minutes"]`).textContent = addZero(m)
            document.querySelector(`#clock [data-value="seconds"]`).textContent = addZero(s)

            if (result.status == false) {
                start()
                started = true
            }
        }
    })

    // Declare Statements

    let started = false
    let timer = null
    let hours, minutes, seconds;

    let defaultHours = 0
    let defaultMinutes = 30
    let defaultSeconds = 0
    
    // Start, Stop, and Reset
    
    function start() {
        let hours = parseInt(getHours())
        let minutes = parseInt(getMins())
        let seconds = parseInt(getSeconds())

        // only make timer "start" if there is time left

        if (hours > 0 || minutes > 0 || seconds > 0) {
            timer = new Timer( {hours, minutes, seconds} )
            timer.stopped = false
            started = true
        
            const prefs = {
                hrs: hours,
                mins: minutes,
                secs: seconds
            }
        
            // send timer info to background script

            chrome.runtime.sendMessage( {event: 'StartedTimer', prefs})
            timer.start()
        }
    }
    
    function stop() {
        if (timer && started) {
            timer.stopped = true
            timer.stop()
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
        displayUpdateHours(defaultHours)
        displayUpdateMinutes(defaultMinutes)
        displayUpdateSeconds(defaultSeconds)

        timer = null

        const prefs = {
            hrs: defaultHours,
            mins: defaultMinutes,
            secs: defaultSeconds
        }

        chrome.runtime.sendMessage({event: 'StoppedTimer', prefs})
        chrome.runtime.sendMessage({event: 'UpdateTime', prefs})
    }
    
    // Helper for padding zeros to the string (since timers aren't single digits usually)
    
    function addZero(time) {
        return time < 10 ? `0${time}` : time;
    }
    
    // These functions add to the number on the timer if the button is pressed
    
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
    
    // helpers for getting and updating the value on the timer
    
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
});     
