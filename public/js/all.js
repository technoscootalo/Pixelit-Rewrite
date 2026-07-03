// ------------------------
// /js/auth/checkSession.js
// ------------------------

fetch("/api/loggedin", {
    credentials: "include"
})
.then(res => res.json())
.then(data => {
    if (!data.loggedIn) {
        window.location.href = "/login";
    }
})
.catch(() => {
    window.location.href = "/login";
});

// ------------------------
// /js/auth/panelAuth.js
// ------------------------

async function checkPanelAccess() {
  try {
    const res = await fetch("/api/user", {
      method: "GET",
      credentials: "include"
    });

    if (!res.ok) {
      window.history.back();
      return;
    }

    const user = await res.json();
    const allowedRoles = ["Owner", "Developer", "Community Manager", "Admin"];

    if (!allowedRoles.includes(user.role)) {
      if (window.location.pathname !== "/panel") {
        const panelLinks = document.querySelectorAll('a[href="/panel"]');
        panelLinks.forEach(link => {
          link.style.display = "none";
        });
      } else {
        window.history.back();
      }

      return;
    }

    document.body.classList.add("panel-allowed");

  } catch (err) {
    console.error("Failed to check panel access:", err);
  }
}

fetch("/api/loggedin", {
    credentials: "include"
})
.then(res => res.json())
.then(data => {
    if (!data.loggedIn) {
        window.location.href = "/login";
    }
})
.catch(() => {
    window.location.href = "/login";
});

document.addEventListener("DOMContentLoaded", checkPanelAccess);

// ------------------------
// /js/profile-dropdown.js
// ------------------------

document.addEventListener('DOMContentLoaded', function() {
  const profilePic = document.getElementById('profilePic');
  const profileName = document.getElementById('profileName');

  async function loadProfileData() {
    try {
      const response = await fetch('/api/user');
      const data = await response.json();
      
      if (data && data.username) {
        if (data.pfp) {
          profilePic.src = data.pfp;
        } else {
          profilePic.src = 'https://izumiihd.github.io/pixelitcdn/assets/img/blooks/logo.png';
        }

        profileName.textContent = data.username;

        const roleColors = {
          Owner: "#020202",
          Veteran: "#969a5c",
          Verified: "#5ab65b",
          Plus: "#5657d3",
          Tester: "#80a1d3",
          Helper: "#4b69c3",
          Moderator: "#ab53c4",
          Admin: "#dc6dc1",
          "Community Manager": "#69c95d",
          Developer: "#6a76c7",
          Artist: "#ca964c",
        };

        if (data.role && roleColors[data.role]) {
          profileName.style.color = roleColors[data.role];
        }
      }
    } catch (error) {
      console.error('Error loading profile data:', error);
      profilePic.src = 'https://izumiihd.github.io/pixelitcdn/assets/img/blooks/logo.png';
      profileName.textContent = 'User';
    }
  }

  loadProfileData();
});

function handleLogout(event) {
  event.preventDefault();
  
  fetch('/api/logout', { 
    method: 'POST', 
    credentials: 'include' 
  })
  .then((response) => {
    if (!response.ok) {
      throw new Error(`Server responded with status: ${response.status}`);
    }
    window.location.href = '/login'; 
  })
  .catch((error) => { 
    console.error('Logout error:', error);
    window.location.href = '/login'; 
  });
}

// ------------------------
// /js/loadingModal.js
// ------------------------

