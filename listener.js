var lastHostName = '';

chrome.tabs.onUpdated.addListener(function(tabId, changeinfo, tab){
    var url = tab.url;
    var parser = document.createElement('a');
    parser.href = url;
    if(parser.hostname != lastHostName){
        console.log('Raw', url);
        console.log('Parse', parser.hostname);
        lastHostName = parser.hostname;
        jQuery.get('http://api.domaintools.com/v1/'+parser.hostname+'/', function(data){
            var registrarName = data.response.registration.registrar;
            console.log('Registrar', registrarName);

            $.getJSON('registrarSiteDictionary.json', function(registrarListing) {
                var registrarUrl = null;
                for(var i=0; i<registrarListing.length; i++){
                    if(registrarListing[i].name.toLowerCase() == registrarName.toLowerCase()){
                        registrarUrl = registrarListing[i].url;
                        console.log(registrarUrl);
                    }
                }
                console.log('Done');
            });
        });
    }
});