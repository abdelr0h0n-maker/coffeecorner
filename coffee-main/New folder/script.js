// Coffee Corner - cart and page interactions
"use strict";

const CART_KEY = "cart";
let cart = loadCart();
let toastTimer;

function loadCart() {
    try {
        const saved = JSON.parse(localStorage.getItem(CART_KEY) || "[]");
        if (!Array.isArray(saved)) return [];
        return saved.filter(item =>
            item &&
            typeof item.name === "string" &&
            Number.isFinite(Number(item.price)) &&
            Number(item.price) >= 0 &&
            Number.isInteger(Number(item.qty)) &&
            Number(item.qty) > 0
        ).map(item => ({
            name: item.name,
            price: Number(item.price),
            qty: Number(item.qty)
        }));
    } catch (error) {
        return [];
    }
}

function toggleCart(forceOpen) {
    const sidebar = document.getElementById("cartSidebar");
    if (!sidebar) return;
    const shouldOpen = typeof forceOpen === "boolean"
        ? forceOpen
        : !sidebar.classList.contains("active");
    sidebar.classList.toggle("active", shouldOpen);
    sidebar.setAttribute("aria-hidden", String(!shouldOpen));
    document.body.classList.toggle("cart-open", shouldOpen);
}

function saveCart() {
    try {
        localStorage.setItem(CART_KEY, JSON.stringify(cart));
    } catch (error) {
        showToast("Unable to save cart on this device");
    }
}

function showToast(message) {
    const toast = document.getElementById("toast");
    const toastMessage = document.getElementById("toastMessage");
    if (!toast) return;
    if (toastMessage) toastMessage.textContent = String(message);
    else toast.textContent = String(message);
    toast.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("show"), 2500);
}

function addToCart(name, price) {
    const numericPrice = Number(price);
    if (typeof name !== "string" || !Number.isFinite(numericPrice) || numericPrice < 0) {
        showToast("This item could not be added");
        return;
    }

    const item = cart.find(product => product.name === name && product.price === numericPrice);
    if (item) item.qty++;
    else cart.push({ name, price: numericPrice, qty: 1 });

    saveCart();
    renderCart();
    showToast(name + " added to cart");
}

function increase(index) {
    if (!cart[index]) return;
    cart[index].qty++;
    saveCart();
    renderCart();
}

function decrease(index) {
    if (!cart[index]) return;
    cart[index].qty--;
    if (cart[index].qty <= 0) cart.splice(index, 1);
    saveCart();
    renderCart();
}

function removeItem(index) {
    if (!cart[index]) return;
    cart.splice(index, 1);
    saveCart();
    renderCart();
    showToast("Item removed");
}

function renderCart() {
    const cartItems = document.getElementById("cartItems");
    const totalPrice = document.getElementById("totalPrice");
    const cartCount = document.getElementById("cart-count");
    if (!cartItems || !totalPrice || !cartCount) return;

    cartItems.replaceChildren();
    const total = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
    const count = cart.reduce((sum, item) => sum + item.qty, 0);
    cartCount.textContent = String(count);
    totalPrice.textContent = "Total: $" + total.toFixed(2);

    if (cart.length === 0) {
        const empty = document.createElement("p");
        empty.textContent = "Your cart is empty.";
        cartItems.appendChild(empty);
        return;
    }

    cart.forEach((item, index) => {
        const row = document.createElement("div");
        row.className = "cart-item";

        const details = document.createElement("div");
        const name = document.createElement("h4");
        name.textContent = item.name;
        const price = document.createElement("p");
        price.textContent = "$" + item.price.toFixed(2);
        details.append(name, price);

        const controls = document.createElement("div");
        const minus = document.createElement("button");
        minus.type = "button";
        minus.textContent = "−";
        minus.setAttribute("aria-label", "Decrease " + item.name);
        minus.addEventListener("click", () => decrease(index));
        const quantity = document.createElement("span");
        quantity.style.margin = "0 10px";
        quantity.textContent = String(item.qty);
        const plus = document.createElement("button");
        plus.type = "button";
        plus.textContent = "+";
        plus.setAttribute("aria-label", "Increase " + item.name);
        plus.addEventListener("click", () => increase(index));
        controls.append(minus, quantity, plus);

        const subtotal = document.createElement("div");
        const amount = document.createElement("strong");
        amount.textContent = "$" + (item.price * item.qty).toFixed(2);
        const remove = document.createElement("button");
        remove.type = "button";
        remove.textContent = "Remove";
        remove.style.cssText = "display:block;width:auto;height:auto;border-radius:6px;padding:5px 8px;margin-top:8px";
        remove.setAttribute("aria-label", "Remove " + item.name);
        remove.addEventListener("click", () => removeItem(index));
        subtotal.append(amount, remove);

        row.append(details, controls, subtotal);
        cartItems.appendChild(row);
    });
}

function clearCart() {
    if (cart.length === 0) {
        showToast("Cart is already empty");
        return;
    }
    if (window.confirm("Clear all items?")) {
        cart = [];
        saveCart();
        renderCart();
        showToast("Cart cleared");
    }
}

function prepareOrder() {
    if (cart.length === 0) {
        showToast("Add an item before confirming your order");
        return false;
    }
    const orderData = document.getElementById("orderData");
    if (!orderData) return false;
    const lines = cart.map(item =>
        `${item.name}\nQuantity: ${item.qty}\nPrice: $${(item.price * item.qty).toFixed(2)}`
    );
    const total = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
    lines.push(`Total: $${total.toFixed(2)}`);
    orderData.value = lines.join("\n\n-------------------------\n\n");
    return true;
}

function initScrollEffects() {
    const header = document.querySelector("header");
    const topBtn = document.createElement("button");
    topBtn.type = "button";
    topBtn.textContent = "↑";
    topBtn.className = "top-btn";
    topBtn.setAttribute("aria-label", "Back to top");
    document.body.appendChild(topBtn);

    const onScroll = () => {
        if (header) {
            header.classList.toggle("scrolled", window.scrollY > 50);
        }
        topBtn.classList.toggle("show", window.scrollY > 300);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    topBtn.addEventListener("click", () => {
        window.scrollTo({ top: 0, behavior: "smooth" });
    });
}

document.addEventListener("DOMContentLoaded", () => {
    renderCart();
    initScrollEffects();

    const orderForm = document.querySelector(".cart-footer form");
    if (orderForm) {
        orderForm.addEventListener("submit", event => {
            if (!prepareOrder()) event.preventDefault();
        });
    }

    if (typeof AOS !== "undefined") {
        AOS.init({ duration: 800, once: true, offset: 40 });
    }
});
