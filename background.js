/*
    Service worker that runs always in the background
*/

import {getPingFromStorage} from './storage.js';
import {fetchPopupResponse} from './core.js';
import { getTime } from './util.js';

const ALARM_FOREVER = "alarm-forever";

const getPingFromStoragePromise = async () => { 
    let ping = await getPingFromStorage();
    return new Promise(function(resolve, reject){
        resolve(ping);
    }); 
};

chrome.runtime.onInstalled.addListener(() => {
    chrome.alarms.get(ALARM_FOREVER, a => {
      if (!a) {
        createAlarm();
      }
    });
});

//Automatic data fetching
chrome.alarms.onAlarm.addListener((alarmInfo) => {
    fetchPopupResponse(alarmInfo.name);
});

//Manually triggered data fetching
chrome.runtime.onMessage.addListener((request, sender, reply) => {
    if (request.greeting == "manual-refresh") {
        fetchPopupResponse(request.greeting);
        reply({ farewell: "goodbye" });
    }
    return true;
});

//Updating the alarm's schedule interval
chrome.runtime.onMessage.addListener((request, sender, reply) => {
    if (request.greeting == "update-alarm") {
        createAlarm();
        reply({ farewell: "goodbye" });
    }
    return true;
});

function createAlarm() {
    getPingFromStoragePromise().then(function (ping) {
        let pingIntervalMinutes = (ping * 1.0)/60; // convert to minutes
        console.log("Period in minutes " + pingIntervalMinutes);
        chrome.alarms.create(ALARM_FOREVER, {periodInMinutes: pingIntervalMinutes, when: Date.now() + (ping * 1000)});
        console.log("alarm registered at " + getTime());
    }).catch(function() {
        console.error("Error while getting ping");
    });
}





