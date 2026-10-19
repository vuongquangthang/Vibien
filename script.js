const header = document.querySelector("[data-header]");
const menuToggle = document.querySelector(".menu-toggle");
const nav = document.querySelector(".main-nav");
const toast = document.querySelector("[data-toast]");
const orderForm = document.querySelector("[data-order-form]");
const formStatus = document.querySelector("[data-form-status]");
const drawer = document.querySelector("[data-cart-drawer]");
const backdrop = document.querySelector(".drawer-backdrop");
const modal = document.querySelector("[data-order-modal]");
const countdown = document.querySelector("[data-countdown]");
const productModal = document.querySelector("[data-product-modal]");
const productModalAdd = document.querySelector("[data-product-modal-add]");

const products = [
  { id: 1, name: "Ruốc tôm", ingredient: "tôm", description: "Thơm bùi, ngọt đậm từ tôm biển tươi, phù hợp dùng cùng cháo, cơm nóng hoặc bánh mì." },
  { id: 2, name: "Ruốc hàu", ingredient: "hàu", description: "Béo bùi, thơm ngậy vị biển, bổ sung dưỡng chất cho bữa ăn của cả gia đình." },
  { id: 3, name: "Ruốc bề bề", ingredient: "bề bề", description: "Sợi bông dai ngọt từ bề bề tươi tự nhiên, đậm đà mà không ngấy." },
  { id: 4, name: "Ruốc cá song", ingredient: "cá song", description: "Thịt cá chắc, ngọt bùi, là lựa chọn giàu đạm và Omega-3 cho bữa ăn nhanh." }
];

let cart = [];
let selectedProductId = null;

const formatVND = (value) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(value);

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("visible");
  window.setTimeout(() => toast.classList.remove("visible"), 2800);
}

function openCart() {
  drawer.classList.add("open");
  drawer.setAttribute("aria-hidden", "false");
  backdrop.classList.add("visible");
  document.body.classList.add("drawer-open");
}

function closeCart() {
  drawer.classList.remove("open");
  drawer.setAttribute("aria-hidden", "true");
  backdrop.classList.remove("visible");
  document.body.classList.remove("drawer-open");
}

function cartTotals() {
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  const shipping = subtotal === 0 || subtotal >= 500000 ? 0 : 30000;
  return { subtotal, shipping, total: subtotal + shipping, count: cart.reduce((sum, item) => sum + item.qty, 0) };
}

function renderCart() {
  const list = document.querySelector("[data-cart-list]");
  const totals = cartTotals();
  document.querySelector("[data-cart-count]").textContent = totals.count;
  document.querySelector("[data-cart-subtotal]").textContent = formatVND(totals.subtotal);
  document.querySelector("[data-cart-shipping]").textContent =
    totals.shipping === 0 ? "Miễn phí" : formatVND(totals.shipping);
  document.querySelector("[data-cart-total]").textContent = formatVND(totals.total);

  if (!cart.length) {
    list.innerHTML = `<div class="cart-empty">Giỏ hàng đang trống.<br />Hãy chọn một món quà từ biển.</div>`;
  } else {
    list.innerHTML = cart.map((item) => `
      <div class="cart-item">
        <div>
          <strong>${item.name}</strong>
          <small>${item.variant} · ${formatVND(item.price)}</small>
        </div>
        <div class="cart-item-actions">
          <button type="button" data-cart-change="${item.key}" data-delta="-1">−</button>
          <span>${item.qty}</span>
          <button type="button" data-cart-change="${item.key}" data-delta="1">+</button>
          <b>${formatVND(item.price * item.qty)}</b>
        </div>
      </div>
    `).join("");
  }

  document.querySelector("[data-checkout-summary]").innerHTML = `
    <div><span>${totals.count} sản phẩm trong giỏ</span><b>${formatVND(totals.total)}</b></div>
    <small>${totals.shipping === 0 && totals.subtotal > 0 ? "Đơn hàng được miễn phí vận chuyển." : "Miễn phí vận chuyển cho đơn từ 500.000đ."}</small>
  `;
}

function addToCart(productId) {
  const product = products.find((item) => item.id === productId);
  if (!product) return;
  const button = document.querySelector(`[data-product-id="${productId}"]`);
  const variant = button?.closest(".product-card")?.querySelector("[data-product-variant]")?.value || "50";
  const price = variant === "100" ? 299000 : 199000;
  const itemKey = `${productId}-${variant}`;
  const existing = cart.find((item) => item.key === itemKey);
  if (existing) existing.qty += 1;
  else cart.push({
    ...product,
    key: itemKey,
    variant: `${variant}% ${product.ingredient} · Hộp 200g`,
    price,
    qty: 1
  });
  renderCart();
  showToast(`Đã thêm "${product.name}" vào giỏ hàng.`);
}

