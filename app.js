const STORAGE_KEY = "delicias_baiana_pdv_v1";
const SESSION_KEY = "delicias_baiana_session";
const CLOUD_KEY = "delicias_baiana_cloud_mirror";

const fmt = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

let session = JSON.parse(localStorage.getItem(SESSION_KEY) || "null");
let pdvCart = [];
let productPhotoData = "";
const DEFAULT_PRODUCTS = [
  { name: "Acaraje Tradicional", category: "Acaraje", price: 15, cost: 7 },
  { name: "Pirao de mandioca Baiano", category: "Pirao", price: 22, cost: 0 },
  { name: "Pirao de mandioca Nordestinho", category: "Pirao", price: 25, cost: 0 },
  { name: "Pirao Nordestino", category: "Pirao", price: 25, cost: 0 },
  { name: "Vatapa (200g)", category: "Encomendas", price: 35, cost: 0 },
  { name: "Quiaba (200g)", category: "Encomendas", price: 35, cost: 0 },
  { name: "Caruru (500g)", category: "Encomendas", price: 85, cost: 0 }
];
const DEFAULT_EXPENSES = [
  { description: "Quiabo (0,9 kg x R$11,41)", category: "compras", value: 10.27 },
  { description: "Mandioca (2,47 kg x R$3,75)", category: "compras", value: 9.26 },
  { description: "Cebola (2,14 kg x R$0,99)", category: "compras", value: 2.12 },
  { description: "Pimentao (0,36 kg x R$10,99)", category: "compras", value: 3.96 },
  { description: "Tomate (1,43 kg x R$12,90)", category: "compras", value: 18.45 },
  { description: "Margarinha (1 kg x R$7,49)", category: "compras", value: 7.49 },
  { description: "Ijo (0,306 kg x R$38,90)", category: "compras", value: 11.9 },
  { description: "Paleta (1,22 kg x R$36,90)", category: "compras", value: 45.02 },
  { description: "Calabresa (1,474 kg x R$25,90)", category: "compras", value: 38.18 },
  { description: "Bacon (0,8 kg x R$33,19)", category: "compras", value: 26.55 },
  { description: "Carne seca (0,928 kg x R$59,90)", category: "compras", value: 55.67 },
  { description: "Feijao fradinho (3 kg x R$12,99)", category: "compras", value: 38.97 },
  { description: "Calabresa (5 kg x R$18,40)", category: "compras", value: 92 },
  { description: "Bacon (0,948 kg x R$34,90)", category: "compras", value: 33.09 },
  { description: "Alho (1 kg x R$29,80)", category: "compras", value: 29.8 },
  { description: "Flocao (8 kg x R$2,49)", category: "compras", value: 19.92 },
  { description: "Amendoim (0,5 kg x R$17,25)", category: "compras", value: 8.63 },
  { description: "Dende (5 L x R$99,00)", category: "compras", value: 495 },
  { description: "Farinha (1,072 kg x R$7,50)", category: "compras", value: 8.04 },
  { description: "Tempero Baiano (0,184 kg x R$3,50)", category: "compras", value: 0.64 },
  { description: "Camarao seco Def. (0,336 kg x R$69,90)", category: "compras", value: 23.49 },
  { description: "Vasilha Cx Transp. 2,5L c/ tampa (4 x R$9,99)", category: "compras", value: 39.96 },
  { description: "Pote Transp. redondo 4L (1 x R$12,99)", category: "compras", value: 12.99 },
  { description: "Sacola e saquinho p/ Acaraje", category: "compras", value: 75 },
  { description: "Anuncio Meta Ads", category: "custos operacionais", value: 130 }
];

let state = loadState();
function loadState() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    return JSON.parse(saved);
  }

  const now = new Date().toISOString();
  return {
    users: [{ id: crypto.randomUUID(), name: "Administrador", username: "admin", password: "1234" }],
    products: DEFAULT_PRODUCTS.map((p) => ({
      id: crypto.randomUUID(),
      name: p.name,
      category: p.category,
      price: p.price,
      cost: p.cost,
      margin: p.price > 0 ? Number((((p.price - p.cost) / p.price) * 100).toFixed(2)) : 0,
      photo: ""
    })),
    sales: [],
    cashEntries: [],
    backups: [],
    settings: {
      businessName: "Delicias Baiana",
      theme: "light",
      autoBackupMinutes: 5,
      defaultExpensesImportedV1: false,
      createdAt: now,
      updatedAt: now
    }
  };
}

