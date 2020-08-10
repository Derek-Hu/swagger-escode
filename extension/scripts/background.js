const localhosts = [];

const swaggerDatas = {};

const subPath = '/__swagger__escode__codegen__/save';

const doAction = function () {
    localhosts.forEach(function (host) {
        Object.keys(swaggerDatas).forEach(function (key) {
            fetch(host + subPath, {
                method: 'POST', // or 'PUT'
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(swaggerDatas[key]),
            }).then(data => {
                console.log('Success:', data);
                delete swaggerDatas[key];
            }).catch((error) => {
                console.error('Error:', error);
            });
        });

    })
}

chrome.webRequest.onCompleted.addListener(
    function (details) {
        const url = details.url;
        const ip = details.ip;
        const isLocalhost = /\/localhost/.test(url) || (ip === '127.0.0.1');
        if (isLocalhost) {
            const host = url.match(/^https?:\/\/([^/])*/);
            if (host && host[0] && localhosts.indexOf(host[0]) === -1) {
                localhosts.push(host[0]);
                doAction();
            }
        }
        return {};
    },
    { urls: ["<all_urls>"] },
    ["responseHeaders"]
);

chrome.extension.onRequest.addListener(
    function (data, sender, sendResponse) {
        if (sender.tab) {
            console.log('localhosts', localhosts);
            console.log('request', data);
            if (data && data.swaggerUrl) {
                swaggerDatas[data.swaggerUrl] = data;
                doAction();
            }
            sendResponse({ farewell: "goodbye" });
        }
    }
);
