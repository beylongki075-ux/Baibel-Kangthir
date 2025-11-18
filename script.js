// Toggle chapters open/close
document.addEventListener('DOMContentLoaded', () => {
    // Only attach toggle handlers to section buttons whose next sibling
    // is a `.chapter-list`. This prevents inner chapter buttons (which
    // may also use the `.section-btn` class) from triggering the toggle
    // behaviour and causing errors.
    const buttons = document.querySelectorAll('.section > .section-btn');

    buttons.forEach(button => {
        button.addEventListener('click', () => {
            const chapterList = button.nextElementSibling;

            // If there's no sibling chapter list, allow any inline onclick
            // (navigation) to proceed and do not attempt to toggle.
            if (!chapterList || !chapterList.classList || !chapterList.classList.contains('chapter-list')) {
                return;
            }

            // Close others
            document.querySelectorAll('.chapter-list').forEach(list => {
                if (list !== chapterList) list.style.display = 'none';
            });

            // Toggle selected
            chapterList.style.display =
                chapterList.style.display === 'block' ? 'none' : 'block';
        });
    });
});

//# sourceMappingURL=app.js.map
document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('pages-container');
    const pages = Array.from(container.querySelectorAll('.page'));
    const pagerNode = document.getElementById('number-buttons');

    let current = pages.findIndex(p => p.classList.contains('active'));
    if (current === -1) current = 0;

    // build numeric page buttons
    function buildPager() {
        if (!pagerNode) return;
        pagerNode.innerHTML = 'page : ';
        pages.forEach((_, i) => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'page-btn';
            btn.dataset.index = i;
            btn.textContent = (i + 1).toString();
            btn.addEventListener('click', () => showPage(i, { byUser: true }));
            pagerNode.appendChild(btn);
        });
    }

    // update UI (active class, pager highlight, hash, buttons)
    function updateUI() {
        pages.forEach((p, i) => {
            if (i === current) {
                p.classList.add('active');
                p.setAttribute('aria-hidden', 'false');
            } else {
                p.classList.remove('active');
                p.setAttribute('aria-hidden', 'true');
            }
        });

        // highlight pager
        const pagerBtns = pagerNode ? Array.from(pagerNode.querySelectorAll('.page-btn')) : [];
        pagerBtns.forEach((b, i) => {
            b.classList.toggle('active', i === current);
            b.setAttribute('aria-current', i === current ? 'page' : 'false');
        });

        // update URL hash without adding history entry
        try {
            const hash = `#page-${current + 1}`;
            history.replaceState(null, '', hash);
        } catch (e) { /* ignore */ }

        // enable/disable inline nav buttons (there are multiple same-id buttons in the file)
        Array.from(document.querySelectorAll('#nextBtn')).forEach(btn => {
            if (btn.tagName === 'BUTTON') btn.disabled = current >= pages.length - 1;
        });
        Array.from(document.querySelectorAll('#backBtn, #prevBtn')).forEach(btn => {
            if (btn.tagName === 'BUTTON') btn.disabled = current <= 0;
        });
    }

    // show page by index
    function showPage(index, opts = {}) {
        if (index < 0) index = 0;
        if (index >= pages.length) index = pages.length - 1;
        if (index === current && !opts.force) return;
        current = index;
        updateUI();
        // bring visible page into view
        const activePage = pages[current];
        if (activePage) activePage.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    // public navigation functions for inline onclick handlers
    function nextPage() { showPage(current + 1, { byUser: true }); }
    function prevPage() { showPage(current - 1, { byUser: true }); }
    // some buttons use backPage()
    const backPage = prevPage;

    // keyboard navigation
    function onKey(e) {
        if (e.key === 'ArrowRight' || e.key === 'PageDown') nextPage();
        if (e.key === 'ArrowLeft' || e.key === 'PageUp') prevPage();
        if (e.key === 'Home') showPage(0);
        if (e.key === 'End') showPage(pages.length - 1);
    }

    // init from hash if present (#page-N)
    function initFromHash() {
        const m = location.hash.match(/page-(\d+)/i);
        if (m) {
            const n = parseInt(m[1], 10);
            if (!Number.isNaN(n) && n >= 1 && n <= pages.length) {
                current = n - 1;
            }
        }
    }

    // attach global functions so inline onclicks work
    window.nextPage = nextPage;
    window.prevPage = prevPage;
    window.backPage = backPage;
    window.showPage = showPage;

    // setup
    initFromHash();
    buildPager();
    updateUI();

    // listeners
    document.addEventListener('keydown', onKey);
    window.addEventListener('hashchange', () => {
        const m = location.hash.match(/page-(\d+)/i);
        if (m) {
            const n = parseInt(m[1], 10);
            if (!Number.isNaN(n)) showPage(n - 1);
        }
    });
});

//# sourceMappingURL=app.js.map
