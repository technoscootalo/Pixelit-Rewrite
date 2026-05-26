(function () {
  const STYLE_ID = "pixelit-loader-style";
  const MODAL_ID = "pixelit-loader-modal";

  function ensureStyle() {
    if (document.getElementById(STYLE_ID)) return;

    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `
      #${MODAL_ID} {
        position: fixed;
        inset: 0;
        z-index: 999999;
        background: rgba(0, 0, 0, 0.55);
        display: none;
        align-items: center;
        justify-content: center;
        padding: 16px;
      }

      .pixelit-loader {
        width: 220px;
        max-width: 95vw;
        border-radius: 14px;
        padding: 16px 18px;
        text-align: center;
        color: #fff;
        user-select: none;
      }

      .pixelit-loader-title {
        font-weight: 800;
        font-size: 48px;
        margin: 0 0 10px;
        text-shadow: -1px -1px 0 black, 1px -1px 0 black, -1px 1px 0 black, 1px 1px 0 black;
      }

      .pixelit-loader-icon-wrap {
        width: 120px;
        height: 120px;
        border-radius: 28px;
        display: flex;
        align-items: center;
        justify-content: center;
        margin: 10px auto 0;
        animation: pixelit-breathe 1.2s ease-in-out infinite;
      }

      .pixelit-loader-icon {
        width: 78px;
        height: 78px;
        object-fit: contain;
        animation: pixelit-spin-slow 1.6s linear infinite;
      }

      @keyframes pixelit-breathe {
        0%, 100% { transform: scale(1); opacity: 0.95; }
        50% { transform: scale(1.06); opacity: 1; }
      }

      @keyframes pixelit-spin-slow {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }

      .pixelit-loader-subtext {
        margin-top: 10px;
        font-size: 26px;
        opacity: 0.9;
      }
    `;

    document.head.appendChild(style);
  }

  function ensureModal() {
    ensureStyle();

    let modal = document.getElementById(MODAL_ID);
    if (modal) return modal;

    modal = document.createElement("div");
    modal.id = MODAL_ID;
    modal.setAttribute("role", "dialog");
    modal.setAttribute("aria-modal", "true");

    modal.innerHTML = `
      <div class="pixelit-loader">
        <p class="pixelit-loader-title">Loading</p>
        <div class="pixelit-loader-icon-wrap" aria-hidden="true">
          <img
            class="pixelit-loader-icon"
            src="https://izumiihd.github.io/pixelitcdn/assets/img/blooks/logo.png"
            alt="Loading"
          />
        </div>
        <div class="pixelit-loader-subtext">Please wait...</div>
      </div>

    `;

    document.body.appendChild(modal);
    return modal;
  }

  window.showLoader = function showLoader() {
    const modal = ensureModal();
    modal.style.display = "flex";
  };

  window.hideLoader = function hideLoader() {
    const modal = document.getElementById(MODAL_ID);
    if (modal) modal.style.display = "none";
  };

  if (document.readyState === "loading") {
    window.showLoader();
    document.addEventListener("DOMContentLoaded", () => {
      window.showLoader();
    });
  } else {
    window.showLoader();
  }

  window.addEventListener("load", () => {
    window.hideLoader();
  });
})();

function displayWarning() {
    setTimeout(() => {
        console.log(`%cWARNING!`, `font-size: 35px; color: red;`);
        console.log(`%cAttention! This console is a tool for developers. If you've been instructed to paste code here to unlock special features or gain unauthorized access, it’s a scam! Be cautious, as it could compromize your account.`, `font-size: 20px; color: red;`);
        console.log("Running Pixelit version [3.0.0]");
    }, 1);
}

displayWarning();