function saveState() {
  state.settings.updatedAt = new Date().toISOString();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function syncDefaultCatalog() {
  let changed = false;
  DEFAULT_PRODUCTS.forEach((def) => {
    const exists = state.products.some(
      (p) => p.name.toLowerCase() === def.name.toLowerCase() && p.category.toLowerCase() === def.category.toLowerCase()
    );
    if (!exists) {
      state.products.push({
        id: crypto.randomUUID(),
        name: def.name,
        category: def.category,
        price: def.price,
        cost: def.cost,
        margin: def.price > 0 ? Number((((def.price - def.cost) / def.price) * 100).toFixed(2)) : 0,
        photo: ""
      });
      changed = true;
    }
  });
  if (changed) saveState();
}

function syncDefaultExpenses() {
  if (state.settings.defaultExpensesImportedV1) return;

  const date = todayISO();
  const createdAt = new Date().toISOString();

  DEFAULT_EXPENSES.forEach((expense) => {
    state.cashEntries.unshift({
      id: crypto.randomUUID(),
      type: "saida",
      description: expense.description,
      category: expense.category,
      value: expense.value,
      date,
      paymentMethod: "Outros",
      notes: "Importado automaticamente da lista de despesas",
      createdAt
    });
  });

  state.settings.defaultExpensesImportedV1 = true;
  saveState();
}
function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function shortDateTime(iso) {
  return new Date(iso).toLocaleString("pt-BR");
}

function shortDate(isoOrDate) {
  const d = new Date(isoOrDate);
  return d.toLocaleDateString("pt-BR");
}

function isSameDay(a, b) {
  return new Date(a).toISOString().slice(0, 10) === new Date(b).toISOString().slice(0, 10);
}

function withinRange(iso, start, end) {
  const d = new Date(iso);
  const s = start ? new Date(start + "T00:00:00") : null;
  const e = end ? new Date(end + "T23:59:59") : null;
  if (s && d < s) return false;
  if (e && d > e) return false;
  return true;
}

function notify(message) {
  window.alert(message);
}

function setTheme(theme) {
  document.body.classList.toggle("dark", theme === "dark");
}

function updateOnlineStatus() {
  const status = document.getElementById("online-status");
if (!status) return;

status.textContent = navigator.onLine ? "Online" : "Offline";
  status.style.background = navigator.onLine ? "#a8f0c9" : "#f8e2a0";
}

function updateClock() {
  document.getElementById("datetime-now").textContent = new Date().toLocaleString("pt-BR");
}

function showApp() {
  const loginScreen = document.getElementById("login-screen");
  const app = document.getElementById("app");
  const currentUser = document.getElementById("current-user");

  if (!session) {
    loginScreen.classList.remove("hidden");
    app.classList.add("hidden");
    return;
  }

  loginScreen.classList.add("hidden");
  app.classList.remove("hidden");
  currentUser.textContent = session.name;
}

function bindAuth() {
  document.getElementById("login-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const username = document.getElementById("login-username").value.trim();
    const password = document.getElementById("login-password").value;
    const user = state.users.find((u) => u.username === username && u.password === password);
    const error = document.getElementById("login-error");
    if (!user) {
      error.textContent = "Usuario ou senha invalidos.";
      return;
    }
    session = { id: user.id, name: user.name, username: user.username };
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    error.textContent = "";
    showApp();
    renderAll();
  });

  document.getElementById("logout-btn").addEventListener("click", () => {
    session = null;
    localStorage.removeItem(SESSION_KEY);
    showApp();
  });
}

function bindNavigation() {
  const menu = document.getElementById("menu");
  menu.addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-view]");
    if (!btn) return;
    const view = btn.dataset.view;
    document.querySelectorAll(".menu-item").forEach((item) => item.classList.remove("active"));
    btn.classList.add("active");
    document.querySelectorAll(".view").forEach((v) => v.classList.remove("active"));
    document.getElementById(`view-${view}`).classList.add("active");
    document.getElementById("page-title").textContent = btn.textContent;

    if (view === "dashboard") renderDashboard();
    if (view === "pdv") renderPDV();
    if (view === "cashflow") renderCashflow();
    if (view === "products") renderProducts();
    if (view === "reports") renderReports();
    if (view === "closing") renderClosing();
    if (view === "settings") renderSettings();
  });
}

function bindPDV() {
  document.getElementById("pdv-product").addEventListener("change", (e) => {
    const product = state.products.find((p) => p.id === e.target.value);
    if (product) document.getElementById("pdv-unit-price").value = product.price.toFixed(2);
  });

  document.getElementById("pdv-add-item").addEventListener("click", () => {
    const productId = document.getElementById("pdv-product").value;
    const product = state.products.find((p) => p.id === productId);
    const qty = Number(document.getElementById("pdv-qty").value || 0);
    const unitPrice = Number(document.getElementById("pdv-unit-price").value || 0);

    if (!product || qty <= 0 || unitPrice < 0) {
      notify("Preencha produto, quantidade e valor corretamente.");
      return;
    }

    pdvCart.push({
      id: crypto.randomUUID(),
      productId: product.id,
      name: product.name,
      qty,
      unitPrice,
      total: qty * unitPrice,
      cost: Number(product.cost || 0)
    });

    document.getElementById("pdv-qty").value = "1";
    updatePDVSummary();
    renderPDVCart();
  });

  document.getElementById("pdv-cash-received").addEventListener("input", updatePDVSummary);
  document.getElementById("pdv-payment").addEventListener("change", updatePDVSummary);
  document.getElementById("pdv-delivery").addEventListener("change", () => {
    toggleDeliveryZone();
    updatePDVSummary();
  });
  document.getElementById("pdv-delivery-zone").addEventListener("change", updatePDVSummary);

  document.getElementById("pdv-finish-sale").addEventListener("click", () => {
    if (!pdvCart.length) {
      notify("Adicione itens no carrinho para finalizar a venda.");
      return;
    }

    const paymentMethod = document.getElementById("pdv-payment").value;
    const deliveryMethod = document.getElementById("pdv-delivery").value;
    const deliveryZone = deliveryMethod === "Delivery" ? document.getElementById("pdv-delivery-zone").value : "Retirada";
    const subtotal = pdvCart.reduce((sum, item) => sum + item.total, 0);
    const deliveryFee = getDeliveryFee(deliveryMethod, deliveryZone);
    const total = subtotal + deliveryFee;
    const cashReceived = Number(document.getElementById("pdv-cash-received").value || 0);
    const change = paymentMethod === "Dinheiro" ? Math.max(cashReceived - total, 0) : 0;

    if (paymentMethod === "Dinheiro" && cashReceived < total) {
      notify("Valor recebido insuficiente para pagamento em dinheiro.");
      return;
    }

    const sale = {
      id: crypto.randomUUID(),
      items: [...pdvCart],
      subtotal,
      deliveryFee,
      total,
      paymentMethod,
      deliveryMethod,
      deliveryZone,
      cashReceived,
      change,
      createdAt: new Date().toISOString(),
      seller: session?.name || "Usuario"
    };

    state.sales.unshift(sale);
    saveState();

    printReceipt(sale);

    pdvCart = [];
    document.getElementById("pdv-cash-received").value = "";
    updatePDVSummary();
    renderPDVCart();
    renderDashboard();
    renderReports();
    renderClosing();
    notify("Venda finalizada com sucesso.");
  });
}

