import globalState from 'src/base/state.js'
import { createScrollable } from 'src/util/window.js'
import { ExtensionEditScene } from './extensionEdit.js'
import { patch } from 'src/util/inject.js'

export class ExtensionScene {
  static title = '扩展'
  /**
   *
   * @param {import('../base/scene.js').SceneManager} manager
   * @param {import('../overlay/extension.js').ExtensionOverlay} overlay
   */
  constructor(manager, overlay) {
    this.manager = manager
    this.overlay = overlay
    const extensionsList = (this.extensionsList = [])
    for (const ext of this.overlay.projectJson.extensions) {
      if (!this.overlay.projectJson.gandi?.wildExtensions?.[ext])
        extensionsList.push({
          name: ext,
          type: 'internal',
          url: null
        })
    }
    if (this.overlay.projectJson.gandi?.wildExtensions) {
      for (const [name, obj] of Object.entries(
        this.overlay.projectJson.gandi?.wildExtensions ?? {}
      )) {
        extensionsList.push({
          name,
          type: 'custom',
          url: obj.url,
          newContent: null
        })
      }
    }
  }
  async loadExtension(ext) {
    if (
      !globalState.vm.extensionManager._gandiExternalExtensionServicesLoaded
    ) {
      await globalState.vm.extensionManager.loadGandiExternalExtensionServers()
    }
    if (ext.type === 'internal') {
      await globalState.vm.extensionManager.loadExtensionURL(ext.name)
    } else if (ext.type === 'custom' && ext.url) {
      let url = ext.url
      let isFake = false
      if (ext.newContent !== null) {
        url = URL.createObjectURL(
          new File([ext.newContent], 'extension.js', {
            type: 'application/javascript'
          })
        )
        patch(
          globalState.vm.extensionManager,
          'addCustomExtensionInfo',
          addCustomExtensionInfo => {
            return function (ext, maskUrl) {
              if (maskUrl === url) {
                maskUrl = ext.url
              }
              globalState.vm.extensionManager.addCustomExtensionInfo =
                addCustomExtensionInfo
              return addCustomExtensionInfo.call(this, ext, maskUrl)
            }
          }
        )
        isFake = true
        patch(document, 'createElement', createElement => {
          return function (tagName) {
            if (tagName === 'script') {
              const script = createElement.call(this, tagName)
              const proxy = new Proxy(script, {
                set(target, prop, value) {
                  if (prop === 'src') {
                    return Reflect.set(target, 'src', url)
                  } else return Reflect.set(target, prop, value)
                }
              })
              document.createElement = createElement
              patch(document.body, 'append', append => {
                return function (child) {
                  if (child === proxy) {
                    document.body.append = append
                    return append.call(this, script)
                  }
                  return append.call(this, child)
                }
              })
              patch(document.body, 'removeChild', removeChild => {
                return function (child) {
                  if (child === proxy) {
                    document.body.removeChild = removeChild
                    return removeChild.call(this, script)
                  }
                  return removeChild.call(this, child)
                }
              })
              return proxy
            }
            return createElement.call(this, tagName)
          }
        })
      }
      await globalState.vm.extensionManager.loadExtensionURL(url)
      if (isFake) URL.revokeObjectURL(url)
    }
  }
  async loadModifiedProject() {
    for (const ext of this.extensionsList) {
      if (globalState.vm.extensionManager.isExtensionLoaded(ext.name)) {
        continue
      }
      await this.loadExtension(ext)
    }
    if (this.overlay.projectJson.gandi?.wildExtensions) {
      this.overlay.projectJson.gandi.wildExtensions = {}
    }
    // Fuck you Gandi
    const _clearLoadedExtensions =
      globalState.vm.extensionManager.clearLoadedExtensions
    globalState.vm.extensionManager.clearLoadedExtensions = function () {
      // Prevent call for once
      globalState.vm.extensionManager.clearLoadedExtensions =
        _clearLoadedExtensions
    }
    this.overlay.projectJson.extensions = []
    this.overlay.projectJson.extensionURLs = {}
    this.overlay.input = this.overlay.input.file(
      'project.json',
      JSON.stringify(this.overlay.projectJson)
    )
    this.overlay.resolver.resolve(this.overlay.input)
  }
  render() {
    const target = this.manager.target
    const extensionsList = this.extensionsList
    if (extensionsList.length === 0) {
      // Dead code?
      const noExt = document.createElement('p')
      noExt.style.textAlign = 'center'
      noExt.textContent = '该项目没有使用任何扩展。'
      target.appendChild(noExt)
      return
    }
    const container = document.createElement('div')
    container.style.display = 'flex'
    const searchInput = document.createElement('input')
    searchInput.type = 'text'
    searchInput.placeholder = '搜索扩展...'
    searchInput.style.padding = '5px'
    searchInput.style.border = '1px solid #0e0e0e'
    searchInput.style.flexGrow = '1'
    searchInput.style.boxSizing = 'border-box'
    searchInput.style.backgroundColor = '#333333'
    searchInput.style.color = '#fff'
    searchInput.addEventListener('input', () => {
      const filter = searchInput.value.toLowerCase()
      const items = list.children
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
        if (!list.querySelector('.no-results')) {
          const noResultsItem = document.createElement('li')
          noResultsItem.textContent = '(无结果)'
          noResultsItem.className = 'no-results'
          noResultsItem.style.display = 'flex'
          noResultsItem.style.justifyContent = 'center'
          noResultsItem.style.alignItems = 'center'
          noResultsItem.style.width = '100%'
          noResultsItem.style.height = '100%'
          noResultsItem.style.color = '#999'
          list.appendChild(noResultsItem)
        }
      } else {
        const noResultsItem = list.querySelector('.no-results')
        if (noResultsItem) {
          list.removeChild(noResultsItem)
        }
      }
    })
    container.appendChild(searchInput)
    const continueButton = document.createElement('button')
    continueButton.textContent = '▶️'
    continueButton.title = '完成编辑'
    continueButton.style.padding = '5px'
    continueButton.style.border = 'none'
    continueButton.style.borderRadius = '5px'
    continueButton.style.color = 'white'
    continueButton.style.backgroundColor = 'blue'
    continueButton.style.cursor = 'pointer'
    continueButton.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.2)'
    continueButton.style.width = '30px'
    continueButton.style.height = '30px'
    continueButton.addEventListener('click', async () => {
      this.manager.back()
      this.overlay.showOverlay = false
      await this.loadModifiedProject()
    })
    container.appendChild(continueButton)
    target.appendChild(container)
    const scrollable = createScrollable()
    const list = document.createElement('ul')
    list.style.listStyle = 'none'
    list.style.padding = '0'
    list.style.margin = '0'
    let loadPromise = Promise.resolve()
    extensionsList.forEach(ext => {
      const listItem = document.createElement('li')
      listItem.style.display = 'flex'
      listItem.style.alignItems = 'center'
      listItem.style.padding = '5px'
      listItem.style.border = '1px solid #0e0e0e'
      listItem.style.borderRadius = '4px'
      listItem.style.backgroundColor = '#1e1e1e'
      listItem.style.color = '#fff'
      const name = document.createElement('span')
      name.textContent = ext.name
      name.classList.add('item-name')
      name.style.marginRight = '10px'
      listItem.appendChild(name)
      const type = document.createElement('span')
      type.textContent =
        ext.type === 'internal'
          ? '官方扩展'
          : `自定义扩展${ext.newContent !== null ? ' (已修改)' : ''}`
      if (ext.type === 'custom' && ext.url) {
        type.title = ext.url
      }
      type.style.fontSize = '12px'
      type.style.color = '#666'
      type.style.flexGrow = '1'
      listItem.appendChild(type)
      let editButton = null
      if (
        ext.type === 'custom' &&
        ext.url &&
        !globalState.vm.extensionManager.isExtensionLoaded(ext.name)
      ) {
        editButton = document.createElement('button')
        editButton.textContent = '✏️'
        editButton.title = '点击此处编辑此扩展。将会打开一个代码编辑器。'
        editButton.style.marginRight = '5px'
        editButton.style.backgroundColor = '#1e1e1e'
        editButton.addEventListener('click', () => {
          this.manager.open(new ExtensionEditScene(this.manager, ext))
        })
        listItem.appendChild(editButton)
      }
      const loadButton = document.createElement('button')
      loadButton.textContent = '⏬'
      loadButton.title = '立刻加载扩展'
      loadButton.style.backgroundColor = '#1e1e1e'
      if (globalState.vm.extensionManager.isExtensionLoaded(ext.name)) {
        loadButton.textContent = '✅'
        loadButton.title = '已加载'
        loadButton.disabled = true
      } else {
        loadButton.addEventListener('click', () => {
          loadButton.textContent = '✅'
          loadButton.title = '已加载'
          loadButton.disabled = true
          if (editButton) {
            listItem.removeChild(editButton)
            editButton = null
          }
          loadPromise = loadPromise.then(() => this.loadExtension(ext))
        })
      }
      listItem.appendChild(loadButton)
      list.appendChild(listItem)
    })
    scrollable.appendChild(list)
    target.appendChild(scrollable)
  }
  dispose() { }
}
