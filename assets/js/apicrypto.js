//This file uses crypto-js https://github.com/brix/crypto-js

/**
 * This function decrypts the payload of an ENCRYPTED frame.
 * @param {Object} frame - is a javascript object representing a valid encrypted frame
 * @param {string} ApiSecretKey - API Secret Key of the device (as seen in the Remootio app). 
 * It is a hexstring representing a 256 bit long value e.g. "12b3f03211c384736b8a1906635f4abc90074e680138a689caf03485a971efb3"
 * @param {string} ApiAuthKey - API Auth Key of the device (as seen in the Remootio app). 
 * It is a hexstring representing a 256 bit long value e.g. "74ca13b56b3c898670a67e8f36f8b8a61340738c82617ba1398ae7ca62f1670a"
 * @param {string} ApiSessionKey - API Session Key for the current session. 
 * If the session is not authenticated this parameter must be undefined. 
 * The sessionkey is received in the challenge.sessionKey field of the ENCRYPTED frame sent as a response to the AUTH frame 
 * during the authentication flow. This is a base64 encoded string representing a 256 bit long value 
 * e.g. "f+8UpraYuLV0wKdHNjJAj1OTaNOI83i6fJZ8TBtwx00="
 */
function remootioApiDecryptEncrypedFrame(frame,ApiSecretKey,ApiAuthKey,ApiSessionKey){
    if(!frame || frame.type != "ENCRYPTED" ||  !frame.data || !frame.mac || !frame.data.payload || !frame.data.iv){
        return undefined;
    }

    //STEP 0 - Get the relevant keys used for encryption
    let CurrentlyUsedSecretKeyWordArray = undefined; //The currently used encryption key (in word array form as CryptoJS prefers) - To be set in the next few lines
    //The used Secret Key - used for encryption - depends on if the session is already authenticated or not
    //If it's not then it's the ApiSecretKey. If it is, the ApiSessionKey is used instead.
    if (ApiSessionKey == undefined){ //If the session is not authenticated, we use ApiSecretKey, which is a hexstring
        //CryptoJs works with wordArrays, but ApiSecretKey is a hexstring
        CurrentlyUsedSecretKeyWordArray = CryptoJS.enc.Hex.parse(ApiSecretKey) //Parse hexstring
    }
    else{ //If the session is already authenticated, we use ApiSessionKey, which we received as a response to our AUTH frame earlier in base64 encoded form
        //CryptoJs works with wordArrays, but ApiSessionKey is a base64 encoded string
        CurrentlyUsedSecretKeyWordArray = CryptoJS.enc.Base64.parse(ApiSessionKey) //Parse hexstring
    }

    //The auth key is used for calculating the MAC (Message Authentication Code), which is a HMAC-SHA256
    //CryptoJs works with wordArrays, but ApiAuthKey is a hexstring
    let ApiAuthKeyWordArray = CryptoJS.enc.Hex.parse(ApiAuthKey) //Parse hexstring

    //Step 1 verify MAC
    //It is a HMAC-SHA256 over the JSON.stringify(frame.data)
    let mac = CryptoJS.HmacSHA256(JSON.stringify(frame.data),ApiAuthKeyWordArray)
    let base64mac = CryptoJS.enc.Base64.stringify(mac);
    //Check if the calculated MAC matches the one sent by the API
    let macMatches=true;
    if (base64mac != frame.mac){ //If the MAC doesn't match - return
        console.warn('Decryption error: calculated MAC '+base64mac+' does not match the MAC from the API '+frame.mac)
        macMatches=false;
    }

    //STEP 2 decrypt the payload
    //The frame.data.payload is a base64 encoded string, we convert it to wordArray for CryptoJS
    let payloadWordArray = CryptoJS.enc.Base64.parse(frame.data.payload)
    //The frame.data.iv is a base64 encoded string, we convert it to wordArray for CryptoJS
    let ivWordArray = CryptoJS.enc.Base64.parse(frame.data.iv)

    let decryptedPayloadWordArray = CryptoJS.AES.decrypt({ciphertext: payloadWordArray},CurrentlyUsedSecretKeyWordArray,{
        iv:ivWordArray,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7
    })
    let decryptedPayload = CryptoJS.enc.Latin1.stringify(decryptedPayloadWordArray) //The decrypted data is Latin1 encoded string representing a stringified JSON object
    let decryptedPayloadJSON = undefined;
    try{
        decryptedPayloadJSON = JSON.parse(decryptedPayload)
    }
    catch(e){
        console.warn("The decrypted frame.data is not a valid JSON: ",decryptedPayload)
    }

    if (macMatches == true){
        return decryptedPayloadJSON;
    }
    else{ //Return undefined if the mac didn't match
        return undefined;
    }
}

