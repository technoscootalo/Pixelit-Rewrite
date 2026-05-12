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
    const allowedRoles = ["Owner", "Community Manager"];

    if (!allowedRoles.includes(user.role)) {
      // Hide panel links for non-authorized users on other pages
      if (window.location.pathname !== "/panel") {
        const panelLinks = document.querySelectorAll('a[href="/panel"]');
        panelLinks.forEach(link => {
          link.style.display = "none";
        });
      } else {
        // Redirect away from panel if trying to access it without authorization
        window.history.back();
      }
    }
  } catch (err) {
    console.error("Failed to check panel access:", err);
  }
}

document.addEventListener("DOMContentLoaded", checkPanelAccess);
