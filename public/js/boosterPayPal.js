async function purchaseBooster(boosterCode) {
  try {
    if (!boosterCode) return;

    if (boosterCode === "3_hour_booster") {
      window.open("https://www.paypal.com/ncp/payment/ZF2UU4EC9KAGL", "_blank");
      return;
    }

    alert("Unknown or unconfigured booster item.");
  } catch (err) {
    console.error(err);
    alert("Error executing checkout redirect.");
  }
}