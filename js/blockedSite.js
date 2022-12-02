var site = document.URL;
site = site.substring(site.indexOf("?"));
site = site.substring(site.indexOf("=") + 1);
$("#blockMessage").text(site);

function doUnlistSite() {
  chrome.tabs.getCurrent(function(tab) {
    chrome.extension.getBackgroundPage().unlistSite(tab.id, site);
  });
  alert('Website unblocked');
  window.location = site;
}

chrome.extension.onMessage.addListener(
    function(message, sender, sendResponse) {
  chrome.tabs.getCurrent(function(tab) {
    if (tab.id == message) {
      doUnlistSite();
    }
  });
});

var showTable = true;

function renderBlockedSitesTable(data, show) {

  const blockedSitesTableDiv = $('#blockedSitesTableDiv');
  blockedSitesTableDiv.empty();

  if (!show)
    return;

  const table = $("<table></table>");
  table.addClass('table');
  table.addClass('table-striped');

  const thead = $("<thead></thead>");
  const tr_header = $("<tr></tr>");

  ["Sr. No.", "URL"].forEach(header => {
    const headerElem = $("<th></th>");
    headerElem.text(header); 
    headerElem.attr("scope", "col");
    tr_header.append(headerElem);
  });

  thead.append(tr_header);

  const tbody = $("<tbody></tbody>");

  data.forEach((d, idx) => {
    const rowElem = $("<tr></tr>");

    const dataElem1 = $("<td></td>");
    const dataElem2 = $("<td></td>");

    dataElem1.text(`${idx + 1}`);
    dataElem2.text(`${d}`);
    
    
    rowElem.append(dataElem1);
    rowElem.append(dataElem2);
    
    tbody.append(rowElem);
  })

  table.append(thead);
  table.append(tbody);
  blockedSitesTableDiv.append(table);
}

$("#showBlockedSitesBtn").on('click', () => {
  renderBlockedSitesTable(chrome.extension.getBackgroundPage().blockedSites, showTable); 
  showTable = !showTable;
});

