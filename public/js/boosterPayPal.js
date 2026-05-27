async function purchaseBooster(boosterCode) {
  try {
    if (!boosterCode) return;

    const res = await fetch("/api/boosters/paypal/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ boosterCode }),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      alert((data?.error || "Failed to start PayPal checkout") + (data?.details ? `: ${data.details}` : ""));
      return;
    }

    if (data?.approvalUrl) {
      window.open(data.approvalUrl, "_blank");
      return;
    }

    alert(data?.error || "PayPal order creation failed. Check server logs.");
  } catch (err) {
    console.error(err);
    alert("Network error starting checkout");
  }
}