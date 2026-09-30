(() => {
  const DEBUG = true;
  const debug = {
    log: DEBUG ? console.log.bind(console) : () => {},
    table: DEBUG ? console.table.bind(console) : () => {}
  };

  function getStyleValue(elem, prop) {
    const style = elem ? window.getComputedStyle(elem) : null;
    return style ? style[prop] : '';
  }

  function unlockScreen(elem) {
    const doc = document;
    const isScreenLocked = { elem: elem, value: false, reasons: [] };
    if (getStyleValue(doc.body, 'overflowY') === 'hidden') {
      isScreenLocked.value = true;
      isScreenLocked.reasons.push(['body', 'overflowY:hidden']);
      doc.body.style.setProperty('overflow', 'auto', 'important');
    }
    if (getStyleValue(doc.body, 'position') === 'fixed') {
      isScreenLocked.value = true;
      isScreenLocked.reasons.push(['body', 'position:fixed']);
      doc.body.style.setProperty('position', 'initial', 'important');
    }
    if (getStyleValue(doc.documentElement, 'position') === 'fixed') {
      isScreenLocked.value = true;
      isScreenLocked.reasons.push(['documentElement', 'position:fixed']);
      doc.documentElement.style.setProperty('position', 'initial', 'important');
    }
    if (getStyleValue(doc.documentElement, 'overflowY') === 'hidden') {
      isScreenLocked.value = true;
      isScreenLocked.reasons.push(['documentElement', 'overflowY:hidden']);
      doc.documentElement.style.setProperty('overflow', 'auto', 'important');
    }
  }

  // credits to https://github.com/gorhill/uBlock/blob/master/src/js/scriptlets/epicker.js
  function unlockScreenIfLocked(elemToRemove) {
    // Heuristic to detect scroll-locking: remove such lock when detected.
    let maybeScrollLocked = elemToRemove.shadowRoot instanceof DocumentFragment;
    if (maybeScrollLocked === false) {
      let elem = elemToRemove;
      do {
        maybeScrollLocked =
          parseInt(getStyleValue(elem, 'zIndex'), 10) >= 1000 ||
          getStyleValue(elem, 'position') === 'fixed';
        elem = elem.parentElement;
      } while (elem !== null && maybeScrollLocked === false);
    }
    if (maybeScrollLocked) {
      unlockScreen(elemToRemove);
    }
  }

  function getStickies(elements) {
    if (!elements) elements = document.all;

    const stickies = [].filter.call(
      elements,
      e => ['fixed', 'sticky'].includes(getComputedStyle(e).position)
    );

    debug.log(`stickies: ${stickies.length}`);
    if (stickies.length > 0) debug.log(stickies);

    return stickies;
  }

  function getFullModals(elements) {
    const docSize = {
      width: document.documentElement.clientWidth,
      height: document.documentElement.clientHeight
    };

    debug.log(`win size: ${docSize.width}x${docSize.height}`);

    const fullModals = elements.filter(function (el) {
      const style = getComputedStyle(el);
      const size = { width: parseFloat(style['width']), height: parseFloat(style['height']) };
      return (size.width + 1) >= docSize.width && (size.height + 1) >= docSize.height;
    });

    debug.log(`full modals: ${fullModals.length}`);
    if (fullModals.length > 0) debug.log(fullModals);

    return fullModals;
  }

  function unlockAndRemove(elements) {
    for (let el of elements) {
      unlockScreenIfLocked(el);
      if (el.tagName !== 'BODY') {
        debug.log("Unlocked & Removed", el);
        el.remove();
      } else {
        debug.log("Unlocked", el);
      }
    }
  }

  function unlockAndRemoveFullModals() {
    const stickies = getStickies();
    const fullModals = getFullModals(stickies);

    debug.log(fullModals.length > 0 ? `Unlocking ${fullModals.length} full modals...` : "No full modals to unlock!");
    unlockAndRemove(fullModals);
  }

  unlockAndRemoveFullModals();
})();