function renderPDV() {
  const select = document.getElementById("pdv-product");
  const quick = document.getElementById("quick-products");

  select.innerHTML = "";
  state.products.forEach((p) => {
    const option = document.createElement("option");
    option.value = p.id;
    option.textContent = `${p.name} (${fmt.format(p.price)})`;
    select.appendChild(option);
  });

  const first = state.products[0];
  if (first) {
    select.value = first.id;
    document.getElementById("pdv-unit-price").value = Number(first.price).toFixed(2);
  }

  quick.innerHTML = "";
  state.products.forEach((p) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.textContent = `${p.name} - ${fmt.format(p.price)}`;
    btn.addEventListener("click", () => {
      pdvCart.push({
        id: crypto.randomUUID(),
        productId: p.id,
        name: p.name,
        qty: 1,
        unitPrice: Number(p.price),
        total: Number(p.price),
        cost: Number(p.cost || 0)
      });
      renderPDVCart();
      updatePDVSummary();
    });
    quick.appendChild(btn);
  });

  toggleDeliveryZone();
  renderPDVCart();
  updatePDVSummary();
}

function renderPDVCart() {
  const body = document.getElementById("pdv-cart-body");
  body.innerHTML = "";

  pdvCart.forEach((item) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${item.name}</td>
      <td>${item.qty}</td>
      <td>${fmt.format(item.unitPrice)}</td>
      <td>${fmt.format(item.total)}</td>
      <td><button class="btn btn-secondary" data-remove="${item.id}">X</button></td>
    `;
    body.appendChild(tr);
  });

  body.querySelectorAll("button[data-remove]").forEach((btn) => {
    btn.addEventListener("click", () => {
      pdvCart = pdvCart.filter((item) => item.id !== btn.dataset.remove);
      renderPDVCart();
      updatePDVSummary();
    });
  });
}

function getDeliveryFee(deliveryMethod, deliveryZone) {
  if (deliveryMethod === "Retirada") return 0;
  if (deliveryZone === "Outros") return 15;
  return 8;
}

function toggleDeliveryZone() {
  const deliveryMethod = document.getElementById("pdv-delivery")?.value || "Delivery";
  const row = document.getElementById("pdv-delivery-zone-row");
  if (!row) return;
  row.style.display = deliveryMethod === "Delivery" ? "grid" : "none";
}

function updatePDVSummary() {
  const subtotal = pdvCart.reduce((sum, item) => sum + item.total, 0);
  const deliveryMethod = document.getElementById("pdv-delivery")?.value || "Delivery";
  const deliveryZone = document.getElementById("pdv-delivery-zone")?.value || "Cidade";
  const deliveryFee = getDeliveryFee(deliveryMethod, deliveryZone);
  const total = subtotal + deliveryFee;
  const paymentMethod = document.getElementById("pdv-payment")?.value || "Dinheiro";
  const cashReceived = Number(document.getElementById("pdv-cash-received")?.value || 0);
  const change = paymentMethod === "Dinheiro" ? Math.max(cashReceived - total, 0) : 0;

  document.getElementById("pdv-subtotal").textContent = fmt.format(subtotal);
  document.getElementById("pdv-delivery-fee").textContent = fmt.format(deliveryFee);
  document.getElementById("pdv-total").textContent = fmt.format(total);
  document.getElementById("pdv-change").value = fmt.format(change);
}

function printReceipt(sale) {
  const receipt = `
    <html>
      <head>
        <title>Comprovante ${sale.id}</title>
        <style>
          body{font-family: Arial,sans-serif;padding:18px}
          h2{margin:0 0 8px}
          table{width:100%;border-collapse:collapse;margin-top:12px}
          td,th{padding:6px;border-bottom:1px solid #ddd;text-align:left}
        </style>
      </head>
      <body>
        <h2>${state.settings.businessName}</h2>
        <p><strong>Comprovante simples</strong></p>
        <p>Data/Hora: ${shortDateTime(sale.createdAt)}</p>
        <p>Forma de pagamento: ${sale.paymentMethod}</p>
        <p>Forma de entrega: ${sale.deliveryMethod}${sale.deliveryMethod === "Delivery" ? ` - ${sale.deliveryZone}` : ""}</p>
        <p>Taxa de entrega: ${fmt.format(sale.deliveryFee || 0)}</p>
        <table>
          <thead><tr><th>Produto</th><th>Qtd</th><th>Unit.</th><th>Total</th></tr></thead>
          <tbody>
            ${sale.items.map((i) => `<tr><td>${i.name}</td><td>${i.qty}</td><td>${fmt.format(i.unitPrice)}</td><td>${fmt.format(i.total)}</td></tr>`).join("")}
          </tbody>
        </table>
        <p>Subtotal: ${fmt.format(sale.subtotal)}</p>
        <h3>Total: ${fmt.format(sale.total)}</h3>
        <p>Valor recebido: ${fmt.format(sale.cashReceived || 0)}</p>
        <p>Troco: ${fmt.format(sale.change || 0)}</p>
      </body>
    </html>
  `;

  const win = window.open("", "_blank");
  if (!win) return;
  win.document.write(receipt);
  win.document.close();
  win.focus();
  win.print();
}

function bindCashflow() {
  document.getElementById("cash-date").value = todayISO();

  document.getElementById("cashflow-form").addEventListener("submit", (e) => {
    e.preventDefault();

    const entry = {
      id: crypto.randomUUID(),
      type: document.getElementById("cash-type").value,
      description: document.getElementById("cash-description").value.trim(),
      category: document.getElementById("cash-category").value,
      value: Number(document.getElementById("cash-value").value || 0),
      date: document.getElementById("cash-date").value,
      paymentMethod: document.getElementById("cash-payment").value,
      notes: document.getElementById("cash-notes").value.trim(),
      createdAt: new Date().toISOString()
    };

    if (!entry.description || entry.value <= 0 || !entry.date) {
      notify("Preencha os campos obrigatorios de fluxo de caixa.");
      return;
    }

    state.cashEntries.unshift(entry);
    saveState();

    e.target.reset();
    document.getElementById("cash-date").value = todayISO();
    renderCashflow();
    renderDashboard();
    renderClosing();
    notify("Lancamento salvo com sucesso.");
  });
}

function renderCashflow() {
  const body = document.getElementById("cashflow-body");
  body.innerHTML = "";
  state.cashEntries.slice(0, 120).forEach((entry) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${shortDate(entry.date)}</td>
      <td>${entry.type}</td>
      <td>${entry.category}</td>
      <td>${entry.description}</td>
      <td>${fmt.format(entry.value)}</td>
    `;
    body.appendChild(tr);
  });
}

