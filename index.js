// ==UserScript==
// @name         Bypass paywall of fknc.top
// @name:zh      绕过疯狂农场价格计算器付费墙
// @namespace    mokurin000
// @version      1.8
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

const emailAddr = "guest@fknc.top";
const userId = "000d9a00-254f-41d3-a181-19d2afd2a1b9";
const identityId = "7aaf0e36-94d8-4453-becf-b8868f85af34";

const storageKey = "sb-nwacdthvbfukhxqyvuxh-auth-token";

let nickName = localStorage.getItem("nick-name") ?? "疯狂的农民";
let avatarIndex = parseInt(localStorage.getItem("avatar-index") ?? "18");

const userMetadata = () => {
    return {
        id: userId,
        aud: "authenticated",
        role: "authenticated",
        email: emailAddr,
        email_confirmed_at: "2222-02-22T22:22:22.222222Z",
        phone: "",
        confirmed_at: "2222-02-22T22:22:22.222222Z",
        last_sign_in_at: "2222-02-22T22:22:22.222222Z",
        app_metadata: {
            provider: "email",
            providers: [
                "email"
            ]
        },
        user_metadata: {
            avatar_index: avatarIndex,
            display_name: nickName,
            email: emailAddr,
            email_verified: true,
            phone_verified: false,
            sub: userId
        },
        identities: [{
            identity_id: identityId,
            id: userId,
            user_id: userId,
            identity_data: {
                email: emailAddr,
                email_verified: true,
                phone_verified: false,
                sub: userId
            },
            provider: "email",
            last_sign_in_at: "2222-02-22T22:22:22.222222Z",
            created_at: "2222-02-22T22:22:22.222222Z",
            updated_at: "2222-02-22T22:22:22.222222Z",
            email: emailAddr
        }],
        created_at: "2222-02-22T22:22:22.222222Z",
        updated_at: "2222-02-22T22:22:22.222222Z",
        is_anonymous: false
    };
}

const localRecord = () => {
    return {
        access_token: "",
        token_type: "bearer",
        expires_in: 3600,
        expires_at: 9999999999,
        refresh_token: "4UeF5YEaTznX",
        user: userMetadata(),
        weak_password: null
    }
};

(function () {
    'use strict';

    if (w === undefined || w === null) {
        console.log("Unable to obtain unsafeWindow, early abort!");
        return;
    }

    // Disable realtime stats update
    w.WebSocket = undefined;


    // Hide the invite code popup
    localStorage.setItem("invite_modal_first_shown", "1");
    // Bypass login
    localStorage.setItem(storageKey, JSON.stringify(localRecord()));

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
        } else if (parsed.pathname === "/rest/v1/rpc/get_my_subscription") {
            // Spoof premium expiry time
            mockBody = JSON.stringify({
                subscription_end_at: 7955157722000,
                is_active: true
            });
        } else if (parsed.pathname === "/rest/v1/crop_daily_stats") {
            // Mock daily click stats
            mockBody = JSON.stringify([]);
        } else if (parsed.pathname === "/rest/v1/rpc/log_user_query") {
            // Disable user query log
            mockBody = JSON.stringify({
                ok: true
            });
        } else if (parsed.pathname === "/rest/v1/rpc/set_display_name") {
            // Support custom nickname
            const newNickName = JSON.parse(init.body)?.p_display_name;

            if (newNickName !== null && newNickName != nickName) {
                nickName = newNickName;
                localStorage.setItem("nick-name", newNickName);
                localStorage.setItem(storageKey, JSON.stringify(localRecord()));
            }

            mockBody = JSON.stringify({
                ok: true
            });
        } else if (parsed.pathname === "/auth/v1/user") {
            // Support custom avatar
            const newAvatarIndex = JSON.parse(init.body)?.data?.avatar_index;
            if (newAvatarIndex !== null && newAvatarIndex != avatarIndex) {
                avatarIndex = newAvatarIndex;
                localStorage.setItem("avatar-index", newAvatarIndex);
                localStorage.setItem(storageKey, JSON.stringify(localRecord()));
            }
            localStorage.setItem(storageKey, JSON.stringify(localRecord()));

            mockBody = JSON.stringify(userMetadata());
        } else if ([
            "/rest/v1/user_feedback",
            "/rest/v1/price_feedback",
            "/rest/v1/rpc/get_user_query_leaderboard",
            "/rest/v1/rpc/get_membership_leaderboard",
            "/rest/v1/rpc/get_or_create_invite_code",
            "/rest/v1/rpc/get_my_invite_stats",
        ].includes(parsed.pathname)) {
            returnCode = 401;
            mockBody = JSON.stringify({
                code: "PGRST301",
                details: null,
                hint: null,
                message: "暂未支持该操作！"
            });
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

// apply custom stylesheet
window.addEventListener("DOMContentLoaded", () => {
    const styleSheet = document.createElement('style');
    styleSheet.textContent = `
    /* Hide logout button */
    div.user-center-section-danger
    /* Hide premium subscription */
    , div.user-center-section:nth-child(2) > div.user-center-membership > button
    /* Hide user feedback */
    , button.contact-option-button:nth-child(3)
    /* Hide invite, top list */
    , div.user-center-section:nth-child(3) > div.user-center-item-list > button.user-center-item:nth-child(2)
    , div.user-center-section:nth-child(3) > div.user-center-item-list > button.user-center-item:nth-child(3)
    /* Hide feedback button */
    , div.calculator-result-fixed > div.gradient-button
    /* Hide footer links */
    , div.footer-beian
    {
        display: none !important;
    }

    `;
    document.documentElement.appendChild(styleSheet);
});
