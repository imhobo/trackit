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


// let popup_refresh_timer;
// function sleep(n, popup_refresh_timer) { return new Promise(resolve=> popup_refresh_timer = setTimeout(resolve,n)); }