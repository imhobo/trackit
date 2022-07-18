/*
    Script that runs when the popup UI is active
*/

import {getPopupResponseFromStorage, LAST_REFRESH_KEY, META_KEY, PING_KEY } from './storage.js';
import { getTime, requestManualRefresh } from './util.js';

chrome.runtime.onMessage.addListener((request, sender, reply) => {
    
    if (request.greeting == "hello") {
        refreshPopup();
        reply({ farewell: "goodbye" });
    }
    return true;
});

async function refreshPopup() {
    await getAndDisplayPopupResponseFromStorage();
}

async function getAndDisplayPopupResponseFromStorage() {
    console.log("Refreshing popup UI at " + getTime());
    var popupResponse = await getPopupResponseFromStorage();
    clearPopup();
    displayPopupResponse(popupResponse);
}

function clearPopup() {
    document.getElementById('table_body').innerHTML = '';
}


function displayPopupResponse(popupResponse) {
    if(popupResponse.responses) popupResponse.responses.forEach(addResponseToTable);
    addMetaToTable(popupResponse.meta);
}


function addMetaToTable(meta) {
    var tbodyRef = document.getElementById('table_body');
    var lastRow = tbodyRef.insertRow();

    var lastRefreshCell = lastRow.insertCell();
    var lastRefreshValue = document.createTextNode("Last Refresh: " + meta[LAST_REFRESH_KEY]);
    lastRefreshCell.appendChild(lastRefreshValue);
    lastRefreshCell.colSpan = 2;
    lastRefreshCell.style.textAlign = "center";
    lastRefreshCell.style.fontWeight = 'bold';

  
    var refreshNowCell = lastRow.insertCell();
    var refreshNowImg = document.createElement('img');
    refreshNowCell.colSpan = 2;
    refreshNowImg.src = "./images/refresh-icon-default.png";
    refreshNowImg.style.width = '25px';
    refreshNowImg.style.height = '25px';
    refreshNowImg.style.cursor = "pointer";
    refreshNowImg.title = "Refresh now"
    refreshNowCell.style.textAlign = "center"
    refreshNowImg.onclick = function () {
        requestManualRefresh();
    };

    refreshNowImg.onmouseover = function () {
        refreshNowImg.src = "./images/refresh-icon-clicked.png";
    };

    refreshNowImg.onmouseout = function () {
        refreshNowImg.src = "./images/refresh-icon-default.png";
    };

    refreshNowCell.appendChild(refreshNowImg);
}

function addResponseToTable(response) {

    var tbodyRef = document.getElementById('table_body');
    var newRow = tbodyRef.insertRow();
    
    var statusCell = newRow.insertCell();
    var statusValue = document.createElement('img');
    statusCell.style.textAlign = "center";
    statusValue.src = response.status === "active" ? './images/green.png' : './images/red.png';
    statusValue.style.width = '15px';
    statusValue.style.height = '15px';
    statusCell.appendChild(statusValue);
    
    var nameCell = newRow.insertCell();
    var nameValue = document.createTextNode(response.name);
    nameCell.style.wordBreak = "break-all";
    nameCell.style.whiteSpace = "normal";
    nameCell.style.cursor = "pointer";
    nameCell.title = response.url;
    nameCell.onclick = function () {
        chrome.tabs.create({ url: response.url, active: false});
    };
    nameCell.onmousedown = function () {
        nameCell.style.color = "blue";
    };
    nameCell.onmouseup = function () {
        nameCell.style.color = "black";
    };

    nameCell.appendChild(nameValue);

    var latencyCell = newRow.insertCell();
    var latencyValue = document.createTextNode(response.latency);
    latencyCell.style.textAlign = "center";
    latencyCell.appendChild(latencyValue);

    var methodCell = newRow.insertCell();
    var methodValue = document.createTextNode(response.method);
    methodCell.appendChild(methodValue);
}


function settingsOnClick(evt, settingsButton) {
    // settingsButton.style.color = "burlywood";
    chrome.runtime.openOptionsPage();
}

function addListenerToSettingsButton() {
    var settingsButton = document.getElementById('settingsButton');
    settingsButton.addEventListener('click', (evt) => settingsOnClick(evt, settingsButton));
    settingsButton.addEventListener('mouseover', function() {
        settingsButton.style.color = "grey";
    });    
    settingsButton.addEventListener('mouseout', function() {
        settingsButton.style.color = "burlywood";
    });    
}

addListenerToSettingsButton();
refreshPopup();
