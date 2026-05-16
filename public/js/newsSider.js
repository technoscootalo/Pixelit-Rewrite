(() => {
  const newsBtn = document.getElementById("newsBtn");
  const sidebar = document.getElementById("newsSidebar");
  const overlay = document.getElementById("newsSidebarOverlay");

  if (!newsBtn || !sidebar || !overlay) return;

  const open = () => {
    overlay.classList.add("active");
    sidebar.classList.add("active");
    sidebar.setAttribute("aria-hidden", "false");
  };


  const contentEl = sidebar.querySelector("#newsSidebarArticles");

  async function loadArticles() {
    if (!contentEl) return;
    try {
      contentEl.innerHTML = "<div style='opacity:0.8'>Loading...</div>";
      const res = await fetch("/api/articles", { credentials: "include" });
      const data = await res.json();
      if (!res.ok || !Array.isArray(data)) {
        contentEl.innerHTML = "<div style='opacity:0.9'>Failed to load news.</div>";
        return;
      }

      contentEl.innerHTML = data
        .map((a) => {
          const title = a.title ? String(a.title) : "(Untitled)";
          const body = a.content ? String(a.content) : "";
          const normalizedPublishedAt =
            a.publishedAt && typeof a.publishedAt === "object" && a.publishedAt.$date
              ? a.publishedAt.$date
              : a.publishedAt;

          const date = normalizedPublishedAt ? new Date(normalizedPublishedAt) : null;
          const dateStr = date && !isNaN(date.getTime()) ? date.toLocaleDateString() : "";
          return `
            <div class="news-card" style="box-sizing:border-box;width:90%;margin:0.521vw auto;padding:0.521vw 0.781vw 0.885vw;background-color:#1f1f1f;box-shadow:inset 0 -0.365vw rgba(0,0,0,0.2),0 0 0.208vw rgba(0,0,0,0.15);border-radius:0.365vw;color:#fff;font-family:Quicksand, sans-serif;color:#ffffff;">
              <div style="display:flex;justify-content:space-between;gap:10px;align-items:center;margin-bottom:8px;">
                <div style="font-weight:700;font-size:1.1rem;line-height:1.2;">${title}</div>
                ${dateStr ? `<div style="opacity:0.7;font-size:0.85rem;white-space:nowrap;">${dateStr}</div>` : ""}
              </div>
              ${a.imageUrl ? `<img src="${a.imageUrl}" alt="News image" style="width:100%;border-radius:0.25rem;margin:8px 0;"/>` : ""}
              <div style="opacity:0.9;line-height:1.5;white-space:pre-wrap;">${body}</div>
            </div>
          `;
        })
        .join("");
    } catch (err) {
      console.error(err);
      if (contentEl) contentEl.innerHTML = "<div style='opacity:0.9'>Failed to load news.</div>";
    }
  }

  const close = () => {
    overlay.classList.remove("active");
    sidebar.classList.remove("active");
    sidebar.setAttribute("aria-hidden", "true");
  };

  newsBtn.addEventListener("click", (e) => {
    e.preventDefault();
    const isOpen = sidebar.classList.contains("active");
    if (isOpen) close();
    else open();
  });

  overlay.addEventListener("click", close);

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") close();
  });

  const closeBtn = sidebar.querySelector("[data-news-sidebar-close]");
  if (closeBtn) closeBtn.addEventListener("click", close);
})();

