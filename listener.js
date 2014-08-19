//Store the last host name retrieved for the tabId
var lastHostName = [],
    //Hold registrar icon/name when no hostName change is detected but a page nav has occured
    registrarDataCache = [];

//Listen for any tab navigation
chrome.tabs.onUpdated.addListener(function(tabId, changeinfo, tab){
    var url = tab.url;
    var parser = document.createElement('a');
    parser.href = url;
    //Only Reload On Change of Hostname
    if(parser.hostname != lastHostName[tabId]){
        console.log('Raw', url);
        console.log('Parse', parser.hostname);
        lastHostName[tabId] = parser.hostname;
        //Query DomainTools API for Registrar
        jQuery.get('http://api.domaintools.com/v1/'+parser.hostname+'/', function(data){
            var registrarName = data.response.registration.registrar;
            console.log('Registrar', registrarName);

            $.getJSON('registrarSiteDictionary.json', function(registrarListing) {
                //Search and match the registrar name with URL through our dictionary
                var registrarUrl = getRegistrarUrl(registrarListing, registrarName);

                //Load the image from Google Plus's Favicon API
                loadImage("https://plus.google.com/_/favicon?domain="+registrarUrl, function(imageData) {
                    console.log(chrome.pageAction);
                    //Set the registrar icon and name
                    chrome.pageAction.show(tabId);
                    chrome.pageAction.setIcon({'tabId':tabId, imageData: imageData});
                    chrome.pageAction.setTitle({'tabId':tabId, title: registrarName});
                    registrarDataCache[tabId] = {'image':imageData, 'name':registrarName}
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
    };
}