function openProductModal(productId) {
  const product = products.find((item) => item.id === productId);
  if (!product) return;
  selectedProductId = productId;
  document.querySelector("[data-product-modal-name]").textContent = product.name;
  document.querySelector("[data-product-modal-description]").textContent = product.description;
  const image = document.querySelector("[data-product-modal-image]");
  image.className = `product-modal-image product-image-${productId}`;
  productModal.classList.add("open");
  productModal.setAttribute("aria-hidden", "false");
}

function closeProductModal() {
  productModal.classList.remove("open");
  productModal.setAttribute("aria-hidden", "true");
  selectedProductId = null;
}

function addModalProductToCart() {
  if (!selectedProductId) return;
  const variant = document.querySelector("[data-product-modal-variant]").value;
  const cardSelect = document.querySelector(`[data-product-id="${selectedProductId}"]`)
    ?.closest(".product-card")
    ?.querySelector("[data-product-variant]");
  if (cardSelect) cardSelect.value = variant;
  addToCart(selectedProductId);
  closeProductModal();
}

function changeCartQty(productId, delta) {
  const item = cart.find((entry) => entry.key === productId || entry.id === productId);
  if (!item) return;
  item.qty += delta;
  if (item.qty <= 0) cart = cart.filter((entry) => entry.key !== item.key);
  renderCart();
}

function scrollToContact() {
  closeCart();
  document.querySelector("#contact").scrollIntoView({ behavior: "smooth" });
}

function submitOrder(event) {
  event.preventDefault();
  if (!cart.length) {
    showToast("Vui lòng chọn ít nhất một sản phẩm trước khi đặt hàng.");
    openCart();
    return;
  }
  const formData = new FormData(orderForm);
  const name = String(formData.get("name")).trim();
  const address = String(formData.get("address")).trim();
  const totals = cartTotals();
  document.querySelector("[data-modal-name]").textContent = name || "bạn";
  document.querySelector("[data-modal-summary]").innerHTML = `
    <div><span>Mã đơn hàng</span><b>#VB${Math.floor(1000 + Math.random() * 9000)}</b></div>
    <div><span>Tổng thanh toán COD</span><b>${formatVND(totals.total)}</b></div>
    <div><span>Giao đến</span><b>${address}</b></div>
  `;
  modal.classList.add("open");
  formStatus.textContent = "";
  cart = [];
  renderCart();
  orderForm.reset();
}

window.addEventListener("scroll", () => {
  header.classList.toggle("scrolled", window.scrollY > 40);
});

menuToggle.addEventListener("click", () => {
  const isOpen = nav.classList.toggle("open");
  menuToggle.setAttribute("aria-expanded", String(isOpen));
});

nav.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", () => {
    nav.classList.remove("open");
    menuToggle.setAttribute("aria-expanded", "false");
  });
});

document.querySelectorAll("[data-product-id]").forEach((button) => {
  button.addEventListener("click", () => addToCart(Number(button.dataset.productId)));
});
document.querySelectorAll("[data-product-view]").forEach((trigger) => {
  trigger.addEventListener("click", () => openProductModal(Number(trigger.dataset.productView)));
});

document.querySelector("[data-cart-open]").addEventListener("click", openCart);
document.querySelectorAll("[data-cart-close]").forEach((button) => button.addEventListener("click", closeCart));
document.querySelector("[data-cart-checkout]").addEventListener("click", scrollToContact);
document.querySelectorAll("[data-modal-close]").forEach((button) => button.addEventListener("click", () => modal.classList.remove("open")));
document.querySelectorAll("[data-product-modal-close]").forEach((button) => button.addEventListener("click", closeProductModal));
productModal.addEventListener("click", (event) => {
  if (event.target === productModal) closeProductModal();
});
productModalAdd.addEventListener("click", addModalProductToCart);
document.querySelector("[data-cart-list]").addEventListener("click", (event) => {
  const button = event.target.closest("[data-cart-change]");
  if (button) changeCartQty(button.dataset.cartChange, Number(button.dataset.delta));
});
orderForm.addEventListener("submit", submitOrder);

function updateCountdown() {
  if (!countdown) return;
  const target = new Date();
  target.setHours(23, 59, 59, 999);
  const remaining = Math.max(0, target - new Date());
  const hours = Math.floor(remaining / 3600000);
  const minutes = Math.floor((remaining % 3600000) / 60000);
  const seconds = Math.floor((remaining % 60000) / 1000);
  countdown.textContent = `Ưu đãi tuần lễ khai trương còn ${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

updateCountdown();
window.setInterval(updateCountdown, 1000);
renderCart();
