/*
    Core business logic of hitting the API's, sending messages to popup UI, updating plugin icon etc
*/

import { DEFAULT_POPUP_RESPONSE, getDataFromStorage, getPingFromStorage, getPopupResponseFromStorage, LAST_REFRESH_KEY, PING_KEY, POPUP_RESPONSE_KEY } from './storage.js';
import { getTime } from './util.js';

const PLUGIN_ICON_ACTIVE = "./images/icon_active.png";
const PLUGIN_ICON_INACTIVE = "./images/icon_inactive.png";


const getDataAndPingFromStoragePromise = async () => { 
    let data = await getDataFromStorage();
    let ping = await getPingFromStorage();
    let settings = [data, ping];
    return new Promise(function(resolve, reject){
        resolve(settings);
    }); 
};

const createPopupResponse = async (data, ping) => { 
    var popupResponse = await getPopupResponse(data, ping);
    return new Promise(function(resolve, reject){
        resolve(popupResponse);
    }); 
}; 

async function getPopupResponse(data, ping) {
    
    var responseWrapper = {};
 
    if(!data.records) return DEFAULT_POPUP_RESPONSE;
    var meta = {};

    meta[PING_KEY] = ping;
    var ts = new Date();

    var responses = [];
    var records = data.records;
    for(var i=0 ; i<records.length; i++) {
        var response = {};
        var record = records[i];
        var res = "NULL";

        try {
            let time1 = performance.now();
            var options = {"method": record.method};
            options.headers = {};
            if(record.method === "POST") {
                options.headers['Content-Type'] = record.contentType;
                options.body = record.body;
            }
            options.headers['Authorization'] =  record.auth;
            res = await fetchWithTimeout (record.url, options, record.timeout);
            let time2 = performance.now();
            var latency = time2 - time1;    
            response.latency = Math.floor(latency) + " ms";
        } catch(error) {
            response.status = "inactive";
            response.latency = "-";
            console.log(error);
        }

        console.log(record.name + " : " + res.status);
        if(res !== "NULL" && res.status === 200) {
            response.status = "active";
        }
        else {
            response.status = "inactive";
            response.latency = "-";
        }
    
        response.name = record.name;
        response.url = record.url;
        response.method = record.method;
        responses.push(response);    
    }
    meta[LAST_REFRESH_KEY] = ts.toLocaleTimeString([], {hour12: true});
    responseWrapper.responses = responses;
    responseWrapper.meta = meta;
    return responseWrapper;
}

async function fetchWithTimeout(resource, options = {}, timeoutValue) {
    //default value
    const { timeout = 3000 } = timeoutValue;
     
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    var response = {};
    try {
        response = await fetch(resource, {
          ...options,
          signal: controller.signal  
        });
    } catch(error) {
        console.log("Couldn't fetch " + resource);
    }

    clearTimeout(id);
    return response;
}

function updatePluginIcon(popupResponse) {

    if(!popupResponse.responses) return;
    var activeIcon = true;
    popupResponse.responses.forEach(response => {
        if(response.status !== "active")activeIcon = false;
    });
  
    if(activeIcon) chrome.action.setIcon({
        path : {
            "16": PLUGIN_ICON_ACTIVE,
            "19": PLUGIN_ICON_ACTIVE,
            "38": PLUGIN_ICON_ACTIVE
        }
      });
    else chrome.action.setIcon({
        path : {
            "16": PLUGIN_ICON_INACTIVE,
            "19": PLUGIN_ICON_INACTIVE,
            "38": PLUGIN_ICON_INACTIVE
        }
      });
}

const setPopupResponseToStorage = async (popupResponse) => {
    chrome.storage.sync.set({[POPUP_RESPONSE_KEY]: popupResponse }, function(){
        
        //Sending message to refresh popup UI
        chrome.runtime.sendMessage({ greeting: "hello" }, function (response) {
            if(chrome.runtime.lastError) {
                //Popup is not active and no one received the message
                // console.log(chrome.runtime.lastError);
            } 
            // console.log(response);
        });
    });
};

export const fetchPopupResponse = async (info) => {
    console.log("fetchPopupResponse fired " + getTime() + " using : " + info);
    try {
        var dataAndPingPromise = getDataAndPingFromStoragePromise();
        dataAndPingPromise.then(function (settings) {
            let data = settings[0];
            let ping = settings[1];
            var popupResponsePromise = createPopupResponse(data, ping);

            popupResponsePromise.then(function (popupResponse) {
                updatePluginIcon(popupResponse);
                setPopupResponseToStorage(popupResponse);
            }).catch(function () {
                console.log('Error has occurred while creating popup response');
            });
        }).
        catch(function () {
            console.log('Error has occurred while getting data and ping');
        });
        
    } catch(error) {
        console.error(error);
    }
   
}