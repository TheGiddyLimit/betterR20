// ==UserScript==
// @name         betteR20-core
// @namespace    https://5e.tools/
// @license      MIT (https://opensource.org/licenses/MIT)
// @version      1.28.2
// @updateURL    https://github.com/TheGiddyLimit/betterR20/raw/development/dist/betteR20-core.meta.js
// @downloadURL  https://github.com/TheGiddyLimit/betterR20/raw/development/dist/betteR20-core.user.js
// @description  Enhance your Roll20 experience
// @author       TheGiddyLimit

// @match        https://app.roll20.net/editor
// @match        https://app.roll20.net/editor#*
// @match        https://app.roll20.net/editor?*
// @match        https://app.roll20.net/editor/
// @match        https://app.roll20.net/editor/#*
// @match        https://app.roll20.net/editor/?*

// @grant        unsafeWindow
// @run-at       document-start

// @grant        GM_webRequest
// @webRequest   [{"selector": { "include": "*://www.google-analytics.com/analytics.js" },  "action": "cancel"}]
// @webRequest   [{"selector": { "include": "*://cdn.userleap.com/shim.js?*" },  "action": "cancel"}]

// ==/UserScript==