(function () {
  const STYLE_ID = "pixelit-loader-style";
  const MODAL_ID = "pixelit-loader-modal";

  function ensureStyle() {
    if (document.getElementById(STYLE_ID)) return;

    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `
      @font-face { font-family: 'DaydreamWeb'; src: url('styles/Daydream DEMO.otf') format('opentype'); font-display: swap;}

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
        font-size: 38px;
        font-family: 'DaydreamWeb';
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
        border-radius: 5px;
        object-fit: contain;
      }

      @keyframes pixelit-bouncing-snap {
        0% { transform: translateY(0) rotate(0deg); }
        25% { transform: translateY(-20px) rotate(90deg); }
        35% { transform: translateY(0) rotate(90deg); }
        50% { transform: translateY(-20px) rotate(180deg); }
        60% { transform: translateY(0) rotate(180deg); }
        75% { transform: translateY(-20px) rotate(270deg); }
        85% { transform: translateY(0) rotate(270deg); }
        100% { transform: translateY(-20px) rotate(360deg); }
      }

      .pixelit-loader-icon {
        animation: pixelit-bouncing-snap 2s cubic-bezier(0.4, 0, 0.2, 1) infinite;
        width: 78px;
        height: 78px;
        object-fit: contain;
        transform-origin: center;
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
            src="https://izumiihd.github.io/pixelitcdn/assets/img/favicon.ico"
            alt="Loading"
          />
        </div>
        <div id="pixelit-loader-subtext" class="pixelit-loader-subtext">Please wait</div>
      </div>
    `;

    document.body.appendChild(modal);
    return modal;
  }

let loaderInterval = null;

window.showLoader = function showLoader() {
  const modal = ensureModal();
  modal.style.display = "flex";

  if (loaderInterval) clearInterval(loaderInterval);

  const subtext = document.getElementById("pixelit-loader-subtext");
  let dots = 0;

  loaderInterval = setInterval(() => {
    dots = (dots + 1) % 4;
    subtext.textContent = "Loading" + ".".repeat(dots);
  }, 400); 
};

window.hideLoader = function hideLoader() {
  const modal = document.getElementById(MODAL_ID);
  if (modal) modal.style.display = "none";
  
  if (loaderInterval) {
    clearInterval(loaderInterval);
    loaderInterval = null;
  }
};

window.addEventListener("DOMContentLoaded", () => {
    window.showLoader();
  });

  window.addEventListener("load", () => {
    window.hideLoader();
  });
})();

// ------------------------
// /js/mobileNav.js
// ------------------------

document.addEventListener('DOMContentLoaded', () => {

  (function mobileNavDrawer() {

    const overlay = document.getElementById('mobileSidebarOverlay');
    const sidebar = document.getElementById('mobileSidebar');
    const openBtn = document.querySelector('.mobile_menu_button');
    const closeBtn = document.querySelector('.mobile_sidebar_close');

    if (!overlay || !sidebar || !openBtn || !closeBtn) return;

    const setOpen = (isOpen) => {
      if (isOpen) {
        document.documentElement.style.overflow = 'hidden';
        document.body.style.overflow = 'hidden';
      } else {
        document.documentElement.style.overflow = '';
        document.body.style.overflow = '';
      }

      if (!isOpen && document.activeElement) {
        const active = document.activeElement;
        if (sidebar.contains(active)) {
          openBtn.focus();
        }
      }

      overlay.classList.toggle('active', isOpen);
      sidebar.classList.toggle('active', isOpen);

      sidebar.setAttribute('aria-hidden', isOpen ? 'false' : 'true');
      overlay.setAttribute('aria-hidden', isOpen ? 'false' : 'true');

      sidebar.toggleAttribute('inert', !isOpen);
      overlay.toggleAttribute('inert', !isOpen);

      openBtn.setAttribute('aria-expanded', String(isOpen));
    };

    const open = () => setOpen(true);
    const close = () => setOpen(false);

    openBtn.addEventListener('click', () => {
      const isOpen = sidebar.classList.contains('active');
      if (isOpen) close();
      else open();
    });

    closeBtn.addEventListener('click', close);
    overlay.addEventListener('click', close);

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') close();
    });

    document.querySelectorAll('[data-mobile-nav-link]').forEach((a) => {
      a.addEventListener('click', () => close());
    });
  })();
});

function presenceSocket() {
  try {
    if (typeof io !== "function") return;

    fetch("/api/loggedin", { credentials: "include" })
      .then((r) => r.json())
      .then((data) => {
        if (!data || !data.loggedIn) return;

        if (window.__pixelitPresenceSocketInitialized) return;
        window.__pixelitPresenceSocketInitialized = true;

        const s = io({
          reconnection: true,
          reconnectionAttempts: 10,
          reconnectionDelay: 1000,
          timeout: 10000,
        });

        s.on("connect", () => {
          console.log("Presence socket connected");
        });

        s.on("disconnect", () => {
          console.log("Presence socket disconnected");
        });

        window.__pixelitPresenceSocket = s;
      })
      .catch(() => {});
  } catch {}
}

presenceSocket();