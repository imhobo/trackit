/*
    Methods related to fetching data from storage
*/

export const DEFAULT_PING_INTERVAL = 60; //seconds
export const DATA_KEY = 'data';
export const PING_KEY = 'ping_interval';
export const LAST_REFRESH_KEY = 'last_refresh';
export const POPUP_RESPONSE_KEY = 'popup_response';
export const META_KEY = 'meta';

export const DEFAULT_POPUP_RESPONSE = {[META_KEY]: {[PING_KEY]: DEFAULT_PING_INTERVAL, [LAST_REFRESH_KEY]: "NA"}};

export async function getDataFromStorage() {

    var p = new Promise(function(resolve, reject){
        chrome.storage.sync.get([DATA_KEY], function(result){
            console.debug("Data fetched from storage");
            resolve(result.data);
        });
    });

    const configOut = await p;

    try {
        if(!configOut || configOut === undefined) return {};
    } catch (error) {
        console.debug("No websites to monitor yet!");
        return {};
    }
    return configOut;    
}


export async function getPingFromStorage() {

    var p = new Promise(function(resolve, reject){
        chrome.storage.sync.get([PING_KEY], function(result){
            console.debug("Ping fetched from storage");
            resolve(parseInt(result[PING_KEY]));
        });
    });

    const configOut = await p;
    
    try {
        if(!configOut || configOut === undefined) return DEFAULT_PING_INTERVAL;
    } catch (error) {
        console.debug("No ping interval set. Using default");
        return DEFAULT_PING_INTERVAL;
    }
    // console.debug(configOut);
    return configOut;    
}

export async function getPopupResponseFromStorage() {

    var p = new Promise(function(resolve, reject){
        chrome.storage.sync.get([POPUP_RESPONSE_KEY], function(result){
            console.debug("Popup response fetched from storage");
            resolve(result.popup_response);
        });
    });

    const configOut = await p;
    
    try {
        if(!configOut || configOut === undefined) return DEFAULT_POPUP_RESPONSE;
    } catch (error) {
        console.debug("No popup response yet. Using default");
        return DEFAULT_POPUP_RESPONSE;
    }
    // console.debug(configOut);
    return configOut;    
}