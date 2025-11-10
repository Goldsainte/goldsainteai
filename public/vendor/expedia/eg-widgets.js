(function initialize(window, document) {
  'use strict';

  window.eg = window.eg || {};
  window.eg.widgets = window.eg.widgets || {};
  window.eg.widgets.elements = window.eg.widgets.elements || {};

  function toArray(value /* any */) {
    return Array.prototype.slice.call(value);
  }

  function isEmpty(value /* any */) {
    return [undefined, null, 'undefined', 'null', ''].indexOf(value) > -1;
  }

  function getClassName(/* Arguments<string> */) {
    return toArray(arguments).join(' ');
  }

  function getCleanInput(value /* any */) {
    return typeof value === 'string' ? value.replace(/^\s*(\S*)\s*$/, '$1') : value;
  }

  function getUrlSearch(urlSearchParams /* [[string, any]] */) {
    const urlSearch = urlSearchParams
      .map(function urlSearchParamMapper(urlSearchParam /* [string, any] */) {
        const key = urlSearchParam[0];
        const value = urlSearchParam[1];

        return !isEmpty(value) ? key + '=' + encodeURIComponent(value) : undefined;
      })
      .filter(Boolean)
      .join('&');

    return urlSearch ? '?' + urlSearch : '';
  }

  function getGeneratedInstanceId() {
    const base = 36;

    const timestamp = Date.now().toString(base);
    const key = Math.random().toString(base).substring(2);

    return timestamp + key;
  }

  if (!window.eg.widgets.initialized) {
    let widgetsUrl;

    (function assets() {
      const head = document.querySelector('head');

      const script = document.querySelector('.eg-widgets-script');
      const scriptClassName = script.getAttribute('class');
      const scriptUrl = script.getAttribute('src');

      const link = document.createElement('link');
      const linkClassName = scriptClassName.replace('script', 'style');
      const linkUrl = scriptUrl.replace('js', 'css');

      link.className = linkClassName;
      link.rel = 'stylesheet';
      link.href = linkUrl;

      head.appendChild(link);

      widgetsUrl = scriptUrl.replace(/(.*\/products\/widgets).*/, '$1');
    })();

    window.addEventListener('DOMContentLoaded', function handleDOMContentLoaded() {
      if (!window.eg.widgets.loaded) {
        (function elements() {
          const elements = toArray(document.querySelectorAll('.eg-widget'));

          elements.forEach(function elementMapper(element) {
            const widget = getCleanInput(element.getAttribute('data-widget'));

            if (!isEmpty(widget)) {
              const program = getCleanInput(element.getAttribute('data-program'));
              const lobs = getCleanInput(element.getAttribute('data-lobs'));

              const networkId = getCleanInput(element.getAttribute('data-network'));

              // direct
              const mdpcid = getCleanInput(element.getAttribute('data-mdpcid'));
              const rffrid = getCleanInput(element.getAttribute('data-rffrid'));

              // pz
              const camRef = getCleanInput(element.getAttribute('data-camref'));
              const pubRef = getCleanInput(element.getAttribute('data-pubref'));
              const adRef = getCleanInput(element.getAttribute('data-adref'));

              const instance = getGeneratedInstanceId();

              element.setAttribute('data-instance', instance);

              const widgetUrlPathname = '/' + widget + '-widget';
              const widgetUrlSearch = getUrlSearch([
                ['program', program],
                ['lobs', lobs],

                ['network', networkId],

                // direct
                ['mdpcid', mdpcid],
                ['rffrid', rffrid],

                // pz
                ['camref', camRef],
                ['pubref', pubRef],
                ['adref', adRef],

                ['instance', instance],
              ]);

              element.className = getClassName(element.className, 'eg-' + widget + '-widget');

              const frame = document.createElement('iframe');

              frame.className = getClassName('eg-widget-frame', 'eg-' + widget + '-widget-frame');
              frame.src = widgetsUrl + widgetUrlPathname + widgetUrlSearch;
              frame.style.width = '0';
              frame.style.height = '0';
              frame.style.margin = 'auto';
              frame.style.border = 'none';

              element.appendChild(frame);

              window.eg.widgets.elements[instance] = element;
            }
          });
        })();

        (function events() {
          function checkMessageEventOrigin(event, origins) {
            return event && origins.indexOf(event.origin) !== -1;
          }

          function checkMessageEventDataType(event, types) {
            return event && event.data && types.indexOf(event.data.type) !== -1;
          }

          window.addEventListener('message', function handleMessage(event /* MessageEvent */) {
            if (
              checkMessageEventOrigin(event, [
                'https://creator.expediagroup.com',
                'https://creatorexpediagroupcom.staging.exp-test.net',
                'https://creatorexpediacom.sandbox.exp-test.net:8443/',
                'https://localhost:8443',
              ]) &&
              checkMessageEventDataType(event, ['eg-widget/resize'])
            ) {
              const meta = event.data.meta;
              const payload = event.data.payload;

              const element = window.eg.widgets.elements[meta.instance];
              const frame = element.querySelector('.eg-widget-frame');

              frame.style.width = payload.frame.style.width;
              frame.style.height = payload.frame.style.height;
            }
          });
        })();

        window.eg.widgets.loaded = true;
      }
    });

    window.eg.widgets.initialized = true;
  }
})(window, document);
