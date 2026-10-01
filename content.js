(() => {
  const DEBUG = true;
  const DEBUG_PREFIX = "[MR&SU]";
  const log = DEBUG ? console.log.bind(console, '[MR&SU]') : () => {};

  const html = document.documentElement;
  const body = document.body;
  const force = (el, prop, value) => el.style.setProperty(prop, value, 'important');

  // ---------------------------------------------------------------------------
  // 1. Find full-screen fixed overlays
  // ---------------------------------------------------------------------------
  function findOverlays() {
    const vw = html.clientWidth, vh = html.clientHeight;
    const iw = window.innerWidth, ih = window.innerHeight;
    const found = [];

    for (const el of document.querySelectorAll('*')) {
      if (el === html || el === body) continue;

      const cs = getComputedStyle(el);
      // Overlays are fixed. 'sticky' is skipped: pinned 100vh sections are content.
      if (cs.position !== 'fixed') continue;
      if (cs.display === 'none' || cs.visibility === 'hidden') continue;

      const w = parseFloat(cs.width), h = parseFloat(cs.height);
      const isFull =
        (w + 1 >= vw && h + 1 >= vh) ||
        (w + 10 >= iw && h + 10 >= ih);
      if (!isFull) continue;

      // Fixed app roots / page wrappers hold the real content: leave them alone.
      if (el.matches('main, article, [role="main"]') ||
          el.querySelector('main, article, [role="main"]')) continue;

      found.push(el);
    }
    log(`overlays: ${found.length}`, found);
    return found;
  }

  // Hide instead of remove: frameworks such as React can throw if a node they
  // manage disappears from the DOM. A page reload restores everything.
  function hideAll(elements) {
    for (const el of elements) {
      force(el, 'display', 'none');
      log('Hidden', el);
    }
  }

  // ---------------------------------------------------------------------------
  // 2. Restore page scrolling
  // ---------------------------------------------------------------------------
  // position:fixed locks usually use top:-<scrollOffset>px; undo it and
  // put the user back where they were.
  function unfix(el) {
    const y = -parseInt(getComputedStyle(el).top, 10) || 0;
    force(el, 'position', 'static');
    force(el, 'top', 'auto');
    if (y > 0) window.scrollTo(0, y);
    log(`Unfixed <${el.tagName.toLowerCase()}>, restored scroll to ${y}`);
  }

  const isClipped = (cs) => ['hidden', 'clip'].includes(cs.overflowY);
  const hasHiddenContent = (el) => el.scrollHeight > el.clientHeight + 1;

  function unlockScroll() {
    const targets = [html, body].filter(Boolean);

    // Step 1: undo position:fixed locks (this changes layout, so do it first).
    for (const el of targets) {
      if (getComputedStyle(el).position === 'fixed') unfix(el);
    }

    // Step 2: overflow locks. Only touched when there is content to scroll to,
    // so app-style pages that clip by design are left alone.
    const htmlLocked = isClipped(getComputedStyle(html)) && hasHiddenContent(html);
    if (htmlLocked) {
      force(html, 'overflow', 'auto');
      log('html overflow reset');
    }
    if (body) {
      const bodyLocked =
        isClipped(getComputedStyle(body)) &&
        (hasHiddenContent(body) || hasHiddenContent(html));
      if (bodyLocked) {
        // If <html> was also locked, body's overflow no longer propagates to
        // the viewport; 'visible' avoids creating a nested scroller.
        force(body, 'overflow', htmlLocked ? 'visible' : 'auto');
        log('body overflow reset');
      }
    }

    // Step 3: touch-scroll blockers.
    for (const el of targets) {
      if (getComputedStyle(el).touchAction === 'none') {
        force(el, 'touch-action', 'auto');
        log(`touch-action reset on <${el.tagName.toLowerCase()}>`);
      }
    }
  }

  hideAll(findOverlays());
  unlockScroll();
})();
