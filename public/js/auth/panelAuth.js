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
    const allowedRoles = ["Owner", "Developer", "Community Manager"];

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

document.addEventListener("DOMContentLoaded", checkPanelAccess);