import globalState from '../base/state'
import { createScrollable } from 'src/util/window'

export class CCWDataScene {
  static title = '云数据管理'
  constructor(manager, extension) {
    this.manager = manager
    this.extension = extension
    this.selected = 'project' // 'user'
    this.disposed = false
    // DOM elements
    this.lastFocused = null
    this.noResultsItem = null
    this.inputs = {}
    const animationFrame = () => {
      const db = globalState.ccwdata[this.selected]
      for (const [name, value] of db.entries()) {
        if (!this.inputs[name]) {
          const v = this.createListElement(this.selected, name)
          this.inputs[name] = v[1]
          this.manager.target.querySelector('ul').appendChild(v[2])
          if (this.noResultsItem) {
            this.noResultsItem.remove()
            this.noResultsItem = null
          }
        } else {
          if (
            this.inputs[name].value !== value &&
            this.inputs[name] !== this.lastFocused
          ) {
            this.inputs[name].animate([{ color: 'red' }, { color: '' }], {
              duration: 300
            })
            this.inputs[name].value = value
          }
        }
      }
      if (!this.disposed) requestAnimationFrame(animationFrame)
    }
    requestAnimationFrame(animationFrame)
  }
  createListElement(type, name) {
    const value = globalState.ccwdata[type].get(name)
    const listItem = document.createElement('li')
    listItem.style.display = 'flex'
    listItem.style.alignItems = 'center'
    listItem.style.marginBottom = '5px'
    listItem.style.padding = '5px'
    listItem.style.border = '1px solid #0e0e0e'
    listItem.style.borderRadius = '4px'
    listItem.style.backgroundColor = '#1e1e1e'

    const nameSpan = document.createElement('span')
    nameSpan.textContent = name
    nameSpan.style.flexGrow = '1'
    nameSpan.style.marginRight = '10px'
    nameSpan.className = 'item-name'

    const valueInput = document.createElement('input')
    valueInput.type = 'text'
    valueInput.style.fontFamily = 'monospace'
    valueInput.style.backgroundColor = '#333333'
    valueInput.style.color = '#ffffff'
    valueInput.value = Array.isArray(value) ? JSON.stringify(value) : value
    valueInput.style.flexGrow = '2'
    valueInput.style.marginRight = '10px'
    valueInput.addEventListener('change', () => {
      if (type === 'project') {
        this.extension._setValueToProject(name, valueInput.value)
      } else {
        this.extension._setValueToUser(name, valueInput.value)
      }
    })
    valueInput.addEventListener('focus', () => {
      this.lastFocused = valueInput
    })
    valueInput.addEventListener('blur', () => {
      this.lastFocused = null
    })

    listItem.appendChild(nameSpan)
    listItem.appendChild(valueInput)
    // variableList.appendChild(listItem)
    return [name, valueInput, listItem]
  }
  render() {
    const tabContainer = document.createElement('div')
    tabContainer.style.display = 'flex'
    tabContainer.style.justifyContent = 'center'

    const projectTab = document.createElement('button')
    projectTab.textContent = '作品'
    projectTab.style.flexGrow = '1'
    projectTab.style.padding = '10px'
    projectTab.style.border = '1px solid #0e0e0e'
    projectTab.style.borderBottom =
      this.selected === 'project' ? 'none' : '1px solid #0e0e0e'
    projectTab.style.backgroundColor =
      this.selected === 'project' ? '#333333' : '#1e1e1e'
    projectTab.style.cursor = 'pointer'
    projectTab.addEventListener('click', () => {
      this.selected = 'project'
      this.manager.requestUpdate()
    })

    const userTab = document.createElement('button')
    userTab.textContent = '用户'
    userTab.style.flexGrow = '1'
    userTab.style.padding = '10px'
    userTab.style.border = '1px solid #0e0e0e'
    userTab.style.borderBottom =
      this.selected === 'user' ? 'none' : '1px solid #0e0e0e'
    userTab.style.backgroundColor =
      this.selected === 'user' ? '#333333' : '#1e1e1e'
    userTab.style.cursor = 'pointer'
    userTab.addEventListener('click', () => {
      this.selected = 'user'
      this.manager.requestUpdate()
    })

    tabContainer.appendChild(projectTab)
    tabContainer.appendChild(userTab)
    this.manager.target.appendChild(tabContainer)

    const searchInput = document.createElement('input')
    searchInput.type = 'text'
    searchInput.placeholder = '搜索变量...'
    searchInput.style.padding = '5px'
    searchInput.style.border = '1px solid #0e0e0e'
    searchInput.style.width = '100%'
    searchInput.style.boxSizing = 'border-box'
    searchInput.style.backgroundColor = '#333333'
    searchInput.style.color = '#ffffff'
    searchInput.addEventListener('input', () => {
      const filter = searchInput.value.toLowerCase()
      const items = variableList.children
      let hasResults = false
      Array.from(items).forEach(item => {
        if (
          item.className !== 'no-results' &&
          item
            .querySelector('.item-name')
            .textContent.toLowerCase()
            .includes(filter)
        ) {
          item.style.display = 'flex'
          hasResults = true
        } else if (item.className !== 'no-results') {
          item.style.display = 'none'
        }
      })

      if (!hasResults) {
        if (!variableList.querySelector('.no-results')) {
          const noResultsItem = document.createElement('li')
          noResultsItem.textContent = '(无结果)'
          noResultsItem.className = 'no-results'
          noResultsItem.style.display = 'flex'
          noResultsItem.style.justifyContent = 'center'
          noResultsItem.style.alignItems = 'center'
          noResultsItem.style.width = '100%'
          noResultsItem.style.height = '100%'
          noResultsItem.style.color = '#999'
          variableList.appendChild(noResultsItem)
        }
      } else {
        const noResultsItem = variableList.querySelector('.no-results')
        if (noResultsItem) {
          variableList.removeChild(noResultsItem)
        }
      }
    })
    this.manager.target.appendChild(searchInput)

    const scrollable = createScrollable()
    const db = globalState.ccwdata[this.selected]
    const variableList = document.createElement('ul')
    variableList.style.padding = '0'
    variableList.style.margin = '0'
    variableList.style.listStyleType = 'none'
    variableList.style.marginTop = '10px'

    if (db.keys().length === 0) {
      const noResultsItem = document.createElement('li')
      noResultsItem.textContent = '(无结果)'
      noResultsItem.className = 'no-results'
      noResultsItem.style.display = 'flex'
      noResultsItem.style.justifyContent = 'center'
      noResultsItem.style.alignItems = 'center'
      noResultsItem.style.width = '100%'
      noResultsItem.style.height = '100%'
      noResultsItem.style.color = '#999'
      this.noResultsItem = noResultsItem
      variableList.appendChild(noResultsItem)
    } else {
      this.inputs = Object.fromEntries(
        db.keys().map(name => {
          const v = this.createListElement(this.selected, name)
          variableList.appendChild(v[2])
          return [name, v[1]]
        })
      )
    }

    scrollable.appendChild(variableList)
    this.manager.target.appendChild(scrollable)
  }
  dispose() {
    this.disposed = true
  }
}
