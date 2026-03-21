import { patch, addStyle } from './util/inject'
import { SceneManager } from './base/scene'
import { IdentityWarningOverlay } from './overlay/identity'
import { HomeScene } from './scene/home'
import { createWindow } from './util/window'
import globalState from './base/state'
import { version as VERSION } from '../package.json'
import { LazyXHR } from './util/inject'
import { getCookie, setCookie } from './util/cookie'
import { verify } from './util/encryption'
  ; (() => {
    if (!console.log.toString().includes('[native code]')) {
      // location.replace(location.href);
      console.warn(
        'C-S-ense 加载得 太慢了。\n\n这可能会导致一些功能异常，并且我们不会修复这些异常。\n如果您在使用 Tampermonkey: 请换用 Violentmonkey。\n如果您在使用 Violentmonkey：请在设置中勾选同步 page 模式。这可能会导致一些脚本异常，请自行取舍。'
      )
      console.log(console.log);
    }
    // try getting axios
    const _apply = Function.prototype.apply
    Function.prototype.apply = function (thisArg, args) {
      if (
        typeof thisArg === 'object' &&
        thisArg &&
        thisArg.defaults &&
        thisArg.interceptors &&
        thisArg.interceptors.request.handlers.length > 0
      ) {
        if (globalState.axios instanceof LazyXHR) {
          globalState.axios.delegate(thisArg)
          globalState.axios = thisArg
          window.axios = thisArg
        }
        this.apply = _apply
      }
      return _apply.call(this, thisArg, args)
    }

    const userId = getCookie('cookie-user-id')
    if (!userId) {
      return
    }
    const token = " ";  // getCookie('csense-token')
    // if (!token) {
    //   const newToken = prompt(
    //     '请输入您的 C-S-ense 使用密钥。\n如果您没有密钥，请向 CSense 开发者申请。\n\n在输入密钥前，C-S-ense 将不会运行。'
    //   )
    //   if (!newToken) {
    //     return
    //   }
    //   setCookie('csense-token', newToken)
    //   location.reload()
    //   return
    // }
    // if (!verify(String(userId), token)) {
    //   alert(
    //     '此 C-S-ense 授权不属于您当前登录的账户。请输入匹配当前账户的授权密钥。'
    //   )
    //   setCookie('csense-token', '')
    //   location.reload()
    //   return
    // }
    const content = document.createElement('div')
    content.style.fontFamily = 'unset'
    const manager = new SceneManager(content)
    manager.addOverlay(new IdentityWarningOverlay(manager))
    manager.open(new HomeScene(manager))
    const win = createWindow(content, () => {
      return !manager.back()
    })
    manager._doSetTitle = win.setTitle
    globalState.button = win.button
    manager._updateTitle()
    // globalThis.manager = manager
    // Anti-detection designed for "some" tricky projects
    // NOTE: 以下为最基本的防护，无法避免通过 documentElement 等方式获取到 CSense 的存在，此时可以考虑安装插件。
    function isDescendant(parent, child) {
      let node = child;
      while (node) {
        if (node === parent) return true;
        node = node.parentNode;
      }
      return false;
    }

    patch(Document.prototype, 'querySelectorAll', querySelectorAll => {
      return function (selectors) {
        const elements = Array.from(querySelectorAll.call(this, selectors));
        const filtered = elements.filter(
          el => !(el === win.button || el === win.window || isDescendant(win.window, el) || isDescendant(win.button, el))
        );

        // 创建严格模拟的 NodeList
        const nodeList = Object.create(NodeList.prototype);
        const length = filtered.length;

        // 定义 length 属性（不可写、不可配置、可枚举）
        Object.defineProperty(nodeList, 'length', {
          value: length,
          writable: false,
          configurable: false,
          enumerable: true,
        });

        // 定义每个索引的属性（不可写、不可配置、可枚举）
        for (let i = 0; i < length; i++) {
          Object.defineProperty(nodeList, i, {
            value: filtered[i],
            writable: false,
            configurable: false,
            enumerable: true,
          });
        }

        return nodeList;
      }
    })

    patch(Document.prototype, 'querySelector', querySelector => {
      return function (selectors) {
        const res = querySelector.call(this, selectors)
        if (res === win.button || res === win.window || isDescendant(win.window, res) || isDescendant(win.button, res)) {
          return null
        }
        return res
      }
    })

    const org_appendChild = document.head.appendChild
    document.head.appendChild = function (element) {
      if (element.tagName === 'IFRAME') {
        org_appendChild.call(this, element);
        patch(element.contentWindow.Document.prototype, 'querySelectorAll', querySelectorAll => {
          return function (selectors) {
            const elements = Array.from(querySelectorAll.call(this, selectors));
            const filtered = elements.filter(
              el => !(el === win.button || el === win.window || isDescendant(win.window, el) || isDescendant(win.button, el))
            );

            // 创建严格模拟的 NodeList
            const nodeList = Object.create(NodeList.prototype);
            const length = filtered.length;

            // 定义 length 属性（不可写、不可配置、可枚举）
            Object.defineProperty(nodeList, 'length', {
              value: length,
              writable: false,
              configurable: false,
              enumerable: true,
            });

            // 定义每个索引的属性（不可写、不可配置、可枚举）
            for (let i = 0; i < length; i++) {
              Object.defineProperty(nodeList, i, {
                value: filtered[i],
                writable: false,
                configurable: false,
                enumerable: true,
              });
            }

            return nodeList;
          }
        })

        patch(element.contentWindow.Document.prototype, 'querySelector', querySelector => {
          return function (selectors) {
            const res = querySelector.call(this, selectors)
            if (res === win.button || res === win.window || isDescendant(win.window, res) || isDescendant(win.button, res)) {
              return null
            }
            return res
          }
        })
        return element
      }
      return org_appendChild.call(this, element)
    }
  })()
