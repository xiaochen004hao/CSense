import globalState from '../base/state'
import { createScrollable } from 'src/util/window'
import { SpriteScene } from './sprite'

export class ProjectScene {
  static title = '项目'
  constructor(manager, JSZip, input) {
    this.manager = manager
    this.vm = globalState.vm
    /** @type {import('jszip')} */
    this.JSZip = JSZip
    /** @type {string | ArrayBuffer | object} */
    this.input = input
  }
  render() {
    const target = this.manager.target
    const searchContainer = document.createElement('div')
    searchContainer.style.display = 'flex'
    searchContainer.style.justifyContent = 'center'

    const searchInput = document.createElement('input')
    searchInput.type = 'text'
    searchInput.placeholder = '搜索角色...'
    searchInput.style.padding = '5px'
    searchInput.style.border = '1px solid #0e0e0e'
    searchInput.style.width = '100%'
    searchInput.style.boxSizing = 'border-box'
    searchInput.style.backgroundColor = '#333333'
    searchInput.style.color = '#ffffff'

    const downloadButton = document.createElement('button')
    downloadButton.textContent = '⬇️'
    downloadButton.title = '下载项目'
    downloadButton.style.padding = '10px'
    downloadButton.style.border = 'none'
    downloadButton.style.cursor = 'pointer'
    downloadButton.style.background = 'rgb(0, 123, 255)'
    downloadButton.style.color = 'white'
    downloadButton.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.2)' // Modern shadow
    downloadButton.addEventListener('click', async () => {
      downloadButton.disabled = true
      let zip = null
      let projectJson = null

      if (
        typeof this.input === 'string' ||
        (typeof this.input === 'object' &&
          !(this.input instanceof ArrayBuffer) &&
          !(this.input instanceof Uint8Array))
      ) {
        // project.json only, convert to .zip (.sb3)
        zip = new this.JSZip()
        zip.file('project.json', this.input)
        projectJson = JSON.parse(this.input)
      } else {
        zip = await this.JSZip.loadAsync(this.input)
        const projectFile = zip.file('project.json')
        projectJson = JSON.parse(await projectFile.async('string'))
      }
      // First fetch all gandi assets
      const filesToFetch = []
      if (projectJson.gandi?.assets) {
        projectJson.gandi.assets.forEach(asset => {
          filesToFetch.push([
            `${asset.md5ext}`,
            `https://m.ccw.site/user_projects_assets/${encodeURIComponent(asset.md5ext)}`
          ])
        })
      }
      // Then fetch all costume/sound assets
      for (const target of projectJson.targets) {
        target.sounds.forEach(sound => {
          filesToFetch.push([
            `${sound.md5ext}`,
            `https://m.ccw.site/user_projects_assets/${encodeURIComponent(sound.md5ext)}`
          ])
        })
        target.costumes.forEach(costume => {
          filesToFetch.push([
            `${costume.md5ext}`,
            `https://m.ccw.site/user_projects_assets/${encodeURIComponent(costume.md5ext)}`
          ])
        })
      }
      // Fetch all files in 32 threads
      const concurrency = 32
      let index = 0
      await Promise.all(
        new Array(concurrency).fill(0).map(async () => {
          while (index < filesToFetch.length) {
            const [md5ext, url] = filesToFetch[index++]
            if (zip.file(md5ext)) continue // Already fetched
            try {
              const res = await fetch(url)
              if (!res.ok)
                throw new Error(`Failed to fetch ${url}: ${res.statusText}`)
              const blob = await res.blob()
              zip.file(md5ext, blob)
            } catch (e) {
              console.error(e)
            }
          }
        })
      )
      const content = await zip.generateAsync({ type: 'arraybuffer' })
      const url = URL.createObjectURL(
        new Blob([content], { type: 'application/zip' })
      )
      const a = document.createElement('a')
      a.href = url
      a.download = 'project.sb3'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      downloadButton.disabled = false
    })

    searchInput.addEventListener('input', () => {
      const filter = searchInput.value.toLowerCase()
      const items = spriteList.children
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
        if (!spriteList.querySelector('.no-results')) {
          const noResultsItem = document.createElement('li')
          noResultsItem.textContent = '(无结果)'
          noResultsItem.className = 'no-results'
          noResultsItem.style.display = 'flex'
          noResultsItem.style.justifyContent = 'center'
          noResultsItem.style.alignItems = 'center'
          noResultsItem.style.width = '100%'
          noResultsItem.style.height = '100%'
          noResultsItem.style.color = '#999'
          spriteList.appendChild(noResultsItem)
        }
      } else {
        const noResultsItem = spriteList.querySelector('.no-results')
        if (noResultsItem) {
          spriteList.removeChild(noResultsItem)
        }
      }
    })

    searchContainer.appendChild(searchInput)
    searchContainer.appendChild(downloadButton)
    target.appendChild(searchContainer)
    const scrollable = createScrollable()
    const spriteList = document.createElement('ul')
    spriteList.style.marginTop = '10px'
    spriteList.style.padding = '0'
    spriteList.style.margin = '0'
    spriteList.style.listStyleType = 'none'
    const sprites = this.vm.runtime.targets
      .filter(target => target.isOriginal)
      .map(target => target.sprite)
    sprites.forEach(sprite => {
      const listItem = document.createElement('li')
      listItem.style.display = 'flex'
      listItem.style.flexDirection = 'column'
      listItem.style.alignItems = 'center'
      listItem.style.flex = '1 1 calc(25% - 10px)' // Flex layout for 4 items per row
      listItem.style.maxWidth = '25%' // Ensure 4 items per row
      listItem.style.margin = '5px'
      listItem.style.boxSizing = 'border-box'
      listItem.style.textAlign = 'center'
      listItem.style.padding = '10px'
      listItem.style.border = '1px solid #0e0e0e'
      listItem.style.borderRadius = '8px'
      listItem.style.backgroundColor = '#333333'
      listItem.style.color = 'white'
      listItem.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.1)'

      // Add hover effect
      listItem.addEventListener('mouseover', () => {
        listItem.style.transform = 'scale(1.05)'
        listItem.style.transition = 'transform 0.2s ease-in-out'
      })
      listItem.addEventListener('mouseout', () => {
        listItem.style.transform = 'scale(1)'
      })
      listItem.addEventListener('click', () => {
        this.manager.open(new SpriteScene(this.manager, sprite))
      })

      const spriteImage = document.createElement('img')
      spriteImage.src = sprite.costumes[0].asset.encodeDataURI()
      spriteImage.alt = sprite.name
      spriteImage.style.width = '100%'
      spriteImage.style.height = '100%'
      spriteImage.style.marginBottom = '5px'

      const spriteName = document.createElement('div')
      spriteName.title = spriteName.textContent = sprite.name
      spriteName.style.width = '80px'
      spriteName.className = 'item-name'
      spriteName.style.fontSize = '14px'
      spriteName.style.fontWeight = 'bold'
      spriteName.style.whiteSpace = 'nowrap' // Prevent text wrapping
      spriteName.style.overflow = 'hidden' // Hide overflow text
      spriteName.style.textOverflow = 'ellipsis' // Show ellipsis for overflow text

      listItem.appendChild(spriteImage)
      listItem.appendChild(spriteName)
      spriteList.appendChild(listItem)
    })

    spriteList.style.display = 'flex'
    spriteList.style.flexWrap = 'wrap'
    scrollable.appendChild(spriteList)
    target.appendChild(scrollable)
  }
  dispose() {}
}
