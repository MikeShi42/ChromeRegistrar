var whoisologyAPIKey = "";

//Load API Key
chrome.storage.sync.get({
    api_key: ''
}, function(items) {
    whoisologyAPIKey = items.api_key;
});

//Store the last host name retrieved for the tabId
var lastHostName = [],
    //Hold registrar icon/name when no hostName change is detected but a page nav has occured
    registrarDataCache = [];

//Load and parse TLD list
$.get(chrome.extension.getURL("resources/effective_tld_names.dat"), function(data){
    window.publicSuffixList.parse(data, punycode.toASCII);
    console.log(data);
});

//Listen for any tab navigation
chrome.tabs.onUpdated.addListener(function(tabId, changeinfo, tab){
    var url = tab.url;
    //Provide element to parse hostname
    var parser = document.createElement('a');
    parser.href = url;

    //Get Domain Name Only
    var domain = window.publicSuffixList.getDomain(parser.hostname).toLowerCase();

    console.log('Change On', tabId);

    //Ignore New Tabs
    if(parser.hostname == 'newtab'){
        return;
    }

    //Only Reload On Change of Hostname
    if(!lastHostName[tabId] || domain != lastHostName[tabId]){
        console.log('Raw', url);
        console.log('Parse', domain);
        lastHostName[tabId] = domain;
        //Query Whoisology API for Registrar
        jQuery.getJSON('https://whoisology.com/api?request=field&level=other&field=registrar_name&domain=' + domain + '&auth=' + whoisologyAPIKey, function(data){
            var registrarName = data.value;
            console.log('Registrar', registrarName);
            if(!registrarName){
                //If no registrar name, we won't show any page action
                return;
            }

            //Get Registrar Name -> Registrar Site Dictionary
            $.getJSON('resources/registrarSiteDictionary.json', function(registrarListing) {
                //Search and match the registrar name with URL through our dictionary
                var registrarUrl = getRegistrarUrl(registrarListing, registrarName);
                if(!registrarUrl){
                    //If no registrar URL, we won't show any page action
                    return;
                }

                //Load the image from Google Plus's Favicon API
                loadImage("https://plus.google.com/_/favicon?domain="+registrarUrl, function(imageData) {
                    //Set the registrar icon and name
                    chrome.pageAction.show(tabId);
                    chrome.pageAction.setIcon({'tabId':tabId, imageData: imageData});
                    chrome.pageAction.setTitle({'tabId':tabId, title: registrarName});
                    //Set the registrar data into cache so it can be reused when the host name has not changed
                    registrarDataCache[tabId] = {'image':imageData, 'name':registrarName, 'url': registrarUrl};
                });
            });
        });
    }
    //If no change, show the icon so it doesn't just disappear.
    else{
        if(registrarDataCache[tabId]){
            chrome.pageAction.show(tabId);
            chrome.pageAction.setIcon({'tabId':tabId, imageData: registrarDataCache[tabId].image});
            chrome.pageAction.setTitle({'tabId':tabId, title: registrarDataCache[tabId].name});
        }
    }
});

//Clicking icon will load the registrar's website
chrome.pageAction.onClicked.addListener(function(tab){
    //If it's loaded in cache, grab and load url
    if(registrarDataCache[tab.id]){
        chrome.tabs.create({ url: registrarDataCache[tab.id].url });
    }
});

//Find the registrar url by matching name with provided dictionary
function getRegistrarUrl(registrarListing, registrarName){
    for(var i=0; i<registrarListing.length; i++){
        if(registrarListing[i].name.toLowerCase() == registrarName.toLowerCase()){
            return registrarListing[i].url;
        }
    }
    return null;
}

//Load an image from URL and pass image data to callback
function loadImage(url, callback){
    var canvas = document.createElement("canvas");
    var img = new Image();
    img.src = url;
    img.onload = function(){
        document.body.appendChild(canvas);
        var context = canvas.getContext("2d");
        context.drawImage(this, 0, 0);
        var imageData = context.getImageData(0, 0, img.width, img.height);
        callback(imageData);
        //Clean up the canvas
        $('canvas').remove();
    };
}