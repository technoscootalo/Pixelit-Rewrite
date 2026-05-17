let allArticles = [];
let selectedArticle = null;

function ensureUI() {
  const main = document.querySelector("main");
  if (!main) return;
  if (document.getElementById("newsEditorRoot")) return;

  const style = document.createElement("style");
  style.id = "newsEditorInlineStyles";
  style.textContent = `
    .news-editor-root { width: 100%; max-width: 1100px; margin: 0 auto; display: grid; grid-template-columns: 1.2fr 1fr; gap: 20px; }
    .news-editor-panel { background: rgba(0,0,0,0.25); border: 2px solid rgba(255,255,255,0.08); border-radius: 12px; padding: 14px; }

    .news-editor-btn {
      background: #5e046e;
      color: white;
      border: none;
      padding: 10px 14px;
      border-radius: 8px;
      cursor: pointer;
      font-family: 'Pixelify Sans', sans-serif;
      box-shadow: inset 0 -0.365vw #53055c, 3px 3px 15px rgba(0, 0, 0, 0.6);
    }

    .news-editor-btn.secondary {
      background: #6f057a;
      box-shadow: inset 0 -0.365vw #53055c, 3px 3px 15px rgba(0, 0, 0, 0.6);
    }

    .news-editor-btn.danger {
      background: #3b0000;
    }

    .news-list {
      margin-top: 14px;
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .news-item {
      padding: 12px;
      border-radius: 10px;
      background: rgba(111, 0, 131, 0.25);
      border: 1px solid rgba(255,255,255,0.08);
      cursor: pointer;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .news-image-preview {
      width: 100%;
      max-height: 220px;
      object-fit: cover;
      border-radius: 10px;
      border: 1px solid rgba(255,255,255,0.08);
      background: rgba(0,0,0,0.2);
    }

    .news-editor-input {
      width: 100%;
      height: 45px;
      text-align: center;
      font-size: 18px;
      font-weight: bold;
      background: transparent;
      border: 2px solid #5e046e;
      color: white;
      border-radius: 10px;
      outline: none;
      font-family: 'Pixelify Sans', sans-serif;
      padding: 0 10px;
    }

    .news-editor-textarea {
      width: 100%;
      min-height: 140px;
      resize: vertical;
      background: rgba(0,0,0,0.12);
      border: 2px solid #5e046e;
      color: white;
      border-radius: 10px;
      outline: none;
      font-family: 'Pixelify Sans', sans-serif;
      padding: 12px;
      text-align: left;
    }

    .news-editor-row {
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
      margin-top: 14px;
    }

    .news-editor-row > * {
      flex: 1;
    }

    .news-modal-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,0.6);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 10000;
    }

    .news-modal-box {
      background: #6f057a;
      padding: 20px;
      border-radius: 12px;
      width: 480px;
      text-align: center;
      box-shadow: inset 0 -0.365vw #61056b, 3px 3px 15px rgba(0, 0, 0, 0.6);
    }

    .news-editor-inline-note {
      margin: 12px 0 0;
      opacity: 0.75;
      font-size: 14px;
    }
  `;

  document.head.appendChild(style);

  const root = document.createElement("div");
  root.id = "newsEditorRoot";
  root.className = "news-editor-root";

  const left = document.createElement("section");
  left.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;">
      <h1 style="margin:0;font-size:28px;">News Articles</h1>
      <button id="refreshNewsBtn" class="news-editor-btn">Refresh</button>
    </div>
    <div id="newsList" class="news-list"></div>
  `;

  const right = document.createElement("section");
  right.innerHTML = `
    <div class="news-editor-panel">
      <h2 style="margin:0 0 10px;">Select an article</h2>

      <div id="newsDetails" style="opacity:0.95;line-height:1.35;">
        <p style="margin:0;opacity:0.8;">Click an article in the list.</p>
      </div>

      <div class="news-editor-row">
        <button id="createNewsBtn" class="news-editor-btn">Create</button>
        <button id="editNewsBtn" class="news-editor-btn secondary" disabled>Edit</button>
        <button id="deleteNewsBtn" class="news-editor-btn danger" disabled>Delete</button>
      </div>

      <p class="news-editor-inline-note">
        Add an image URL while creating to render it in the article preview.
      </p>
    </div>
  `;

  root.appendChild(left);
  root.appendChild(right);
  main.appendChild(root);

  setStubEnabled(false);
}

function renderList() {
  const list = document.getElementById("newsList");
  if (!list) return;

  list.innerHTML = "";

  if (!Array.isArray(allArticles) || allArticles.length === 0) {
    const empty = document.createElement("div");
    empty.textContent = "No articles found.";
    empty.style.opacity = "0.8";
    list.appendChild(empty);
    return;
  }

  allArticles.forEach(article => {
    const item = document.createElement("div");
    item.className = "news-item";

    const title = article.title || "Untitled";
    const published = article.publishedAt
      ? new Date(article.publishedAt).toLocaleString()
      : "";

    const snippet = article.content
      ? String(article.content).slice(0, 120)
      : "";

    item.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:space-between;">
        <strong>${escapeHtml(title)}</strong>
        <span style="opacity:0.75;font-size:12px;">
          ${escapeHtml(published)}
        </span>
      </div>

      ${
        snippet
          ? `<div style="opacity:0.8;font-size:13px;">
              ${escapeHtml(snippet)}...
            </div>`
          : ""
      }
    `;

    item.onclick = () => selectArticle(article);
    list.appendChild(item);
  });
}

function renderDetails() {
  const details = document.getElementById("newsDetails");
  if (!details) return;

  if (!selectedArticle) {
    details.innerHTML = `
      <p style="margin:0;opacity:0.8;">
        Click an article in the list.
      </p>
    `;
    return;
  }

  const title = selectedArticle.title || "Untitled";
  const body = selectedArticle.content || "";
  const imageUrl = selectedArticle.imageUrl || "";

  details.innerHTML = `
    ${imageUrl ? `<img class="news-image-preview" src="${escapeAttr(imageUrl)}">` : ""}
    <h3>${escapeHtml(title)}</h3>
    <div style="white-space:pre-wrap;">
      ${escapeHtml(body)}
    </div>
  `;
}

function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "")
    .replaceAll("'", "&#039;");
}

function escapeAttr(str) {
  return escapeHtml(str);
}

function setStubEnabled(enabled) {
  const editBtn = document.getElementById("editNewsBtn");
  const deleteBtn = document.getElementById("deleteNewsBtn");

  if (editBtn) editBtn.disabled = !enabled;
  if (deleteBtn) deleteBtn.disabled = !enabled;
}

function selectArticle(article) {
  selectedArticle = article;
  renderDetails();
  setStubEnabled(true);
}

async function loadArticles() {
  const res = await fetch("/api/articles", {
    credentials: "include"
  });

  if (!res.ok) {
    throw new Error("Failed to load articles");
  }

  allArticles = await res.json();

  renderList();
  selectedArticle = null;
  renderDetails();
  setStubEnabled(false);
}

document.addEventListener("DOMContentLoaded", () => {
  ensureUI();
  wireButtons();

  loadArticles().catch(err => {
    console.error(err);

    const list = document.getElementById("newsList");

    if (list) {
      list.innerHTML = `
        <div style="opacity:0.85;color:#ffd0d0;">
          Failed to load articles.
        </div>
      `;
    }
  });
});