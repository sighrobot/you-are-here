const EDGE_TEXT = {
  new_tab: 'Opened link in a new tab',
  typed: 'Typed into the address bar',
  reload: 'Reloaded the page',
}

const getColorByType = n => {
  const { type } = n.data()

  switch (type) {
    case 'tab':
      return `forestgreen`

    case 'window':
      return `cornflowerblue`

    default:
      return '#666'
  }
}

const getLabelByType = n => {
  const { id, title, type, url, index } = n

  switch (type) {
    case 'tab':
      return `Tab ${id}`

    case 'window':
      return `Window ${id}`

    default:
      return title || url
  }
}

const createFaviconImg = (url) => {
  const img = document.createElement('img')

  img.src = `chrome://favicon/size/32@2x/${url}`

  return img
}

let cy

chrome.runtime.sendMessage(true, (response) => {
    const { elements } = response

    cy = cytoscape({
      container: document.getElementById('cy'),

      elements,

      style: [
        {
          selector: 'node',
          style: {
            'background-color': n => getColorByType(n),
            'label': n => getLabelByType(n),
            'text-max-width': 4,
          }
        },

        {
          selector: 'edge',
          style: {
            'line-color': '#ccc',
            'label': e => e.data().transition,
            'curve-style': 'bezier',
            'target-arrow-shape': 'triangle',
          }
        }
      ],

      layout: {
        name: 'concentric',
        concentric: node => {
          const t = node.data().type

          if (t === 'window') {
            return 2
          }

          if (t === 'tab') {
            return 1
          }

          return 0
        },
        nodeDimensionsIncludeLabels: true,
      }
    })

    chrome.tabs.query({ currentWindow: true, active: true }, (tabs) => {
      const currentTab = tabs[0]
      const visitsInTab = elements.filter((e) => e.data.tabId === currentTab.id)
      const currentVisit = visitsInTab[visitsInTab.length - 1]
      const node = currentVisit ? cy.$id(currentVisit.data.id) : cy.$id(currentTab.id)

      const pathEl = document.createElement('section')

      document.body.appendChild(pathEl)

      if (node.data().type === 'tab') {
        const msg = document.createElement('div')

        msg.innerHTML = 'Check back here after you\'ve visited some web pages in this tab!'

        pathEl.appendChild(msg)
      } else {
        const numNodes = node.predecessors().nodes().length + 1
        const numTabs = node.predecessors('edge[transition = "new_tab"]').length + 1

        document.querySelector('#path')

        const pathSummary = document.createElement('p')
        pathSummary.innerHTML = `This path includes ${numNodes} page${numNodes === 1 ? '' : 's'} and ${numTabs} tab${numTabs === 1 ? '' : 's'}.`
        document.querySelector('header').appendChild(pathSummary)

        const path = node.predecessors().toArray()

        path.unshift(node)
        path.map(p => p.data()).forEach(renderElement)
      }
    })
})

const getDomain = (url) => ((url || '').split('://')[1] || '').split('/')[0]

const renderElement = (e, idx, path) => {
  const { title, transition, url } = e

  if (url && title !== (path[idx - 2] || {}).title) {
    const article = document.createElement('article')

    if (
      (getDomain(url) !== getDomain((path[idx - 2] || {}).url))
      || (idx === 0)
    ) {
      const favIcon = createFaviconImg(url)

      article.className = 'primary'
      article.appendChild(favIcon)
    }

    const pageTitle = document.createElement('a')

    pageTitle.href = e.url
    pageTitle.innerHTML = getLabelByType(e)
    article.appendChild(pageTitle)

    document.querySelector('section').appendChild(article)

    if (transition === 'typed') {
      const aside = document.createElement('aside')

      aside.innerHTML = EDGE_TEXT[transition]
      aside.className = transition
      document.querySelector('section').appendChild(aside)
    }

    return
  }

  if (transition !== 'link' && transition !== 'generated') {
    const aside = document.createElement('aside')

    aside.innerHTML = EDGE_TEXT[transition]
    aside.className = transition
    document.querySelector('section').appendChild(aside)
  }
}
