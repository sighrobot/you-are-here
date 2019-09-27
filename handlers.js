(function () {
  // when a window is created, do this stuff
  app.handleWindowCreated = (w) => app.addToGraph({ ...w, type: 'window' })

  app.handleTabCreated = (t) => {
    app.addToGraph(
      { ...t, type: 'tab' },
      { target: t.windowId, source: t.id },
    )
  }

  app.handleMessage = (request, sender, sendResponse) => {
    if (request) { sendResponse({ elements: app.elements }) }
  }

  app.handleVisited = (v) => {
    const visitIdx = app.getElementIndexByTime(v.lastVisitTime)

    if (visitIdx >= 0) { app.elements[visitIdx].data = v }
  }

  app.handleCreatedNavigationTarget = (details) => { app.navTargetedTabs[details.tabId] = details }

  chrome.history.onVisited.addListener(app.handleVisited)
  chrome.runtime.onMessage.addListener(app.handleMessage)
  chrome.tabs.onCreated.addListener(app.handleTabCreated)
  chrome.webNavigation.onCreatedNavigationTarget.addListener(app.handleCreatedNavigationTarget)
  chrome.windows.onCreated.addListener(app.handleWindowCreated)
})(window.app = window.app || {})