/**
 * This function encrypts the payload of an ENCRYPTED frame, and the constructs the ENCRYPTED frame itself.
 * @param {Object} unencryptedPayload - is a javascript object representing the non-encrypted payload of the ENCRYPTED FRAME to send
 * @param {string} ApiSecretKey - API Secret Key of the device (as seen in the Remootio app). 
 * It is a hexstring representing a 256 bit long value e.g. "12b3f03211c384736b8a1906635f4abc90074e680138a689caf03485a971efb3" - this parameter is actually not used as this function is only called in authenticated sessions, the parameter is here for consistency only
 * @param {string} ApiAuthKey - API Auth Key of the device (as seen in the Remootio app). 
 * It is a hexstring representing a 256 bit long value e.g. "74ca13b56b3c898670a67e8f36f8b8a61340738c82617ba1398ae7ca62f1670a"
 * @param {string} ApiSessionKey - API Session Key for the current session received in the challenge.sessionKey field 
 * of the ENCRYPTED frame sent as a response to the AUTH frame during the authentication flow. 
 * This is a base64 encoded string representing a 256 bit long value e.g. "f+8UpraYuLV0wKdHNjJAj1OTaNOI83i6fJZ8TBtwx00="
 */
function remootioApiConstructEncrypedFrame(unencryptedPayload,ApiSecretKey,ApiAuthKey,ApiSessionKey){

    //STEP 0 - Get the relevant keys used for encryption
    //The used Secret Key is never used in this function because the client is only able to send vaid ENCRYPTED
    //frames in an authenticated session (after it received the sessionKey, we only use the sessionKey here)
    let CurrentlyUsedSecretKeyWordArray = undefined
    if (ApiSessionKey == undefined){ 
        //If the session is not authenticated, the client cannot send valid encrypted frames to the Remootio device
        //so this is an error, and we just return undefined
        return undefined;
    }
    else{ //If the session is already authenticated we use ApiSessionKey, which we received as a response to our AUTH frame earlier in base64 encoded form
        //CryptoJs works with wordArrays, but ApiSessionKey is a base64 encoded string
        CurrentlyUsedSecretKeyWordArray = CryptoJS.enc.Base64.parse(ApiSessionKey) //Parse hexstring
    }

    //The auth key is used for calculating the MAC (Message Authentication Code), which is a HMAC-SHA256
    //CryptoJs works with wordArrays, but ApiAuthKey is a hexstring
    let ApiAuthKeyWordArray = CryptoJS.enc.Hex.parse(ApiAuthKey) //Parse hexstring

    //STEP 1 encrypt the payload
    //3.1 generate random IV
    let ivWordArray = CryptoJS.lib.WordArray.random(16);
    //Convert the unencrypted payload to wordArray for CryptoJS
    let unencryptedPayloadWordArray = CryptoJS.enc.Latin1.parse(unencryptedPayload)
    //Do the encryption
    let encryptedData = CryptoJS.AES.encrypt(unencryptedPayloadWordArray,CurrentlyUsedSecretKeyWordArray,{
        iv:ivWordArray,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7
    })
    encryptedPayloadWordArray=encryptedData.ciphertext; //In CryptoJS encryptedData.ciphertext contains the ciphertext as a word array

    //Step 2 create the {data:...} object of the encrypted frame used for HMAC calculation
    //The order of the elements in the toHMACObj is very important, (if they are in other order the calculated HMAC will be different)
    //And the Remootio API will reject the message
    let toHMACObj = {
            iv:CryptoJS.enc.Base64.stringify(ivWordArray), //IV is a base64 encoded string
            payload:CryptoJS.enc.Base64.stringify(encryptedPayloadWordArray), 
    }
    //STEP 3 calcualte the HMAC-SHA256 of JSON.stringify(frame.data)
    let toHMAC = JSON.stringify(toHMACObj) //The data we calculate the HMAC on
    let mac = CryptoJS.HmacSHA256(toHMAC,ApiAuthKeyWordArray)
    let base64mac = CryptoJS.enc.Base64.stringify(mac); //We convert the mac to a base64 array

    //STEP 4 we construct and return the full encrypted frame
    return {
        type:"ENCRYPTED",
        data:toHMACObj,
        mac:base64mac
    }
}


module.exports={
    remootioApiDecryptEncrypedFrame:remootioApiDecryptEncrypedFrame,
    remootioApiConstructEncrypedFrame:remootioApiConstructEncrypedFrame
}