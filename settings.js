/**
 * Created by Mike on 8/22/14.
 */
// Saves options to chrome.storage
function save_options() {
    var api_key = document.getElementById('api_key').value;
    //Validate API Key
    jQuery.get('https://whoisology.com/api?request=credits&auth='+api_key, function(data){
        //Check if there is enough credits for this API Key
        if(data.indexOf("Not enough credits for this request") == -1){
            chrome.storage.sync.set({
                api_key: api_key
            }, function() {
                //Parse Remaining Credits
                var creditsData = JSON.parse(data);
                var credits = creditsData.credits;
                // Update status to let user know options were saved.
                var status = document.getElementById('status');
                status.textContent = 'Options saved. Credits On Account:' + credits + '. Reloading Extension...';
                setTimeout(function() {
                    status.textContent = '';
                    //Reload Chrome For New API Key
                    //TODO: Less hackey API Key Reload Solution
                    chrome.runtime.reload();
                }, 1500);
            });
        }else{
            // Update status to let user know api key is invalid.
            var status = document.getElementById('status');
            status.textContent = 'Invalid API Key Detected.';
            setTimeout(function() {
                status.textContent = '';
            }, 750);
        }
    });
}

// Restores select box and checkbox state using the preferences
// stored in chrome.storage.
function restore_options() {
    // Use default value color = 'red' and likesColor = true.
    chrome.storage.sync.get({
        api_key: ''
    }, function(items) {
        document.getElementById('api_key').value = items.api_key;
    });
}
document.addEventListener('DOMContentLoaded', restore_options);
document.getElementById('save').addEventListener('click',
    save_options);