/* 
    Utility methods
*/

export function getTime() {
    var ts = new Date();
    return ts.toLocaleTimeString([], {hour12: true});
}

export function isEmpty(obj) {
    return Object.keys(obj).length === 0;
}


export function requestManualRefresh() {
    //sending message to background service to fetch data and refresh popup
    chrome.runtime.sendMessage({ greeting: "manual-refresh" }, function (response) {
        if(chrome.runtime.lastError) {
            //Background service is not active and no one received the message
        } 
    });
}

// let popup_refresh_timer;
// function sleep(n, popup_refresh_timer) { return new Promise(resolve=> popup_refresh_timer = setTimeout(resolve,n)); }