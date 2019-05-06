var WebSocket_conn; //handle to the websocket connection

//WS connect
function wsconnect(){
    var wsaddr= document.getElementById('websocket_addr').value
    console.log('Connecting to ', wsaddr)
    WebSocket_conn = new WebSocket(wsaddr);
    wsConnecting()

    ApiSessionKey=undefined; //We clear the session key if it's not undefined due to a previously closed session. We will be able to set this after we have authenticated this session
    
    WebSocket_conn.onopen = function(){
        console.log('Connection opened')
        document.getElementById('messages_log').textContent += new Date().toLocaleTimeString()+" Websocket connection opened\n\n" //Add an extra newline for clear separation
        wsConnected()
    };
   
    WebSocket_conn.onmessage = function (evt) { 
        var incMsgJSON = JSON.parse(evt.data)
        console.log('Incoming message (json):',incMsgJSON)
        document.getElementById('messages_log').textContent += new Date().toLocaleTimeString()+' Incoming message (length:'+evt.data.length+'):\n'+evt.data + "\n"
        //Check if it's a message to decrypt
        if (incMsgJSON.type == "ENCRYPTED"){
            console.log('This is an enrypted frame, decrypting...')
            //get the ApiSecretKey from the text input
            var ApiSecretKey = document.getElementById('api_secret_key').value //hexstring
            //get the ApiAuthKey from the text input
            var ApiAuthKey = document.getElementById('api_auth_key').value //hexstring
            var decryptedPayloadJSON = remootioApiDecryptEncrypedFrame(incMsgJSON,ApiSecretKey,ApiAuthKey,ApiSessionKey) //pass the whole frame in the argument
            //If the message decryption is successful, we can handle the message
            if (decryptedPayloadJSON != undefined){
                //We append the decrypted message to the log
                document.getElementById('messages_log').textContent += 'Decrypted data.payload (length:'+JSON.stringify(decryptedPayloadJSON).length+'):\n'+JSON.stringify(decryptedPayloadJSON)+"\n"
                //If it's an auth challenge frame we handle it in this demo as well
                if (decryptedPayloadJSON.challenge && decryptedPayloadJSON.challenge.sessionKey && decryptedPayloadJSON.challenge.initialActionId){
                    if (confirm('This demo client has detected an authentication challenge from the Remootio Websocket API. This demo application can handle it automatically. First it starts to use the challenge.sessionKey as the encryption key for this session from now on and it also sends a QUERY action to the Remootio device to finish the authentication. Would you like to handle the authentication automatically?' )) {
                        lastActionId = decryptedPayloadJSON.challenge.initialActionId;
                        ApiSessionKey =  decryptedPayloadJSON.challenge.sessionKey;
                        console.log('Authentication challenge received, setting encryption key (session key) to ',ApiSessionKey)
                        document.getElementById('messages_log').textContent += 'Authentication challenge received, setting encryption key (session key) to '+ApiSessionKey+"\n"
                        //send the QUERY action to finish auth
                        sendqueryaction()
                    } else {
                        // Do nothing!
                    }
                }
                //If it's a response to one of our actions we increment the lastActionId by 1
                if (decryptedPayloadJSON.response && decryptedPayloadJSON.response.id!=undefined){
                    if (lastActionId<=decryptedPayloadJSON.response.id || (decryptedPayloadJSON.response.id == 0 && lastActionId == 0x7FFFFFFF)){
                        lastActionId = decryptedPayloadJSON.response.id; //We increment the action id  (we actually just set it to be equal to the previous message's ID we've sent)
                        console.log('Received the response to our last action, we increment lastActionId to ',lastActionId);
                        document.getElementById('messages_log').textContent += 'Received the response to our last action, we increment lastActionId to '+ lastActionId +"\n"
                    }
                }
            }
        }
        document.getElementById('messages_log').textContent += "\n" //Add an extra newline for clear separation
    };

    WebSocket_conn.onerror = function()
    {
        alert('Websocket disconnected')
        console.log('There was an error, websocket disconnected')
        wsDisconnected()
    };
    
    WebSocket_conn.onclose = function()
    { 
        console.log('Disconnected')
        document.getElementById('messages_log').textContent += new Date().toLocaleTimeString()+" Websocket connection closed\n\n" //Add an extra newline for clear separation
        wsDisconnected()
    };
}

//WS disconnect
function wsdisconnect(){
    WebSocket_conn.close()
    clearlog()
    wsDisconnected()
}

//WS send message
function WebsocketSendMessage(message,unencryptedpayload){
    document.getElementById('messages_log').textContent += new Date().toLocaleTimeString()+' Outgoing message (length:'+message.length+'):\n'+message + "\n"
    if (unencryptedpayload != undefined){
        document.getElementById('messages_log').textContent += ' Unencrypted data.payload of the frame (length:'+unencryptedpayload.length+'):\n'+unencryptedpayload + "\n"
    }
    document.getElementById('messages_log').textContent += "\n" //add newline for visual separation
    WebSocket_conn.send(message);
}