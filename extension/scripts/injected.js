function interceptData() {
    var xhrOverrideScript = document.createElement('script');
    xhrOverrideScript.type = 'text/javascript';
    xhrOverrideScript.innerHTML = `
    (function() {

      function addData(key, data){
        var domElement = document.createElement('div');
        domElement.id = key;
        domElement.innerText = data;
        domElement.style.height = 0;
        domElement.style.overflow = 'hidden';
        document.body.appendChild(domElement)
      }

      var XHR = XMLHttpRequest.prototype;
      var send = XHR.send;
      var open = XHR.open;
      XHR.open = function(method, url) {
          this.url = url; // the request url
          return open.apply(this, arguments);
      }
      XHR.send = function() {
          this.addEventListener('load', function() {
              if (this.url.indexOf('/api-docs')!==-1) {
                  console.log('api-docs...');
                  addData('__interceptedMeta', JSON.stringify({ documentUrl: window.location.href, swaggerUrl: this.url}));
                  addData('__interceptedData', this.response);
              }               
          });
          return send.apply(this, arguments);
      };
    })();
    `
    document.head.prepend(xhrOverrideScript);
}
function checkForDOM() {
    if (document.body && document.head) {
        interceptData();
    } else {
        requestIdleCallback(checkForDOM);
    }
}
requestIdleCallback(checkForDOM);

function scrapeData() {
    const interceptedMetaEle = document.getElementById('__interceptedMeta');
    const responseContainingEle = document.getElementById('__interceptedData');
    if (interceptedMetaEle && responseContainingEle) {
        let data;
        try {
            data = JSON.parse(interceptedMetaEle.innerHTML)
            data.swagger = JSON.parse(responseContainingEle.innerHTML);
            interceptedMetaEle.remove();
            responseContainingEle.remove();
        } catch (e) {

        }
        chrome.extension.sendRequest(data, function (response) {
        });
    } else {
        requestIdleCallback(scrapeData);
    }
}
requestIdleCallback(scrapeData);