function bindProducts() {
  const photoInput = document.getElementById("product-photo");
  photoInput.addEventListener("change", () => {
    const file = photoInput.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      productPhotoData = reader.result;
      const preview = document.getElementById("product-preview");
      preview.src = String(productPhotoData);
      preview.classList.remove("hidden");
    };
    reader.readAsDataURL(file);
  });

  const price = document.getElementById("product-price");
  const cost = document.getElementById("product-cost");

  [price, cost].forEach((el) => {
    el.addEventListener("input", () => {
      const p = Number(price.value || 0);
      const c = Number(cost.value || 0);
      const margin = p > 0 ? ((p - c) / p) * 100 : 0;
      document.getElementById("product-margin").value = `${margin.toFixed(2)}%`;
    });
  });

  document.getElementById("product-form").addEventListener("submit", (e) => {
    e.preventDefault();

    const id = document.getElementById("product-id").value;
    const name = document.getElementById("product-name").value.trim();
    const category = document.getElementById("product-category").value.trim();
    const productPrice = Number(document.getElementById("product-price").value || 0);
    const productCost = Number(document.getElementById("product-cost").value || 0);
    const margin = productPrice > 0 ? ((productPrice - productCost) / productPrice) * 100 : 0;

    if (!name || !category || productPrice <= 0) {
      notify("Preencha nome, categoria e preco do produto.");
      return;
    }

    if (id) {
      const idx = state.products.findIndex((p) => p.id === id);
      if (idx >= 0) {
        const prev = state.products[idx];
        state.products[idx] = {
          ...prev,
          name,
          category,
          price: productPrice,
          cost: productCost,
          margin: Number(margin.toFixed(2)),
          photo: productPhotoData || prev.photo || ""
        };
      }
    } else {
      state.products.unshift({
        id: crypto.randomUUID(),
        name,
        category,
        price: productPrice,
        cost: productCost,
        margin: Number(margin.toFixed(2)),
        photo: productPhotoData || ""
      });
    }

    saveState();
    clearProductForm();
    renderProducts();
    renderPDV();
    renderDashboard();
    notify("Produto salvo com sucesso.");
  });
}
function clearProductForm() {
  document.getElementById("product-form").reset();
  document.getElementById("product-id").value = "";
  document.getElementById("product-margin").value = "";
  const preview = document.getElementById("product-preview");
  preview.classList.add("hidden");
  preview.src = "";
  productPhotoData = "";
}

