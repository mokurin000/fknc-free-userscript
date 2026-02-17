// ==UserScript==
// @name         Bypass paywall of fknc.top Minified
// @name:zh      绕过疯狂农场价格计算器付费墙 精简版
// @namespace    mokurin000
// @version      1.9
// @description     Infinite free trial for fknc.top
// @description:zh  fknc.top 无限免费试用
// @match        https://www.fknc.top/
// @run-at       document-start
// @grant        unsafeWindow
// @license MIT
// ==/UserScript==

// Need unsafeWindow to replace fetch
// For webview, unsafeWindow doesn't exists.
const w = 'undefined' === typeof GM_info ? window : unsafeWindow;

(function () {
    'use strict';

    if (w === undefined || w === null) {
        console.log("Unable to obtain unsafeWindow, early abort!");
        return;
    }

    const origFetch = w.fetch;

    w.fetch = async (...args) => {
        const [input, init] = args;

        const url =
            typeof input === "string" ?
                input :
                input instanceof Request ?
                    input.url :
                    String(input);

        const parsed = new URL(url, location.origin);

        let mockBody = null;
        let returnCode = 200;

        if (parsed.pathname === "/rest/v1/rpc/use_free_query") {
            // Unlock free query
            mockBody = JSON.stringify({
                allowed: true
            });
        } else if (parsed.pathname === "/rest/v1/rpc/log_user_query") {
            // Disable user query log
            mockBody = JSON.stringify({
                ok: true
            });
        } else if (parsed.pathname === "/rest/v1/crop_daily_stats" && init?.method === 'PATCH') {
            // Disable stats update query
            mockBody = "";
        }

        if (mockBody === null) {
            return origFetch.apply(this, args);
        } else {
            return new Response(mockBody, {
                status: returnCode,
                headers: {
                    "Content-Type": "application/json"
                }
            });
        }
    };
})();
