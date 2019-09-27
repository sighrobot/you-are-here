(function (app) {
  // generates a unique-enough string
  app.uid = () => Math.round(Math.random() * 1e9).toString()

  app.getElementIndexByTime = (time) => {
    for (var i = 0; i < app.elements.length; i++) {
        if (app.elements[i].data.lastVisitTime === time) {
            return i
        }
    }

    return -1
  }

  // add node to graph via edge
  app.addToGraph = (nodeData, edgeData) => {
    if (nodeData) { app.elements.push({ data: nodeData }) }

    if (edgeData) {
      app.elements.push({ data: { id: app.uid(), ...edgeData } })
    }
  }

  // gets a Promise-wrapped VisitItem for the page loaded in tab <tabId>
  app.getVisitFromTabId = (tabId, time) => {
    return new Promise((resolve, reject) => {
      chrome.tabs.get(tabId, (tab) => {
        chrome.history.getVisits({ url: tab.url }, (visitsForUrl) => {
          chrome.history.search({ text: '' }, (recentVisits) => {
            const filteredForUrl = visitsForUrl.filter(v => !time || v.visitTime < time)
            const visitWithContext = filteredForUrl.slice(-1)[0]

            if (visitWithContext) {
              const mostRecentVisit = recentVisits.filter(rv => rv.id === visitWithContext.id)[0]

              resolve({
                ...mostRecentVisit,
                ...visitWithContext,
                id: visitWithContext.visitId,
                __id: visitWithContext.id,
                tabId,
              })
            }
          })
        })
      })
    })
  }
})(window.app = window.app || {})