function renderProducts() {
  const body = document.getElementById("products-body");
  body.innerHTML = "";

  state.products.forEach((product) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${product.photo ? `<img src="${product.photo}" alt="${product.name}" width="48" height="48" style="object-fit:cover;border-radius:8px">` : "-"}</td>
      <td>${product.name}</td>
      <td>${product.category}</td>
      <td>${fmt.format(product.price)}</td>
      <td>${fmt.format(product.cost)}</td>
      <td>${product.margin.toFixed(2)}%</td>
      <td>
        <button class="btn btn-secondary" data-edit="${product.id}">Editar</button>
        <button class="btn btn-secondary" data-delete="${product.id}">Excluir</button>
      </td>
    `;
    body.appendChild(tr);
  });

  body.querySelectorAll("button[data-edit]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const product = state.products.find((p) => p.id === btn.dataset.edit);
      if (!product) return;
      document.getElementById("product-id").value = product.id;
      document.getElementById("product-name").value = product.name;
      document.getElementById("product-category").value = product.category;
      document.getElementById("product-price").value = Number(product.price).toFixed(2);
      document.getElementById("product-cost").value = Number(product.cost).toFixed(2);
      document.getElementById("product-margin").value = `${Number(product.margin).toFixed(2)}%`;
      productPhotoData = product.photo || "";
      const preview = document.getElementById("product-preview");
      if (product.photo) {
        preview.src = product.photo;
        preview.classList.remove("hidden");
      } else {
        preview.classList.add("hidden");
      }
    });
  });

  body.querySelectorAll("button[data-delete]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const hasSales = state.sales.some((sale) => sale.items.some((item) => item.productId === btn.dataset.delete));
      if (hasSales && !confirm("Este produto ja possui vendas registradas. Deseja excluir mesmo assim?")) return;
      state.products = state.products.filter((p) => p.id !== btn.dataset.delete);
      saveState();
      renderProducts();
      renderPDV();
    });
  });
}

function salesInPeriod(days) {
  const now = new Date();
  const from = new Date(now);
  from.setDate(now.getDate() - (days - 1));
  return state.sales.filter((sale) => new Date(sale.createdAt) >= from);
}

function renderDashboard() {
  const today = state.sales.filter((s) => isSameDay(s.createdAt, new Date()));
  const week = salesInPeriod(7);
  const month = salesInPeriod(30);

  const dayRevenue = today.reduce((sum, s) => sum + s.total, 0);
  const weekRevenue = week.reduce((sum, s) => sum + s.total, 0);
  const monthRevenue = month.reduce((sum, s) => sum + s.total, 0);

  const expenses = state.cashEntries
    .filter((entry) => entry.type === "saida")
    .reduce((sum, entry) => sum + entry.value, 0);

  const soldCosts = state.sales.reduce((sum, sale) => {
    const saleCost = sale.items.reduce((acc, i) => acc + (Number(i.cost || 0) * Number(i.qty || 0)), 0);
    return sum + saleCost;
  }, 0);

  const estimatedProfit = state.sales.reduce((sum, s) => sum + s.total, 0) - soldCosts - expenses;

  document.getElementById("metric-day").textContent = fmt.format(dayRevenue);
  document.getElementById("metric-week").textContent = fmt.format(weekRevenue);
  document.getElementById("metric-month").textContent = fmt.format(monthRevenue);
  document.getElementById("metric-profit").textContent = fmt.format(estimatedProfit);
  document.getElementById("metric-expenses").textContent = fmt.format(expenses);

  drawDashboardCharts();
}

function buildSalesByDay(days) {
  const labels = [];
  const values = [];
  for (let i = days - 1; i >= 0; i -= 1) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dayKey = d.toISOString().slice(0, 10);
    labels.push(d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }));
    const total = state.sales
      .filter((sale) => sale.createdAt.slice(0, 10) === dayKey)
      .reduce((sum, sale) => sum + sale.total, 0);
    values.push(total);
  }
  return { labels, values };
}

function drawBarChart(canvasId, labels, values) {
  const canvas = document.getElementById(canvasId);
  const ctx = canvas.getContext("2d");
  const w = canvas.width;
  const h = canvas.height;
  ctx.clearRect(0, 0, w, h);

  const max = Math.max(...values, 1);
  const barWidth = (w - 40) / Math.max(values.length, 1);

  ctx.fillStyle = "#5a0001";
  ctx.font = "11px sans-serif";

  values.forEach((v, i) => {
    const x = 20 + i * barWidth + 8;
    const barH = (v / max) * (h - 50);
    const y = h - barH - 24;
    ctx.fillStyle = "#770001";
    ctx.fillRect(x, y, barWidth - 16, barH);
    ctx.fillStyle = "#5a0001";
    ctx.fillText(labels[i], x, h - 8);
  });
}

function drawPieChart(canvasId, entries) {
  const canvas = document.getElementById(canvasId);
  const ctx = canvas.getContext("2d");
  const w = canvas.width;
  const h = canvas.height;
  ctx.clearRect(0, 0, w, h);

  const total = entries.reduce((sum, e) => sum + e.value, 0);
  const colors = ["#770001", "#f2cb5d", "#ff7f50", "#ad343e", "#74491c"];
  let start = -Math.PI / 2;

  entries.forEach((entry, idx) => {
    const slice = total > 0 ? (entry.value / total) * Math.PI * 2 : 0;
    ctx.beginPath();
    ctx.moveTo(w / 2, h / 2);
    ctx.fillStyle = colors[idx % colors.length];
    ctx.arc(w / 2, h / 2, Math.min(w, h) / 3, start, start + slice);
    ctx.fill();
    start += slice;
  });

  ctx.font = "12px sans-serif";
  ctx.fillStyle = "#3f2612";
  entries.forEach((entry, idx) => {
    ctx.fillStyle = colors[idx % colors.length];
    ctx.fillRect(12, 12 + idx * 18, 12, 12);
    ctx.fillStyle = "#3f2612";
    ctx.fillText(`${entry.label}: ${fmt.format(entry.value)}`, 30, 22 + idx * 18);
  });
}

function drawLineChart(canvasId, labels, values) {
  const canvas = document.getElementById(canvasId);
  const ctx = canvas.getContext("2d");
  const w = canvas.width;
  const h = canvas.height;
  ctx.clearRect(0, 0, w, h);

  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const range = Math.max(max - min, 1);

  ctx.strokeStyle = "#770001";
  ctx.lineWidth = 2;
  ctx.beginPath();

  values.forEach((v, i) => {
    const x = 20 + (i / Math.max(values.length - 1, 1)) * (w - 40);
    const y = h - 20 - ((v - min) / range) * (h - 40);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });

  ctx.stroke();

  ctx.fillStyle = "#5a0001";
  ctx.font = "10px sans-serif";
  [0, Math.floor(labels.length / 2), labels.length - 1].forEach((idx) => {
    if (idx >= 0 && labels[idx]) ctx.fillText(labels[idx], 20 + (idx / Math.max(labels.length - 1, 1)) * (w - 40), h - 4);
  });
}

function drawDashboardCharts() {
  const week = buildSalesByDay(7);
  drawBarChart("sales-bar-chart", week.labels, week.values);

  const paymentMap = new Map();
  state.sales.forEach((sale) => {
    paymentMap.set(sale.paymentMethod, (paymentMap.get(sale.paymentMethod) || 0) + sale.total);
  });
  const paymentEntries = Array.from(paymentMap.entries()).map(([label, value]) => ({ label, value }));
  drawPieChart("payment-pie-chart", paymentEntries.length ? paymentEntries : [{ label: "Sem vendas", value: 1 }]);

  const month = buildSalesByDay(30);
  drawLineChart("revenue-line-chart", month.labels, month.values);
}

function buildReportData(start, end) {
  const sales = state.sales.filter((sale) => withinRange(sale.createdAt, start, end));
  const expenses = state.cashEntries.filter((entry) => entry.type === "saida" && withinRange(entry.date, start, end));

  const byDay = new Map();
  const byProduct = new Map();
  const byPayment = new Map();

  sales.forEach((sale) => {
    const dayKey = sale.createdAt.slice(0, 10);
    byDay.set(dayKey, (byDay.get(dayKey) || 0) + sale.total);

    byPayment.set(sale.paymentMethod, (byPayment.get(sale.paymentMethod) || 0) + sale.total);

    sale.items.forEach((item) => {
      byProduct.set(item.name, (byProduct.get(item.name) || 0) + item.total);
    });
  });

  const expenseByDay = expenses.reduce((acc, entry) => {
    const key = entry.date;
    acc[key] = (acc[key] || 0) + entry.value;
    return acc;
  }, {});

  const dailyProfit = Array.from(byDay.entries()).map(([date, revenue]) => ({
    date,
    revenue,
    expenses: expenseByDay[date] || 0,
    profit: revenue - (expenseByDay[date] || 0)
  }));

  return {
    sales,
    byDay: Array.from(byDay.entries()),
    byProduct: Array.from(byProduct.entries()),
    byPayment: Array.from(byPayment.entries()),
    dailyProfit
  };
}

function renderReports() {
  const output = document.getElementById("report-output");
  const start = document.getElementById("report-start").value;
  const end = document.getElementById("report-end").value;
  const data = buildReportData(start, end);

  output.innerHTML = `
    <h5>Vendas por dia</h5>
    ${renderMiniTable(["Data", "Valor"], data.byDay.map(([d, v]) => [shortDate(d), fmt.format(v)]))}
    <h5>Vendas por produto</h5>
    ${renderMiniTable(["Produto", "Valor"], data.byProduct.map(([p, v]) => [p, fmt.format(v)]))}
    <h5>Vendas por forma de pagamento</h5>
    ${renderMiniTable(["Forma", "Valor"], data.byPayment.map(([p, v]) => [p, fmt.format(v)]))}
    <h5>Lucro diario</h5>
    ${renderMiniTable(["Data", "Receita", "Despesa", "Lucro"], data.dailyProfit.map((r) => [shortDate(r.date), fmt.format(r.revenue), fmt.format(r.expenses), fmt.format(r.profit)]))}
    <h5>Historico completo de vendas</h5>
    ${renderMiniTable(["Data", "Itens", "Pagamento", "Entrega", "Total"], data.sales.map((sale) => [shortDateTime(sale.createdAt), sale.items.map((i) => `${i.name} (${i.qty})`).join(", "), sale.paymentMethod, sale.deliveryMethod, fmt.format(sale.total)]))}
  `;
}
function renderMiniTable(headers, rows) {
  if (!rows.length) {
    return "<p>Sem dados no periodo selecionado.</p>";
  }
  return `
    <div class="table-scroll">
      <table>
        <thead>
          <tr>${headers.map((h) => `<th>${h}</th>`).join("")}</tr>
        </thead>
        <tbody>
          ${rows.map((r) => `<tr>${r.map((c) => `<td>${c}</td>`).join("")}</tr>`).join("")}
        </tbody>
      </table>
    </div>
  `;
}

function bindReports() {
  document.getElementById("report-generate").addEventListener("click", renderReports);

  document.getElementById("report-export-excel").addEventListener("click", () => {
    const start = document.getElementById("report-start").value;
    const end = document.getElementById("report-end").value;
    const data = buildReportData(start, end);

    const lines = [];
    lines.push(["Relatorio de Vendas", shortDate(new Date())].join(";"));
    lines.push("");
    lines.push("Vendas por Dia");
    lines.push("Data;Valor");
    data.byDay.forEach(([d, v]) => lines.push(`${shortDate(d)};${v.toFixed(2)}`));
    lines.push("");
    lines.push("Vendas por Produto");
    lines.push("Produto;Valor");
    data.byProduct.forEach(([p, v]) => lines.push(`${p};${v.toFixed(2)}`));
    lines.push("");
    lines.push("Vendas por Forma de Pagamento");
    lines.push("Forma;Valor");
    data.byPayment.forEach(([p, v]) => lines.push(`${p};${v.toFixed(2)}`));

    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
    downloadBlob(blob, `relatorio_financeiro_${todayISO()}.csv`);
  });

  document.getElementById("report-export-pdf").addEventListener("click", () => {
    const output = document.getElementById("report-output").innerHTML;
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(`
      <html>
        <head>
          <title>Relatorios Financeiros</title>
          <style>
            body{font-family:Arial,sans-serif;padding:20px}
            table{width:100%;border-collapse:collapse}
            th,td{border:1px solid #ddd;padding:6px}
          </style>
        </head>
        <body>
          <h1>${state.settings.businessName}</h1>
          <h3>Relatorios Financeiros</h3>
          ${output}
        </body>
      </html>
    `);
    win.document.close();
    win.print();
  });
}

function renderClosing() {
  const today = todayISO();
  const todaySales = state.sales.filter((sale) => sale.createdAt.slice(0, 10) === today);
  const todayExpenses = state.cashEntries
    .filter((entry) => entry.type === "saida" && entry.date === today)
    .reduce((sum, entry) => sum + entry.value, 0);

  const sold = todaySales.reduce((sum, sale) => sum + sale.total, 0);
  const cash = todaySales.filter((s) => s.paymentMethod === "Dinheiro").reduce((sum, s) => sum + s.total, 0);
  const pix = todaySales.filter((s) => s.paymentMethod === "PIX").reduce((sum, s) => sum + s.total, 0);
  const card = todaySales
    .filter((s) => s.paymentMethod === "Cartao de debito" || s.paymentMethod === "Cartao de credito")
    .reduce((sum, s) => sum + s.total, 0);

  document.getElementById("closing-date").textContent = shortDate(today);
  document.getElementById("closing-sold").textContent = fmt.format(sold);
  document.getElementById("closing-cash").textContent = fmt.format(cash);
  document.getElementById("closing-card").textContent = fmt.format(card);
  document.getElementById("closing-pix").textContent = fmt.format(pix);
  document.getElementById("closing-expenses").textContent = fmt.format(todayExpenses);
  document.getElementById("closing-profit").textContent = fmt.format(sold - todayExpenses);
}

function bindClosing() {
  document.getElementById("closing-print").addEventListener("click", () => {
    const html = document.getElementById("view-closing").innerHTML;
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(`<html><head><title>Fechamento</title></head><body>${html}</body></html>`);
    win.document.close();
    win.print();
  });
}

function runBackup(reason = "automatico") {
  const snapshot = {
    id: crypto.randomUUID(),
    reason,
    createdAt: new Date().toISOString(),
    data: state
  };
  state.backups.unshift(snapshot);
  state.backups = state.backups.slice(0, 20);
  saveState();
  return snapshot;
}

// BACKUP NA NUVEM
async function backupCloud() {

 const data = JSON.parse(localStorage.getItem(STORAGE_KEY));

 await setDoc(doc(db, "backup", "principal"), {
   data: data,
   updated: new Date()
 });

 alert("Backup na nuvem realizado!");

}

// RESTAURAR BACKUP
async function restoreCloud() {

 const docSnap = await getDoc(doc(db, "backup", "principal"));

 if (docSnap.exists()) {

   localStorage.setItem(STORAGE_KEY, JSON.stringify(docSnap.data().data));

   alert("Backup restaurado!");
   location.reload();

 }

}
function bindSettings() {
  document.getElementById("save-settings").addEventListener("click", () => {
    state.settings.businessName = document.getElementById("settings-business-name").value.trim() || "Delicia Baiana";
    state.settings.theme = document.getElementById("settings-theme").value;
    setTheme(state.settings.theme);
    saveState();
    notify("Configuracoes salvas.");
  });

  document.getElementById("backup-now").addEventListener("click", () => {
    runBackup("manual");
    notify("Backup gerado com sucesso.");
  });

  document.getElementById("download-backup").addEventListener("click", () => {
    const payload = JSON.stringify({ exportedAt: new Date().toISOString(), state }, null, 2);
    const blob = new Blob([payload], { type: "application/json" });
    downloadBlob(blob, `backup_delicia_baiana_${todayISO()}.json`);
  });

  document.getElementById("restore-backup").addEventListener("change", (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result));
        if (!parsed.state) throw new Error("Formato invalido");
        state = parsed.state;
        saveState();
        renderAll();
        notify("Backup restaurado com sucesso.");
      } catch {
        notify("Nao foi possivel restaurar o backup.");
      }
    };
    reader.readAsText(file);
  });

  document.getElementById("cloud-sync-up").addEventListener("click", () => {
    localStorage.setItem(CLOUD_KEY, JSON.stringify({ syncedAt: new Date().toISOString(), state }));
    notify("Dados enviados para nuvem (espelho local).");
  });

  document.getElementById("cloud-sync-down").addEventListener("click", () => {
    const cloud = localStorage.getItem(CLOUD_KEY);
    if (!cloud) {
      notify("Nenhum dado encontrado na nuvem.");
      return;
    }
    const parsed = JSON.parse(cloud);
    state = parsed.state;
    saveState();
    renderAll();
    notify("Dados baixados da nuvem com sucesso.");
  });

  document.getElementById("user-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const name = document.getElementById("user-name").value.trim();
    const username = document.getElementById("user-username").value.trim();
    const password = document.getElementById("user-password").value;
    if (!name || !username || !password) {
      notify("Preencha nome, usuario e senha.");
      return;
    }
    if (state.users.some((u) => u.username === username)) {
      notify("Este usuario ja existe.");
      return;
    }
    state.users.push({ id: crypto.randomUUID(), name, username, password });
    saveState();
    e.target.reset();
    renderUsers();
    notify("Usuario adicionado.");
  });
}

function renderUsers() {
  const body = document.getElementById("users-body");
  body.innerHTML = "";
  state.users.forEach((user) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${user.name}</td><td>${user.username}</td>`;
    body.appendChild(tr);
  });
}

