let bobaBlissInfoUrl = 'https://boba-bliss.square.site/app/store/api/v5/editor/users/124479180/sites/257415286465879188/info',
    bobaBlissStoreUrl = 'https://boba-bliss.square.site/',
    interval = 60 * 1000,
    notificationSound = new Audio('notification.ogg'),
    notified = false;

window.browser = (function () {
    return window.msBrowser || window.browser || window.chrome;
})();

function notifyUser(acceptingOrders) {
    if (acceptingOrders) {
        // let's only notify the user once if the status changes
        if (!notified) {
            browser.notifications.create('BOBA-' + new Date().getTime(), {
                type: 'basic',
                iconUrl: 'green-logo-128.png',
                title: 'Boba Bliss Store Notifier',
                message: 'Boba Bliss is now accepting orders'
            });
            notificationSound.play();
            browser.browserAction.setIcon({path: 'green-logo-128.png'});
            notified = true;
        }
    } else {
        // let's only update the logo if the status changed from
        // accepting orders to not
        if (notified) {
            browser.browserAction.setIcon({path: 'red-logo-128.png'});
            notified = false;
        }
    }
}

function checkBobaBlissInline() {
    /**
     * Did Square change the behavior of their ecommerce site for accepting
     * orders status?
     *
     * It looks like they are no longer making a call to the /sites/xxx/info
     * endpoint and instead are embedding the state of the store inline on
     * bootstrap of the page (window.__BOOTSTRAP_STATE__.storeInfo.accepting_orders).
     * This endpoint appears to correctly return the state that the admin has
     * set, but there appears to be a delay from toggling this state to what is
     * published in the __BOOTSTRAP_STATE__ which is what the site appears to
     * be using now.
     *
     * We're going to do some gross things to basically fetch the store home
     * page, find the right <SCRIPT> tag, and parse out the value of the
     * accepting_order variable.
     */

    var xhr1 = new XMLHttpRequest();
    xhr1.open('GET', bobaBlissStoreUrl, true);
    xhr1.send();
    xhr1.onreadystatechange = function(data) {
        if (xhr1.readyState == 4) {
            let DOM = new DOMParser();
            let responseDOM = DOM.parseFromString(data.currentTarget.response, 'text/html');
            // iterate through all of the script tags on the page to find the
            // one that we want to parse
            let acceptingOrders = false;
            let pattern =  /__BOOTSTRAP_STATE__.*"(accepting_orders)":([^,]+)/;
            for (let i = 0; i < responseDOM.scripts.length; i++) {
                let matches = responseDOM.scripts[i].innerHTML.match(pattern);
                if (matches) {
                    if (matches[2] == 'true') {
                        acceptingOrders = true;
                        notifyUser(acceptingOrders);
                        console.log('accepting orders at this time: ' + new Date().getTime());
                    } else {
                        notifyUser(false);
                        console.log('not accepting orders at this time: ' + new Date().getTime());
                    }
                }
            }
        }
    }
}

/**
 * @deprecated checkBobaBlissInfo()
 * It looks like the site doesn't call the /info endpoint to get the status
 */
function checkBobaBlissInfo() {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', bobaBlissInfoUrl + '?time=' + new Date().getTime(), true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.send();
    xhr.onreadystatechange = function(data) {
        if (xhr.readyState == 4) {
            let response = JSON.parse(data.currentTarget.response);
            let acceptingOrders = response.data.accepting_orders;
            notifyUser(acceptingOrders);
        }
    }
}

checkBobaBlissInline();
let timer = setInterval(checkBobaBlissInline, interval);

browser.browserAction.onClicked.addListener(function(tab) {
    let bobaBlissStoreUrl = 'https://boba-bliss.square.site/';
    browser.tabs.create({url: bobaBlissStoreUrl});
});