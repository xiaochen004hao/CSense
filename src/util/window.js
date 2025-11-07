export const windowOpen = window.open

import LOGO_IMG from 'src/asset/logo.svg'
import { CSENSE_WINDOW_BASE_ZINDEX } from './constant'

/**
 * 创建浮动窗口
 * @param {HTMLElement} element
 * @param {()=>boolean} onClose
 */
export function createWindow(element, onClose) {
  const reopenButton = document.createElement('button')
  reopenButton.style.position = 'fixed'
  reopenButton.style.left = '40px'
  reopenButton.style.top = '100px'
  reopenButton.style.zIndex = String(CSENSE_WINDOW_BASE_ZINDEX)
  reopenButton.style.padding = '10px'
  reopenButton.style.color = 'white'
  reopenButton.style.border = 'none'
  reopenButton.style.cursor = 'pointer'
  reopenButton.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.2)' // Modern shadow
  reopenButton.style.width = '50px'
  reopenButton.style.height = '50px'
  reopenButton.style.borderRadius = '50%'
  reopenButton.style.background = 'linear-gradient(45deg, #005EAC, #404040)'
  reopenButton.title = '川菜王？脆弱性？的根本证明？'

  const image = document.createElement('img')
  image.src = LOGO_IMG
  image.alt = 'C-S-ense'
  reopenButton.appendChild(image)

  let isDraggingButton = false
  let hasPositionChanged = false
  let buttonOffsetX, buttonOffsetY

  reopenButton.addEventListener('mousedown', e => {
    isDraggingButton = true
    hasPositionChanged = false
    buttonOffsetX = e.clientX - reopenButton.getBoundingClientRect().left
    buttonOffsetY = e.clientY - reopenButton.getBoundingClientRect().top
    e.preventDefault()
  })

  document.addEventListener('mousemove', e => {
    if (isDraggingButton) {
      delete reopenButton.style.bottom
      delete reopenButton.style.right
      reopenButton.style.left = e.clientX - buttonOffsetX + 'px'
      reopenButton.style.top = e.clientY - buttonOffsetY + 'px'
      hasPositionChanged = true
      e.preventDefault()
    }
  })

  document.addEventListener('mouseup', e => {
    if (isDraggingButton) {
      if (hasPositionChanged) {
        isDraggingButton = false
      } else {
        reopenButton.style.display = 'none'
        floatingDiv.style.display = 'block'
        floatingDiv.style.top = reopenButton.style.top
        floatingDiv.style.left = reopenButton.style.left
        floatingDiv.animate([{ opacity: '0' }, { opacity: '1' }], {
          duration: 300,
          easing: 'ease-in-out'
        })
      }
      e.preventDefault()
    }
  })

  document.documentElement.appendChild(reopenButton)
  /**
   * 关闭浮动窗口并创建重新打开按钮
   */
  function closeFloatingDiv() {
    floatingDiv.style.display = 'none'
    reopenButton.style.display = 'block'
  }

  const floatingDiv = document.createElement('div')
  floatingDiv.className = 'c-s-ense_window'
  floatingDiv.style.position = 'fixed'
  floatingDiv.style.minWidth = '240px'
  floatingDiv.style.minHeight = '120px'
  floatingDiv.style.width = 'auto'
  floatingDiv.style.height = 'auto'
  floatingDiv.style.backgroundColor = '#ffffff' // Modern light background color
  floatingDiv.style.color = '#000000' // Modern dark text color
  floatingDiv.style.border = '1px solid #dddddd' // Modern light border color
  floatingDiv.style.borderRadius = '8px' // Modern rounded corners
  floatingDiv.style.zIndex = '9999'
  floatingDiv.style.top = '20px'
  floatingDiv.style.left = '20px'
  floatingDiv.style.overflow = 'hidden' // Hide overflow content

  floatingDiv.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.1)' // Modern subtle shadow
  let isDragging = false
  let offsetX, offsetY
  // 创建浮动 div
  const header = document.createElement('div')
  header.style.display = 'flex'
  header.style.justifyContent = 'space-between'
  header.style.alignItems = 'center'
  header.style.padding = '10px'
  header.style.background = 'linear-gradient(45deg, #005EAC, #404040)' // Modern primary color
  header.style.color = 'white'
  header.style.cursor = 'move'
  header.style.borderTopLeftRadius = '8px'
  header.style.borderTopRightRadius = '8px'

  // 实现拖动功能
  header.addEventListener('mousedown', e => {
    isDragging = true
    offsetX = e.clientX - floatingDiv.getBoundingClientRect().left
    offsetY = e.clientY - floatingDiv.getBoundingClientRect().top
    e.preventDefault()
  })

  document.addEventListener('mousemove', e => {
    if (isDragging) {
      floatingDiv.style.left = e.clientX - offsetX + 'px'
      floatingDiv.style.top = e.clientY - offsetY + 'px'
      e.preventDefault()
    }
  })

  document.addEventListener('mouseup', e => {
    if (isDragging) {
      isDragging = false
      e.preventDefault()
    }
  })

  const logo = document.createElement('img')
  logo.src = LOGO_IMG
  logo.alt = 'C-S-ense'
  logo.style.cursor = 'pointer'
  logo.style.height = '24px'
  logo.style.marginRight = '10px' // Add margin to the right of the logo

  let isRotating = false
  let rotation = 0

  function rotate() {
    if (isRotating) {
      rotation += 15
      logo.style.transform = `rotate(${rotation}deg)`
      requestAnimationFrame(rotate)
    }
  }
  logo.addEventListener('mouseover', () => {
    if (!isRotating) {
      logo.style.transition = 'transform 0.3s linear'
      isRotating = true
      rotate()
    }
  })
  logo.addEventListener('mouseout', () => {
    isRotating = false
    rotation = 0
    logo.style.transition = 'transform 0.3s cubic-bezier(0.25, 0.1, 0.25, 1)'
    logo.style.transform = `rotate(0deg)`
  })
  header.appendChild(logo)

  const title = document.createElement('strong')
  title.textContent = 'C-S-ense'
  title.style.flexGrow = '1' // Ensure the title takes up available space
  title.style.textAlign = 'left'
  title.style.fontFamily = 'monospace' // Geeky font style
  title.style.fontSize = '1em' // Standard font size
  title.style.fontWeight = 'normal' // Softer font weight
  header.appendChild(title)

  const closeButton = document.createElement('button')
  closeButton.style.background = 'none'
  closeButton.style.border = 'none'
  closeButton.style.color = 'white'
  closeButton.style.cursor = 'pointer'
  closeButton.textContent = '✖'
  closeButton.addEventListener('click', () => {
    if (onClose()) closeFloatingDiv()
  })
  header.appendChild(closeButton)

  floatingDiv.appendChild(header)
  floatingDiv.appendChild(element)

  closeFloatingDiv() // 默认折叠

  document.documentElement.appendChild(floatingDiv)

  return {
    button: reopenButton,
    window: floatingDiv,
    setTitle: v => {
      title.textContent = v
    }
  }
}

export function createScrollable() {
  const scrollable = document.createElement('div')
  scrollable.style.maxHeight = '300px'
  scrollable.style.maxWidth = '500px'
  scrollable.style.overflowY = 'auto'
  scrollable.style.padding = '0'
  scrollable.style.margin = '0'
  return scrollable
}
