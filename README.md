# Remootio API Client for Javascript in the browser

This is a javascript implementation for Remootio's websocket API. Remootio is a smart gate and garage door controller product. To learn more please visit www.remootio.com. The API documentation can be found [here](http://www.remootio.com/docs/WebsocketApiDocs.pdf). The webpage contained in this repository can be used to test Remootio's Websocket API quickly without any coding.

### Usage
##### Enable the API in the Remootio app
First of all make sure that the Remootio Websocket API is enabled for your Remootio device in the Remootio app. Please take note of the API Secret key and API Auth Key along with the IP address of the device, as you will need these.

##### Open index.html
Run the website (index.html) in a browser (preferably in Chrome).
It is recommended to also open the javascript console (in Chrome right click anywhere on the site and click Inspect, then go to Console).

##### Enter configuration data
Under configuration:
 - Enter the API Secret Key for your device's API (it is displayed in the Remootio app)
 - Enter the API Auth Key for your device's API (it is displayed in the Remootio app)

Under connect to device:
 - Enter the IP address of the device (replace <ip_address> with e.g. 192.168.1.115)
 
##### Connect to the device and send frames
To connect to your Remootio press the connect button

After successfully connecting to the device you can send frames. All the valid frames are pre-programmed and shown as buttons on the webpage. If you click any of the buttons the respective frame will be sent to Remootio. You can also construct these frames on your own for testing in the text area and click send message to send them.

The log of all messages sent and received can be seen under Websocket message log at the bottom of the page and in the javascript console.

##### Authentication
In Remootio's websocket API the frames that contain sensitive information are encrypted. Every time a new connection is established with the Remootio device a new session is created. Each session has to be authenticated (for more information please refer to the [API documentation](http://www.remootio.com/docs/WebsocketApiDocs.pdf)). The authentication is initiated by the API client by sending the AUTH frame. You can send this frame by pressing the respective button on the website. If your API Secret Key and API Auth Key are correct, the webpage will recognize the authentication challenge sent by Remootio and ask you if you want it to handle the full authentication flow automatically. Answering OK to this prompt is recommended. If you want to test your own authentication logic however, you can answer with Cancel and finish the authentication yourself by sending the right message using the text area.

After the authentication is completed you can also send actions.
 - QUERY action: queries the current state of your gate or garage door. Returns a response which shows if your gate or garage door is open or closed or if there is no sensor installed.
 - TRIGGER action: triggers the control output of Remootio to operate your gate or garage door
 - OPEN action: triggers the control output of Remootio only if the gate status is closed
 - CLOSE action: triggers the control output of Remootio only if the gate status is open 
 - RESTART action: tells your Remootio device to restart

When a session becomes authenticated Remootio will send messages with events that contain important information about things that happened to the device. The scope of these events depend on whether you enabled the Remootio Websocket API with or without logging.
