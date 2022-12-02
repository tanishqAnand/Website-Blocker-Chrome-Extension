var blockedSites = [];
var tabBlockingMap = {};

chrome.storage.local.get("blocked", function(items) {
  if (items.blocked)
    blockedSites = items.blocked;
});

function addBlockedSite(tabid, blockedSite) {
  blockedSites.push(blockedSite);
  tabBlockingMap[tabid] = blockedSite;
}

function unlistSite(tabid, site) {
  var i = blockedSites.indexOf(site);
  if (i > -1)
    blockedSites.splice(i, 1);
  chrome.storage.local.set( {blocked: blockedSites}, function() {
    console.log("Site Unlisted");
  });
  tabBlockingMap[tabid] = 0;
}

function clearBlacklist() {
  blockedSites = [];
  tabBlockingMap = {};
  chrome.storage.local.set( {blocked: []}, function() {
    console.log("Blacklist cleared");
  });
}

function getTabState(tabid) {
  console.log(tabid);
  return tabBlockingMap[tabid];
}

async function fetchPhishingSite(request) {
  //console.log('abcde');
  const result = await fetch("https://checkurl.phishtank.com/checkurl/index.php", {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
        method: 'POST',
        body: new URLSearchParams({
            url: request,
            format: 'json'
        })
      })
      var x=await result.json();
      //console.log("abced");
      //console.log(x);
      
  return x;
}

async function requestChecker(request) {
  console.log("onBeforeRequest");
  if (request && request.url) {
    if (request.type == "main_frame") {
      var tabBlockingState = 0;
      for (var i = 0; i < blockedSites.length; ++i) {
        if (request.url.match(new RegExp(
            ".*" + blockedSites[i] + ".*", "i"))) {
          tabBlockingState = blockedSites[i];
        }
      }
      chrome.tabs.getSelected(null, function(tab) {
        tabBlockingMap[tab.id] = tabBlockingState;
        console.log(
          "tab blocking state set for tab " +
          tab.id +
          " to " +
          tabBlockingState);
      });
      if (tabBlockingState != 0) {
        console.log("entered here");
        var redirectUrl = chrome.extension.getURL(
            "blockedSite.html?blocked=" + tabBlockingState);
        return { redirectUrl :redirectUrl};
      }
      
      else
      {
        var fetchedResult = await fetchPhishingSite(request.url);
        //console.log("reach fetch");
        if (fetchedResult['results']['in_database']) 
        {
          if(fetchedResult['results']['verified']&&fetchedResult['results']['valid'])
          {
            console.log("blocked sites is: " + blockedSites);
            chrome.tabs.getSelected(null, function(tab) {
                console.log("BLOCKING SITE " + request.url);
        
                var urlToBlock = /.*\/\/.*?\//.exec(request.url)[0];
                console.log("Root URL is " + urlToBlock);
                chrome.storage.local.set( {blocked: blockedSites}, function() {
                  console.log("Site Blocked");
                });
                chrome.tabs.remove(tab.id);
                chrome.tabs.create({
                  url: 'blockedSite2.html'+'?url='+urlToBlock
                })
             
            });
            
          }
        }
      }
      //console.log("cool")
    }
  }
}


chrome.webRequest.onBeforeRequest.addListener(
  requestChecker, {urls: ["*://*/*"]}, ["blocking"]);

function updateMapping(details) {
  console.log("onCommitted");
  console.log(
    "replacing tab " +
    details.replacedTabId +
    " with tab " +
    details.tabId);
  if (typeof details.replacedTabId == "undefined") {
    if (!details.tabId in tabBlockingMap) {
      tabBlockingMap[details.tabId] = 0;
    }
  }
  else {
    tabBlockingMap[details.tabId] = tabBlockingMap[details.replacedTabId];
    delete tabBlockingMap[details.replacedTabId];
  }
}

chrome.webNavigation.onTabReplaced.addListener(updateMapping);
chrome.webNavigation.onCommitted.addListener(updateMapping);