function renderSettings() {
  document.getElementById("settings-business-name").value = state.settings.businessName || "Delicia Baiana";
  document.getElementById("settings-theme").value = state.settings.theme || "light";
  renderUsers();
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function renderAll() {
  setTheme(state.settings.theme || "light");
  renderDashboard();
  renderPDV();
  renderCashflow();
  renderProducts();
  renderReports();
  renderClosing();
  renderSettings();
}

function startAutoBackup() {
  const everyMs = Math.max(Number(state.settings.autoBackupMinutes || 5), 1) * 60 * 1000;
  setInterval(() => {
    runBackup("automatico");
  }, everyMs);
}

function init() {
  bindAuth();
  bindNavigation();
  bindPDV();
  bindCashflow();
  bindProducts();
  bindReports();
  bindClosing();
  bindSettings();

  syncDefaultCatalog();
  syncDefaultExpenses();

  updateClock();
  updateOnlineStatus();
  setInterval(updateClock, 1000);
  
  window.addEventListener("online", updateOnlineStatus);
  window.addEventListener("offline", updateOnlineStatus);

  showApp();
  if (session) renderAll();

  startAutoBackup();

if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("./sw.js")
      .then(() => console.log("Service Worker registrado"))
      .catch((err) => console.log("Erro:", err));
  }

// MENU LATERAL

const menuBtn = document.getElementById("menuBtn");
const closeMenu = document.getElementById("closeMenu");
const menuOverlay = document.getElementById("menuOverlay");
const sideMenu = document.getElementById("sideMenu");

function abrirMenu(){
  sideMenu.classList.add("active");
  menuOverlay.classList.add("active");
}

function fecharMenu(){
  sideMenu.classList.remove("active");
  menuOverlay.classList.remove("active");
}

menuBtn.addEventListener("click", abrirMenu);
closeMenu.addEventListener("click", fecharMenu);
menuOverlay.addEventListener("click", fecharMenu);

}
 function showPage(page){

  // esconder todas as telas
  document.querySelectorAll(".view").forEach(v=>{
    v.classList.remove("active");
  });

  // mostrar tela selecionada
  const view = document.getElementById("view-" + page);
  if(view) view.classList.add("active");

  // atualizar título
  const title = document.getElementById("page-title");
  if(title) title.textContent = page;

  // fechar menu
  sideMenu.classList.remove("active");
  menuOverlay.classList.remove("active");

} 
init();












