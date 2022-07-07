/*
    Script that runs when the options page is active
*/

import { getDataFromStorage, getPingFromStorage, PING_KEY } from './storage.js';

const ADD_DIALOG = "add-dialog-form";
const EDIT_DIALOG = "edit-dialog-form";
const DISPLAY_URL_LENGTH = 40;

let addDialog = getDialog(ADD_DIALOG);
let editDialog = getDialog(EDIT_DIALOG);
let editRecord = null;

function registerListeners() {
    let addRowButton = document.getElementById('addRowButton');
    addRowButton.addEventListener('click', openSaveWebsiteDialog);
    addRowButton.addEventListener('mouseover', function(){addRowButton.style.color = "blue";});
    addRowButton.addEventListener('mouseout', function(){addRowButton.style.color = "green";});

    document.getElementById('pingSaveButton').addEventListener('click', savePingToStorage);
    document.getElementById("addmethod").onchange = onChangeHtmlMethod;
    document.getElementById("editmethod").onchange = onChangeHtmlMethod;
}

function getDialog(id) {

    var prefix = id === ADD_DIALOG ? "add" : "edit";
    var dialog = $("#" + id).dialog({
        autoOpen: false,
        height: 400,
        width: 400,
        modal: true,
        dialogClass: "no-close",
        buttons: [
          {
            text: "Save",
            click: function() {
                saveWebsite(id, this);
            }
          }
        ],
        close: function( event, ui ) {
            $("#" + id + " input[id=" + prefix + "url]").val("");
            $("#" + id + " input[id=" + prefix + "name]").val("");
            $("#" + id + " select[id=" + prefix + "method]").val("HEAD"); 
            $("#" + id + " input[id=" + prefix + "timeout]").val("4000");
            $("#" + id + " input[id=" + prefix + "contentinput]").val("");
            $("#" + id + " input[id=" + prefix + "bodyinput]").val("");
            editRecord = null;
        }
      });
    return dialog;
}

