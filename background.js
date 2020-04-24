let bobaBlissInfoUrl = 'https://boba-bliss.square.site/app/store/api/v5/editor/users/124479180/sites/257415286465879188/info',
    interval = 60 * 1000,
    notificationSound = new Audio('notification.ogg'),
    notified = false;

window.browser = (function () {
    return window.msBrowser || window.browser || window.chrome;
})();

function checkBobaBliss() {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', bobaBlissInfoUrl + '?time=' + new Date().getTime(), true);
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.send();
    xhr.onreadystatechange = function(data) {
        if(xhr.readyState == 4) {
            let response = JSON.parse(data.currentTarget.response);
            let acceptingOrders = response.data.accepting_orders;
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
    }
}
checkBobaBliss();
let timer = setInterval(checkBobaBliss, interval);

browser.browserAction.onClicked.addListener(function(tab) {
    let bobaBlissStoreUrl = 'https://boba-bliss.square.site/';
    browser.tabs.create({url: bobaBlissStoreUrl});
});