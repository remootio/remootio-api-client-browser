let lastActionId = undefined; //counts from 0 to 0x7FFFFFFF this is the frame counter, it starts from initialActionId after the authentication happens. It is needed to send this with every action the client sends to the API, and always increment it by one (to prevent replay attacks)
let ApiSessionKey = undefined; //ApiSessionKey is set if the communication has been authenticated

//Send arbitrary websocket frame
function sendarbitrarymsg(){
    let arbmsg = document.getElementById('websocket_arbitrarymsg').value
    console.log('Sending message: ',arbmsg)
    WebsocketSendMessage(arbmsg);
}

//Send an invalid JSON
function sendinvalidjson(){
    let toSend = "[something not a JSON }"
    console.log('Sending message: ',toSend)
    WebsocketSendMessage(toSend)
}

//Send a valid json but invalid input data to the API
function sendinvalidinput(){
    let toSend = {
        random:"json data"
    }
    console.log('Sending message: ',toSend)
    WebsocketSendMessage(JSON.stringify(toSend))
}

//-----------Send frames and messages from the API specification------------

//Send PING frame
function sendping(){
    let toSend = {
        type:"PING"
    }
    console.log('Sending message: ',toSend)
    WebsocketSendMessage(JSON.stringify(toSend))
}

//Send HELLO frame
function sendhello(){
    let toSend = {
        type:"HELLO"
    }
    console.log('Sending message: ',toSend)
    WebsocketSendMessage(JSON.stringify(toSend))
}

//Send AUTH frame
function sendauthmsg(){
    let toSend = {
        type:"AUTH"
    }
    console.log('Sending message: ',toSend)
    WebsocketSendMessage(JSON.stringify(toSend))
}

//Sends the action:"QUERY" action
function sendqueryaction(){
    if (ApiSessionKey == undefined){ //if we are not authenticated, this message is invalid
        alert('This action requires authentication, authenticate session first')
        return
    }
    let toSendPayload = {
        action:{
            type:"QUERY",
            id: ((lastActionId+1)%0x7FFFFFFF) //id - the "frame counter for actions" must be higher than the previous value (we increment the state variable lastActionId when we get the response from the API to this action)
        }
    }
    sendencryptedframe(JSON.stringify(toSendPayload))
}

//Sends the action:"TRIGGER" action
function sendtriggeraction(){
    if (ApiSessionKey == undefined){ //if we are not authenticated, this message is invalid
        alert('This action requires authentication, authenticate session first')
        return
    }
    let toSendPayload = {
        action:{
            type:"TRIGGER",
            id: ((lastActionId+1)%0x7FFFFFFF) //id - the "frame counter for actions" must be higher than the previous value (we increment the state variable lastActionId when we get the response from the API to this action)
        }
    }
    sendencryptedframe(JSON.stringify(toSendPayload))
}

//Sends the action:"OPEN" action
function sendopenaction(){
    if (ApiSessionKey == undefined){ //if we are not authenticated, this message is invalid
        alert('This action requires authentication, authenticate session first')
        return
    }
    let toSendPayload = {
        action:{
            type:"OPEN",
            id: ((lastActionId+1)%0x7FFFFFFF) //id - the "frame counter for actions" must be higher than the previous value (we increment the state variable lastActionId when we get the response from the API to this action)
        }
    }
    sendencryptedframe(JSON.stringify(toSendPayload))
}

//Sends the action:"CLOSE" action
function sendcloseaction(){
    if (ApiSessionKey == undefined){ //if we are not authenticated, this message is invalid
        alert('This action requires authentication, authenticate session first')
        return
    }
    let toSendPayload = {
        action:{
            type:"CLOSE",
            id: ((lastActionId+1)%0x7FFFFFFF) //id - the "frame counter for actions" must be higher than the previous value (we increment the state variable lastActionId when we get the response from the API to this action)
        }
    }
    sendencryptedframe(JSON.stringify(toSendPayload))
}

//Sends the action:"RESTART" action
function sendrestartaction(){
    if (ApiSessionKey == undefined){ //if we are not authenticated, this message is invalid
        alert('This action requires authentication, authenticate session first')
        return
    }
    let toSendPayload = {
        action:{
            type:"RESTART",
            id: ((lastActionId+1)%0x7FFFFFFF) //id - the "frame counter for actions" must be higher than the previous value (we increment the state variable lastActionId when we get the response from the API to this action)
        }
    }
    sendencryptedframe(JSON.stringify(toSendPayload))
}


//Local use only (in this file)
function sendencryptedframe(unencryptedPayload){
    //get the ApiSecretKey from the text input
    let ApiSecretKey = document.getElementById('api_secret_key').value //hexstring
    //get the ApiAuthKey from the text input
    let ApiAuthKey = document.getElementById('api_auth_key').value //hexstring
    let encryptedFrame = remootioApiConstructEncrypedFrame(unencryptedPayload,ApiSecretKey,ApiAuthKey,ApiSessionKey)
    if (encryptedFrame != undefined){
        //Send the encryptedFrame as a JSON string
        console.log('Sending encrypted frame: ',encryptedFrame,' with the unencrypted payload: ',JSON.parse(unencryptedPayload))
        WebsocketSendMessage(JSON.stringify(encryptedFrame),unencryptedPayload) //We pass unencryptedPayload for logging purposes only
    }
    else{
        //Encryption error
        console.warn('Could not encrypt ',unencryptedPayload)
    }
}