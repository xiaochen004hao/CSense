import PackageJSON from '../package.json' with { type: 'json' }

export default `// ==UserScript==
// @name         C-S-ense
// @namespace    C-S-ense
// @version      ${PackageJSON.version}
// @license      AGPL-3.0
// @description  一个川菜王 - 安全审计 - 工具
// @author       FurryR
// @match        https://www.ccw.site/*
// @icon         https://m.ccw.site/community/images/logo-ccw.png
// @grant        none
// @run-at       document-start
// ==/UserScript==`
