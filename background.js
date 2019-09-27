(function (app) {
  app.elements = []
  app.navTargetedTabs = {}

  // when a tab is updated, do this stuff
  const handleTabUpdated = async (tabId) => {
    try {
      const v = await app.getVisitFromTabId(tabId)

      if (v) {
        const visitIdx = app.getElementIndexByTime(v.lastVisitTime)

        if (visitIdx >= 0) {
          app.elements[visitIdx].data = v
        } else {
          const visitsInTab = app.elements.filter((e) => e.data.tabId === v.tabId)
          const sourceVisit = visitsInTab[visitsInTab.length - 1]

          app.addToGraph(
            v,
            {
              source: sourceVisit ? sourceVisit.data.id : v.id,
              target: sourceVisit ? v.id : tabId,
              transition: sourceVisit ? 'link' : undefined,
            }
          )

          const targetDetails = app.navTargetedTabs[tabId]

          if (targetDetails) {
            const visitsInTab2 = app.elements.filter((e) => e.data.tabId === targetDetails.sourceTabId)
            const sourceV = visitsInTab2[visitsInTab2.length - 1]

            app.addToGraph(
              null,
              {
                source: sourceV.data.id,
                target: v.id,
                transition: 'new_tab',
              },
            )

            delete app.navTargetedTabs[tabId]
          }
        }
      }
    } catch (err) { console.error(err) }
  }

  const addWindowAndContentsToGraph = (w) => {
    app.addToGraph({ ...w, type: 'window' })

    chrome.tabs.getAllInWindow(w.id, tabsInWindow => {
      tabsInWindow.forEach(async (t) => {
        app.addToGraph({ ...t, type: 'tab' }, { source: t.id, target: w.id })

        try {
          const v = await app.getVisitFromTabId(t.id)

          if (v) { app.addToGraph(v, { source: v.id, target: t.id }) }
        } catch (err) { console.error(err) }
      })
    })
  }

  chrome.tabs.onUpdated.addListener(handleTabUpdated)

  const handleWindowInitialization = (windows) => windows.forEach(addWindowAndContentsToGraph)

  // add the current windows, tabs, and pages to the graph
  const initializeGraph = () => chrome.windows.getAll(handleWindowInitialization)

  // begin!
  initializeGraph()
})(window.app = window.app || {})
