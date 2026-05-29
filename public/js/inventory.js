async function fetchInventory() {
  const res = await fetch('/api/inventory', {
    method: 'GET',
    credentials: 'include'
  });

  if (!res.ok) {
    return { items: [] };
  }

  try {
    return await res.json();
  } catch {
    return { items: [] };
  }
}

function ensureBoostersContainer() {
  let container = document.getElementById('boosters-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'boosters-container';
    container.style.marginLeft = '240px';
    container.style.color = 'white';
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = '10px';

    const main = document.querySelector('main');
    if (main) {
      main.appendChild(container);
    } else {
      document.body.appendChild(container);
    }
  }
  return container;
}

function renderBoosters(items) {
  const container = ensureBoostersContainer();
  container.innerHTML = '';

  if (!items || items.length === 0) {
    container.style.display = 'none';
    return;
  }

  container.style.display = 'flex';

  items.forEach((item) => {
    const card = document.createElement('div');
    card.className = 'booster-item';
    card.style.border = '1px solid rgba(255,255,255,0.25)';
    card.style.borderRadius = '12px';
    card.style.padding = '12px 14px';
    card.style.background = 'rgba(0,0,0,0.15)';

    const name = document.createElement('div');
    name.textContent = item.name;
    name.style.fontSize = '20px';
    name.style.fontWeight = 'bold';

    const code = document.createElement('div');
    code.textContent = item.code;
    code.style.opacity = '0.75';
    code.style.marginTop = '4px';

    const qty = document.createElement('div');
    qty.textContent = `Quantity: ${item.quantity}`;
    qty.style.marginTop = '6px';

    card.appendChild(name);
    card.appendChild(code);
    card.appendChild(qty);

    container.appendChild(card);
  });
}

document.addEventListener('DOMContentLoaded', async () => {
  const { items } = await fetchInventory();
  renderBoosters(items);
});

