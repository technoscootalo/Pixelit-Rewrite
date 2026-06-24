function displayWarning() {
    setTimeout(() => {
      console.log(`%cWARNING!`, `font-size: 35px; color: red;`);
      console.log(`%cAttention! This console is a tool for developers. If you've been instructed to paste code here to unlock special features or gain unauthorized access, it’s a scam! Be cautious, as it could compromize your account.`, `font-size: 20px; color: red;`);
      console.log("Running Pixelit version [3.0.7]");
    }, 1);
}

displayWarning();

(() => {
  function initNews() {
    const newsBtn = document.getElementById('newsBtn');
    const sidebar = document.getElementById('newsSidebar');
    const overlay = document.getElementById('newsSidebarOverlay');
    const contentEl = document.getElementById('newsSidebarArticles');

    if (!newsBtn || !sidebar || !overlay || !contentEl) return;

    if (newsBtn.dataset.newsWired === '1') return;
    newsBtn.dataset.newsWired = '1';

    async function loadArticles() {
      contentEl.innerHTML = `
        <div style="opacity:0.8;text-align:center;padding:20px;">Loading news...</div>
      `;

      const res = await fetch('/api/articles', { credentials: 'include' });
      const data = await res.json();

      if (!res.ok || !Array.isArray(data)) {
        contentEl.innerHTML = `
          <div style="opacity:0.9;text-align:center;padding:20px;">Failed to load news.</div>
        `;
        return;
      }

      if (data.length === 0) {
        contentEl.innerHTML = `
          <div style="opacity:0.9;text-align:center;padding:20px;">No news articles found.</div>
        `;
        return;
      }

      contentEl.innerHTML = data
        .map((article) => {
          const title = article.title || 'Untitled';
          const body = article.content || '';
          const imageUrl = article.imageUrl || '';

          const date = article.publishedAt ? new Date(article.publishedAt) : null;
          const dateStr =
            date && !isNaN(date.getTime())
              ? date.toLocaleDateString(undefined, {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })
              : '';

          return `
            <br/>
            <div class="news-card"
              style="
                width:92%;
                margin:12px auto;
                padding:16px;
                border-radius:5px;
                background: #6f057a;
                box-shadow: inset 0 -0.365vw #570066, 3px 3px 15px rgba(0, 0, 0, 0.6);
                color:white;
                font-family:'Pixelify Sans', sans-serif;
                text-align:left;
              "
            >
              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;gap:10px;">
                <h1 style="margin:0;font-size:34px;font-weight:bold;font-family:'Pixelify Sans', sans-serif;">${title}</h1>
              </div>

              ${
                imageUrl
                  ? `
                    <img
                      src="${imageUrl}"
                      alt="News Image"
                      draggable="false"
                      style="
                        width:100%;
                        max-height:100%;
                        object-fit:cover;
                        border-radius:8px;
                        margin-bottom:12px;
                        filter: drop-shadow(0 0 5px rgba(0, 0, 0, 0.5));
                      "
                    />
                  `
                  : ''
              }

              <div style="line-height:1.5;opacity:0.9;">${body}</div>

              <br/>

              ${
                dateStr
                  ? `
                    <span style="opacity:0.7;font-size:13px;white-space:nowrap;">
                      <i class="far fa-calendar-alt" style="margin-right: 0.365vw;" aria-hidden="true"></i> ${dateStr}
                    </span>
                  `
                  : ''
              }
            </div>
          `;
        })
        .join('');
    }

    async function open() {
      overlay.classList.add('active');
      sidebar.classList.add('active');
      sidebar.setAttribute('aria-hidden', 'false');
      await loadArticles();
    }

    function close() {
      overlay.classList.remove('active');
      sidebar.classList.remove('active');
      sidebar.setAttribute('aria-hidden', 'true');
    }

    newsBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      e.stopPropagation();

      const isOpen = sidebar.classList.contains('active');
      if (isOpen) close();
      else await open();
    });

    overlay.addEventListener('click', close);

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') close();
    });

    const closeBtn = sidebar.querySelector('[data-news-sidebar-close]');
    if (closeBtn) closeBtn.addEventListener('click', close);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initNews);
  } else {
    initNews();
  }
})();