import globalState from 'src/base/state.js'
import { createScrollable } from 'src/util/window.js'
import { patch, vm } from 'src/util/inject.js'
import { HomeScene } from './home.js'
import withResolvers from 'src/util/withResolvers.js'
import { SceneManager } from '../base/scene.js'

export class PluginScene {
  static title = '插件'
  /**
   *
   * @param {import('../base/scene.js').SceneManager} manager
   */
  constructor(manager) {
    // TODO: 防篡改功能
    this.plugins = [] /* JSON.parse(
      window.localStorage.getItem('__csense-plugins') ??
        (window.localStorage.setItem('__csense-plugins', '[]'), '[]')
    ) */
    this.manager = manager
    globalState.pluginPromise = Promise.all(
      this.plugins.map(v => this.loadPlugin(v))
    )
  }
  async loadPlugin(url) {
    try {
      const resp = await import(url)
      await url.initalize({
        HomeScene,
        globalState,
        patch,
        createScrollable,
        withResolvers,
        manager: this.manager,
        SceneManager,
        vmPromise: vm
      })
    } catch (e) {
      console.error(`[CSense] 加载插件 ${url} 失败`, e)
      return
    }
  }
  updatePlugins() {
    this.plugins = this.plugins.filter(v => v)
    window.localStorage.setItem(
      '__csense-plugins',
      JSON.stringify(this.plugins)
    )
    window.location.reload()
  }
  render() {
    const target = this.manager.target
    const container = document.createElement('div')
    container.style.display = 'flex'
    const urlInput = document.createElement('input')
    urlInput.type = 'text'
    urlInput.placeholder = '输入插件地址...'
    urlInput.style.padding = '5px'
    urlInput.style.border = '1px solid #0e0e0e'
    urlInput.style.flexGrow = '1'
    urlInput.style.boxSizing = 'border-box'
    container.appendChild(urlInput)
    const addButton = document.createElement('button')
    addButton.textContent = '➕'
    addButton.title = '添加插件 (将会刷新页面)'
    addButton.style.padding = '5px'
    addButton.style.border = 'none'
    addButton.style.borderRadius = '5px'
    addButton.style.color = 'white'
    addButton.style.backgroundColor = 'blue'
    addButton.style.cursor = 'pointer'
    addButton.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.2)'
    addButton.style.width = '30px'
    addButton.style.height = '30px'
    addButton.addEventListener('click', async () => {
      const url = urlInput.value.trim()
      if (!url) return
      let urlObj = null
      try {
        urlObj = new URL(url)
      } catch {
        alert('无效的 URL')
        return
      }
      if (
        !urlObj.href.startsWith('https://') &&
        !urlObj.href.startsWith('http://')
      ) {
        alert('仅支持 HTTP(S) 插件地址')
        return
      }
      if (!urlObj.href.endsWith('.js')) {
        alert('插件地址必须以 .js 结尾')
        return
      }
      if (this.plugins.includes(urlObj.href)) {
        alert('此插件已添加')
        return
      }
      this.plugins.push(urlObj.href)
      this.updatePlugins()
    })
    container.appendChild(addButton)
    target.appendChild(container)
    const scrollable = createScrollable()
    const list = document.createElement('ul')
    list.style.listStyle = 'none'
    list.style.padding = '0'
    list.style.margin = '0'
    let loadPromise = Promise.resolve()
    this.plugins.forEach((url, idx) => {
      let urlObj = null
      try {
        urlObj = new URL(url)
      } catch {
        this.plugins[idx] = null
        return
      }
      const listItem = document.createElement('li')
      listItem.style.display = 'flex'
      listItem.style.alignItems = 'center'
      listItem.style.padding = '5px'
      listItem.style.border = '1px solid #0e0e0e'
      listItem.style.borderRadius = '4px'
      listItem.style.backgroundColor = '#1e1e1e'
      const name = document.createElement('span')
      name.textContent = decodeURIComponent(
        urlObj.pathname.replace(/\/$/, '').split('/').at(-1) ||
          urlObj.hostname ||
          '未知'
      )
      name.classList.add('item-name')
      name.style.marginRight = '10px'
      listItem.appendChild(name)
      const type = document.createElement('span')
      type.textContent =
        urlObj.hostname === 'csense-rev.github.io' ? '官方插件' : `第三方插件`
      type.title = urlObj.href
      type.style.fontSize = '12px'
      type.style.color = '#666'
      type.style.flexGrow = '1'
      listItem.appendChild(type)
      const removeButton = document.createElement('button')
      removeButton.textContent = '❌'
      removeButton.title = '删除插件 (将会刷新页面)'
      removeButton.addEventListener('click', () => {
        this.plugins[idx] = null
        this.updatePlugins()
      })
      listItem.appendChild(removeButton)
      list.appendChild(listItem)
    })
    scrollable.appendChild(list)
    target.appendChild(scrollable)
  }
  dispose() {}
}
