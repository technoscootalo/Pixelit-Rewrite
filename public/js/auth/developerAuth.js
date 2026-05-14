async function checkDeveloperAccess() {
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

    const allowedRoles = ["Owner", "Developer"];

    if (!allowedRoles.includes(user.role)) {
      if (document.referrer) {
        window.location.href = document.referrer;
      } else {
        window.location.href = "/"; 
      }
      return;
    }

  } catch (err) {
    console.error("Failed to check developer access:", err);

    if (document.referrer) {
      window.location.href = document.referrer;
    } else {
      window.location.href = "/";
    }
  }
}

document.addEventListener("DOMContentLoaded", checkDeveloperAccess);