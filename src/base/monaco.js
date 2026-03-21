import { addStyle } from 'src/util/inject'

// addStyle(
//   new URL(
//     'https://cdn.jsdelivr.net/npm/monaco-editor@0.50.0/min/vs/editor/editor.main.css'
//   )
// )
window.MonacoEnvironment = {
  globalAPI: window.MonacoEnvironment?.globalAPI ?? false,
  getWorkerUrl: function (fileName, fileLabel) {
    if (fileName === 'workerMain.js') {
      // fix SecurityError exception
      return `data:text/javascript;base64,${btoa(
        `(function(fetch){globalThis.fetch=function(url,...args){return fetch.call(this,'https://cdn.jsdelivr.net/npm/monaco-editor@0.50.0/min/vs/base/worker/'+url,...args);};})(globalThis.fetch);importScripts('https://cdn.jsdelivr.net/npm/monaco-editor@0.50.0/min/vs/base/worker/workerMain.js');`
      )}`
    } else {
      return window.MonacoEnvironment?.getWorkerUrl?.(fileName, fileLabel) ?? ''
    }
  }
}
export const Monaco = import(
  'https://cdn.jsdelivr.net/npm/monaco-editor@0.50.0/+esm'
)
