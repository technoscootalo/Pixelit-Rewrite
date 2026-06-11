const backButton = document.querySelector(".backButton");

backButton.innerHTML = `<i class="fa-solid fa-reply"></i>`;

backButton.style.cssText = `
  width: 50px;
  height: 50px;
  border: none;
  border-radius: 6px;
  background: #6f057a;
  color: white;
  font-size: 18px;
  font-family: 'Pixelify Sans', sans-serif;
  cursor: pointer;
  box-shadow: inset 0 -3px rgba(0, 0, 0, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.15s ease, background 0.2s ease, box-shadow 0.2s ease;
`;

backButton.onmouseenter = () => {
  backButton.style.transform = "translateY(-3px)";
  backButton.style.background = "#7c068d";
  backButton.style.boxShadow = "inset 0 -4px rgba(0, 0, 0, 0.2), 0 6px 12px rgba(0, 0, 0, 0.25)";
};

backButton.onmouseleave = () => {
  backButton.style.transform = "translateY(0px)";
  backButton.style.background = "#6f057a";
  backButton.style.boxShadow = "inset 0 -3px rgba(0, 0, 0, 0.2)";
};

backButton.onmousedown = () => {
  backButton.style.transform = "translateY(1px) scale(0.97)";
  backButton.style.boxShadow = "inset 0 -1px rgba(0, 0, 0, 0.2)";
};

backButton.onmouseup = () => {
  backButton.style.transform = "translateY(-3px) scale(1)";
  backButton.style.boxShadow = "inset 0 -4px rgba(0, 0, 0, 0.2), 0 6px 12px rgba(0, 0, 0, 0.25)";
};

async function purchasePixelitPlusStripe() {
  try {
    if (typeof showLoader !== 'function') {
      await new Promise((resolve) => {
        const s = document.createElement('script');
        s.src = '/js/loadingModal.js';
        s.onload = () => resolve();
        s.onerror = () => resolve();
        document.head.appendChild(s);
      });
    }
    if (typeof showLoader === 'function') showLoader();

    const resp = await fetch('/api/stripe/create-checkout-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ priceId: 'price_1TfB4PAE7YDfnyYkNHE8Zs93' })
    });

    const data = await resp.json().catch(() => ({}));

    if (!resp.ok) {
      const errMsg = (data && data.error) ? String(data.error) : 'Failed to create Stripe session';
      if (errMsg.toLowerCase().includes('already')) {
        if (typeof hideLoader === 'function') hideLoader();
        showModal('You have already purchased Pixelit Plus!');
        return;
      }
      if (typeof hideLoader === 'function') hideLoader();
      showModal(errMsg);
      return;
    }

    if (data && data.url) {
      window.location.href = data.url;
      return;
    }
    if (typeof hideLoader === 'function') hideLoader();
    showModal('Failed to create Stripe session');
  } catch (err) {
    console.error('checkout error', err);
    if (typeof hideLoader === 'function') hideLoader();
    showModal('Checkout error');
  }
}

function showModal(message) {
  const modal = document.createElement("div");
  modal.style.cssText = `
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.6);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 10000;
  `;

  const box = document.createElement("div");
  box.style.cssText = `
    background-color: #6f057a;
    box-shadow: inset 0 -0.365vw #61056b, 3px 3px 15px rgba(0,0,0,0.6);
    padding: 20px;
    border-radius: 8px;
    text-align: center;
    min-width: 280px;
    color: white;
    font-family: Pixelify Sans;
    font-size: 18px;
  `;

  box.innerText = message;
  modal.appendChild(box);
  document.body.appendChild(modal);
  modal.onclick = () => modal.remove();
}