function validateAndFixUrl(url) {
    if (!url.match(/^[a-zA-Z]+:\/\//))
    {
        url = 'https://' + url;
    }
    return url;
}

async function saveWebsite(id, dialog) {

    var prefix = "";
    if(id.includes("add"))prefix = "add";
    else prefix = "edit";
    
    var url = document.getElementById(prefix + 'url').value;
    var displayName = document.getElementById(prefix + 'name').value;
    var method = document.getElementById(prefix + 'method').value;
    var timeout = document.getElementById(prefix + 'timeout').value;
    var contentType = document.getElementById(prefix + 'contentinput').value;
    var body = document.getElementById(prefix + 'bodyinput').value;
    var record = {"url":url, "name": displayName, "method": method, "timeout": timeout};

    if(method === "POST") {
        record.contentType = contentType;
        record.body = body;
    }

    var saveStatus = true;    

    //Validation for empty name or url
    if(!validRecord(record)) {
        alert("Fields can't be empty");
        saveStatus = false;
        return;
    }
    record.url = validateAndFixUrl(url);

    var data = await getDataFromStorage();
    
    if(!isEmpty(data) && data!== undefined) {
    
        //Validation for same entry already existing
        if(!compareRecords(editRecord, record) && containsRecord(data, record) != -1) {
            alert("Duplicate entry " + record.name);
            saveStatus = false;
            return;
        }
        
        //In case user tries to edit record, setting the edited value in the same index
        var index = containsRecord(data, editRecord);
        if(index === -1) data.records.push(record);
        else {
            data.records[index] = record;
        }
    }
    else {
        data.records = [];
        data.records.push(record);
    }

    saveDataToStorage(data);
    displaySettingsTable(data);

    if(saveStatus) $(dialog).dialog( "close" );
}

async function saveDataToStorage(data) {
    chrome.storage.sync.set({ "data": data }, function(){
        console.log(`Data persisted successfully.`);
    });
}

function openSaveWebsiteDialog() {
    setDialogPostFields("none", "add");
    addDialog.dialog('open');
}

function displaySettingsTable(data) {

    var tbodyRef = document.getElementById('settings_table_body');
    tbodyRef.innerHTML = "";
    var records = data.records;
    if(!records) return;
    for(var i=0 ; i<records.length; i++) {
        var record = records[i];
        displaySettingsRow(record);
    }
}

function getPartialString(text) {
    var length = text.length;
    if(length < DISPLAY_URL_LENGTH) return text;
    else return text.substring(0, DISPLAY_URL_LENGTH) + "...";
}

function displaySettingsRow(record) {

    var tbodyRef = document.getElementById('settings_table_body');
    var newRow = tbodyRef.insertRow();
    const EMPTY_VALUE = "";
    
    var nameCell = newRow.insertCell();
    var nameValue = document.createTextNode(record.name);
    
    nameCell.style.wordBreak = "break-all";
    nameCell.style.whiteSpace = "normal";
    nameCell.appendChild(nameValue);

    var urlCell = newRow.insertCell();
    urlCell.style.wordBreak = "break-all";
    var urlValue = document.createTextNode(getPartialString(record.url));
    urlCell.appendChild(urlValue);

    var methodCell = newRow.insertCell();
    var methodValue = document.createTextNode(record.method);
    methodCell.appendChild(methodValue);

    var timeoutCell = newRow.insertCell();
    var timeoutValue = document.createTextNode(record.timeout);
    timeoutCell.style.textAlign = "center"
    timeoutCell.appendChild(timeoutValue);

    var editCell = newRow.insertCell();
    var editImg = document.createElement('img');
    editImg.src = "./images/edit.png";
    editImg.style.width = '18px';
    editImg.style.height = '18px';
    editImg.style.cursor = "pointer";
    editCell.style.textAlign = "center"
    editImg.onclick = function () {
        setDisplayEditRowValues(record);
        editDialog.dialog('open');
    };
    editCell.appendChild(editImg);

    var delCell = newRow.insertCell();
    var delImg = document.createElement('img');
    delImg.src = "./images/delete.png";
    delImg.style.width = '18px';
    delImg.style.height = '18px';
    delImg.style.cursor = "pointer";
    delCell.style.textAlign = "center"
    delImg.onclick = function () {
        deleteRow(delImg, record);
    };
    delCell.appendChild(delImg);

}

async function deleteRow(element, record) {

    var data = await getDataFromStorage();
    data.records = data.records.filter(item => !compareRecords(item, record));
    await saveDataToStorage(data);

    var td = element.parentNode; 
    var tr = td.parentNode;
    tr.parentNode.removeChild(tr);
}

function setDisplayEditRowValues(record) {
    $("#edit-dialog-form input[id=editurl]").val(record.url);
    $("#edit-dialog-form input[id=editname]").val(record.name);
    $("#edit-dialog-form select[id=editmethod]").val(record.method); 
    $("#edit-dialog-form input[id=edittimeout]").val(record.timeout);
    $("#edit-dialog-form input[id=editcontentinput]").val(record.contentType);
    $("#edit-dialog-form input[id=editbodyinput]").val(record.body);
    if(record.method === "POST")setDialogPostFields("block", "edit");
    //Remember the record before user edits it.
    editRecord = record;
}

function compareRecords(record1, record2) {

    if( record1 == record2 )
        return true;

    // check for null
    if( record1 == null || record2 == null )
        return false;

    // go through the keys in d1 and check if they're in d2 - also keep a count
    var count = 0;
    for( var key in record1 )
    {
        // check if the key exists
        if( !( key in record2 ) )
            return false;

        // check that the values are the same
        if( record1[key] != record2[key] )
            return false;

        count++;
    }

    // now just make sure d2 has the same number of keys
    var count2 = 0;
    for( key in record2 )
        count2++;

    // return if they're the same size
    return ( count == count2 );
}

function containsRecord(data, record) {

    if(record == null) return -1;
    for( var i = 0; i< data.records.length; i++) {
        if(compareRecords(data.records[i], record)) return i;
    }
    return -1;
}

function validRecord(record) {
    for (const [key, value] of Object.entries(record)) {
        if (!(value && value.trim().length)) return false;
    }
    return true;
}

function displaySettingsPage(data, ping) {
    displaySettingsTable(data);
    displayPingValue(ping);

}

function displayPingValue(pingInterval) {
    document.getElementById('pingInterval').value = pingInterval;
}

async function savePingToStorage() {

    var pingInterval = document.getElementById('pingInterval').value;
    chrome.storage.sync.set({ [PING_KEY]:  pingInterval}, function(){
        chrome.runtime.sendMessage({ greeting: "update-alarm" }, function (response) {
            if(chrome.runtime.lastError) {
                //Background service is not active and no one received the message
            } 
        });
        console.log(`Ping interval persisted successfully.`);
    });
}

function isEmpty(obj) { 
    for (var x in obj) { return false; }
    return true;
 }

 function setDialogPostFields(displayProperty, prefix) {
    document.getElementById(prefix + "contentrow").style.display = displayProperty;
    document.getElementById(prefix + "bodyrow").style.display = displayProperty;
 }

 function onChangeHtmlMethod(selectObject) {
    
    var prefix = selectObject.target.id.includes("add") ? "add" : "edit";
    var value = selectObject.target.value;  
    if(value === "POST") {
        setDialogPostFields("block", prefix);
    }
    else {
        setDialogPostFields("none", prefix);
    }
    
}

registerListeners();
var data = await getDataFromStorage();
var ping = await getPingFromStorage();
displaySettingsPage(data, ping);
