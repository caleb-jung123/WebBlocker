# WebBlocker
A chrome extension that uses the netDeclarativeRequest API to block certain websites. The blocking automatically starts whenever the user starts the timer after opening the popup. The blocking effects last until the user manually turns off the timer or the timer itself runs out of time. 

# Features
- Regular timer: Blocks certain websites while the timer is running
- Pomodoro timer: Blocks certain websites during pomodoro cycles
- Extreme Mode: Prevents users from stopping the timer
- Add and remove blocked websites

# Tech Stack
- Popup UI: HTML, CSS
- Settings UI: HTML, CSS
- Timer logic: JavaScript

# Setup Guide
The following are steps you should follow if you wish to use this chrome extension:

1. Open a terminal and navigate to a directory of your choice. Then, type in the following command:
   
   ```bash
   git clone https://github.com/caleb-jung123/LolTrack.git
   ```
2. Open chrome and go to the following: chrome://extensions
3. Toggle Developer Mode on (This slider is located on the top right of the page)
4. Click the Load Unpacked button (This button is located near the top left of the page)
5. Find and select the folder that was cloned earlier in Step 1
6. Turn the extension on and then pin it. This can be done by clicking the puzzle icon, located at the top right of the chrome browser, and then clicking the pin icon next to the Web Blocker extension

After the above steps are followed, you will see a popup appear when you click the pinned extension. 
