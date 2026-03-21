import { Monaco } from 'src/base/monaco'
import { getExtensionInfo } from 'src/sandbox/index.js'
import { CSENSE_WINDOW_BASE_ZINDEX } from 'src/util/constant.js'

export class ExtensionEditScene {
  static title = '编辑扩展'
  /**
   *
   * @param {import('../base/scene.js').SceneManager} manager
   * @param {{ name: string, url: string, type: 'custom', newContent: string | null }} extension
   */
  constructor(manager, extension) {
    this.manager = manager
    this.extension = extension
    Monaco.then(v => {
      this.Monaco = v
      this.manager.requestUpdate()
    })
    this.editor = null
  }
  async getExtensionInfo() {
    const extensionInfo = await getExtensionInfo(
      this.extension.newContent ?? ''
    )
    if (extensionInfo.result !== 'success') {
      return extensionInfo
    } else {
      const template = `// 代码并不直接可用，请根据扩展实际功能进行修改。\n\n;(function (Scratch, info) {
  'use strict'
  class Extension {
    getInfo() {
      return info
    }${(() => {
      const getDefaultDummy = blockType => {
        switch (blockType) {
          case 'reporter':
            return '\n      return 0\n    '
          case 'Boolean':
            return '\n      return false\n    '
          default:
            return ''
        }
      }
      try {
        const code = extensionInfo.info.blocks.map(
          v =>
            `[${JSON.stringify(v.opcode ?? v.func)}] () {${getDefaultDummy(v.blockType)}}`
        )
        return code.length ? '\n    ' + code.join('\n    ') : ''
      } catch {
        return ''
      }
    })()}
  }
  Scratch.extensions.register(new Extension())
})(Scratch, ${JSON.stringify(extensionInfo.info, null, 2)})`
      return template.trim()
    }
  }
  render() {
    const target = this.manager.target
    if (!this.Monaco) {
      const loading = document.createElement('strong')
      loading.style.color = '#999'
      loading.textContent = '加载中...'
      loading.style.display = 'block'
      loading.style.textAlign = 'center'
      target.appendChild(loading)
    } else {
      if (this.editor) this.editor.dispose()
      const editor = document.createElement('div')
      editor.style.width = '900px'
      editor.style.height = '900px'
      editor.style.marginBottom = '10px'
      target.appendChild(editor)
      this.editor = this.Monaco.editor.create(editor, {
        value: this.extension.newContent ?? '// 正在获取扩展内容...',
        automaticLayout: true,
        language: 'javascript',
        tabSize: 2,
        insertSpaces: true,
        theme: 'vs-dark',
        "semanticHighlighting.enabled": true,
      })
      this.editor.onDidChangeModelContent(() => {
        this.extension.newContent = this.editor.getValue()
      })
      if (this.extension.newContent === null) {
        fetch(this.extension.url)
          .then(r => r.text())
          .then(text => {
            this.extension.newContent = text
            this.editor.setValue(text)
          })
          .catch(() => {
            this.editor.setValue(this.extension.newContent)
            this.extension.newContent = null
          })
      }
      const toolbar = document.createElement('div')
      toolbar.style.display = 'flex'
      toolbar.style.width = '100%'
      toolbar.style.height = '50px'
      if (
        this.extension.url.startsWith(
          'https://m.ccw.site/user_projects_assets/'
        )
      ) {
        // 使用官方 API 解析 Gandi 扩展
        const loading = document.createElement('p')
        loading.style.color = '#999'
        loading.textContent = '正在解析扩展...'
        loading.style.display = 'block'
        loading.style.textAlign = 'center'
        toolbar.appendChild(loading)
        fetch(
          `https://bfs-web.ccw.site/extensions/${encodeURIComponent(this.extension.name)}`
        )
          .then(v => v.json())
          .then(data => {
            if (data.status !== 200) {
              loading.textContent = '解析扩展失败。'
              return
            }
            const body = data.body
            const version = body.versions.find(
              v => v.assetUri === this.extension.url
            )
            if (!version) {
              loading.textContent = '解析扩展失败。'
              return
            }
            const link = document.createElement('a')
            link.href = `https://assets.ccw.site/extensions/${body.eid}`
            link.target = '_blank'
            link.rel = 'noopener noreferrer'
            link.textContent = `${body.name} (${version.version})`
            link.style.textDecoration = 'none'
            link.style.color = '#999'
            link.style.marginRight = '10px'
            link.style.marginTop = '10px'
            link.style.marginLeft = '10px'
            loading.replaceWith(link)
            // Buttons
            const useNoopButton = document.createElement('button')
            useNoopButton.textContent = '生成空扩展'
            useNoopButton.title =
              '根据官方积木预览生成空扩展 (可能出现问题)。右键可以使用沙箱解析。'
            useNoopButton.style.marginBottom = '10px'
            useNoopButton.style.marginLeft = '10px'
            useNoopButton.style.padding = '10px 20px'
            useNoopButton.style.fontSize = '16px'
            useNoopButton.style.backgroundColor = '#333333'
            useNoopButton.style.color = 'white'
            useNoopButton.addEventListener('click', async () => {
              try {
                useNoopButton.disabled = true
                useNoopButton.textContent = '请稍等'
                const preview = version.previews[0]
                const svg = await fetch(preview).then(r => r.text())
                const parser = new DOMParser()
                const doc = parser.parseFromString(svg, 'image/svg+xml')
                const opcode = `/**\n${Array.from(
                  doc.querySelectorAll('g.blocklyDraggable')
                )
                  .map(v => {
                    const typeMap = {
                      'reporter boolean': 'Scratch.BlockType.BOOLEAN',
                      'reporter round': 'Scratch.BlockType.REPORTER',
                      'c-block': 'Scratch.BlockType.CONDITIONAL'
                    }
                    return {
                      opcode: v.getAttribute('data-id'),
                      type:
                        Object.entries(typeMap).find(([k]) =>
                          v.getAttribute('data-shapes').includes(k)
                        )?.[1] || '(未知)'
                    }
                  })
                  .map(v => {
                    return ` * @${v.opcode} 类型 ${v.type}`
                  })}\n */`
                const res = await this.getExtensionInfo()
                if (typeof res !== 'string') {
                  useNoopButton.textContent = '发生错误'
                  useNoopButton.style.color = '#999'
                  useNoopButton.title = res.error
                  return
                }
                let code = opcode + '\n\n' + res
                this.extension.newContent = code
                this.editor.setValue(this.extension.newContent)
                useNoopButton.textContent = '生成空扩展'
                useNoopButton.disabled = false
              } catch (e) {
                useNoopButton.textContent = '发生错误'
                useNoopButton.style.color = '#999'
                useNoopButton.title =
                  e instanceof Error ? (e.stack ?? e.message) : String(e)
              }
            })
            link.after(useNoopButton)
            const marketButton = document.createElement('button')
            marketButton.textContent = '使用优化版'
            marketButton.title =
              '使用社区维护的优化版扩展。所有扩展均经过 CSense 官方审核。'
            marketButton.style.marginBottom = '10px'
            marketButton.style.marginLeft = '10px'
            marketButton.style.padding = '10px 20px'
            marketButton.style.fontSize = '16px'
            marketButton.style.backgroundColor = '#333333'
            marketButton.style.color = 'white'
            marketButton.addEventListener('click', async () => {
              marketButton.disabled = true
              marketButton.textContent = '请稍等'
              const ext = await fetch(
                `https://csense-rev.github.io/csense-marketplace/${body.eid}/${version.version}.js`
              )
                .then(r => {
                  if (!r.ok) return null
                  return r.text()
                })
                .catch(() => null)
              if (!ext) {
                marketButton.textContent = '获取失败'
                marketButton.style.color = '#999'
                marketButton.title =
                  '社区市场暂无此扩展。请访问 https://github.com/csense-rev/csense-marketplace 请求此扩展。'
                return
              }
              this.extension.newContent = ext
              this.editor.setValue(this.extension.newContent)
              marketButton.textContent = '使用优化版'
              marketButton.disabled = false
            })
            useNoopButton.after(marketButton)
            const space = document.createElement('div')
            space.style.flexGrow = '1'
            marketButton.after(space)
            const inspectButton = document.createElement('button')
            inspectButton.textContent = '🔎'
            inspectButton.style.marginBottom = '10px'
            inspectButton.style.marginRight = '10px'
            inspectButton.style.padding = '5px'
            inspectButton.style.backgroundColor = '#333333'
            inspectButton.title = '查看官方提供的积木预览。'
            let floatDiv = null
            let hideTimeout = null

            const showPreview = ev => {
              const svgUrl = version.previews[0]
              if (!svgUrl) return

              if (hideTimeout) {
                clearTimeout(hideTimeout)
                hideTimeout = null
              }

              if (!floatDiv) {
                floatDiv = document.createElement('div')
                floatDiv.style.position = 'fixed'
                const mouseX = ev.clientX
                const mouseY = ev.clientY
                const windowWidth = window.innerWidth
                const windowHeight = window.innerHeight

                // Estimate popup dimensions
                const popupWidth = 700 // estimated width
                const popupHeight = 300 // estimated height

                // Check available space
                const rightSpace = windowWidth - mouseX
                const leftSpace = mouseX

                if (rightSpace >= popupWidth) {
                  // Sufficient space on right, position with mouse as left-bottom corner
                  floatDiv.style.left = mouseX + 'px'
                  floatDiv.style.bottom = windowHeight - mouseY + 'px'
                } else if (leftSpace >= popupWidth) {
                  // Insufficient space on right but sufficient on left, position with mouse as right-bottom corner
                  floatDiv.style.right = windowWidth - mouseX + 'px'
                  floatDiv.style.bottom = windowHeight - mouseY + 'px'
                } else {
                  // Neither side has sufficient space, default to left positioning (mouse as right-bottom corner)
                  floatDiv.style.right = windowWidth - mouseX + 'px'
                  floatDiv.style.bottom = windowHeight - mouseY + 'px'
                }
                floatDiv.style.backgroundColor = '#fff'
                floatDiv.style.border = '1px solid #ccc'
                floatDiv.style.borderRadius = '8px'
                floatDiv.style.padding = '10px'
                floatDiv.style.boxShadow = '0 2px 10px rgba(0,0,0,0.1)'
                floatDiv.style.zIndex = String(CSENSE_WINDOW_BASE_ZINDEX + 1)
                floatDiv.style.maxWidth = '700px'
                floatDiv.style.maxHeight = '300px'
                floatDiv.style.overflowX = 'auto'

                const img = document.createElement('img')
                img.src = svgUrl
                img.style.display = 'block'
                img.style.margin = '10px'
                img.style.maxWidth = '100%'
                img.style.height = 'auto'

                floatDiv.appendChild(img)
                document.body.appendChild(floatDiv)

                floatDiv.addEventListener('mouseenter', () => {
                  if (hideTimeout) {
                    clearTimeout(hideTimeout)
                    hideTimeout = null
                  }
                })

                floatDiv.addEventListener('mouseleave', () => {
                  hideTimeout = setTimeout(() => {
                    if (floatDiv) {
                      floatDiv.remove()
                      floatDiv = null
                    }
                  }, 100)
                })
              }
            }

            const hidePreview = () => {
              hideTimeout = setTimeout(() => {
                if (floatDiv) {
                  floatDiv.remove()
                  floatDiv = null
                }
              }, 100)
            }

            inspectButton.addEventListener('mouseenter', showPreview)
            inspectButton.addEventListener('mouseleave', hidePreview)
            space.after(inspectButton)
          })
          .catch(v => {
            loading.textContent = '解析扩展失败。'
          })
      } else {
        const useNoopButton = document.createElement('button')
        useNoopButton.textContent = '生成空扩展'
        useNoopButton.title = '尝试使用沙箱生成空扩展。'
        useNoopButton.style.marginBottom = '10px'
        useNoopButton.style.marginLeft = '10px'
        useNoopButton.style.padding = '10px 20px'
        useNoopButton.style.fontSize = '16px'
        useNoopButton.addEventListener('click', async ev => {
          useNoopButton.disabled = true
          useNoopButton.textContent = '请稍等'
          const res = await this.getExtensionInfo()
          if (typeof res !== 'string') {
            useNoopButton.textContent = '发生错误'
            useNoopButton.style.color = '#999'
            useNoopButton.title = res.error
          }
          this.extension.newContent = res
          this.editor.setValue(this.extension.newContent)
          useNoopButton.textContent = '生成空扩展'
          useNoopButton.disabled = false
        })
        toolbar.appendChild(useNoopButton)
      }
      target.appendChild(toolbar)
    }
  }
  dispose() {
    this.editor?.dispose()
  }
}
