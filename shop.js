(() => {
  "use strict";

  const PRODUCTS = {
    dark:    {name:"72% Cacao", type:"DARK", price:450, short:"Intense · Roasted · Long finish"},
    milk:    {name:"Velvet Milk", type:"MILK", price:400, short:"Soft · Creamy · Balanced"},
    hazel:   {name:"Roasted Hazelnut", type:"HAZELNUT", price:500, short:"Nutty · Toasted · Rich"},
    caramel: {name:"Salted Caramel", type:"CARAMEL", price:450, short:"Buttery · Salty · Deep"}
  };

  const $ = (s) => document.querySelector(s);
  const cartDrawer = $("#cartDrawer");
  const overlay = $("#overlay");
  const checkoutModal = $("#checkoutModal");
  const toast = $("#toast");

  let cart = JSON.parse(localStorage.getItem("masterChocolateCart") || "{}");
  const savedCustomer = JSON.parse(localStorage.getItem("masterChocolateCustomer") || "null");

  if (savedCustomer) {
    $("#customerName").value = savedCustomer.name || "";
    $("#customerPhone").value = savedCustomer.phone || "";
    $("#customerAddress").value = savedCustomer.address || "";
  }

  function saveCart(){ localStorage.setItem("masterChocolateCart", JSON.stringify(cart)); }

  function cartCount(){ return Object.values(cart).reduce((sum, item) => sum + item.qty, 0); }
  function subtotal(){ return Object.entries(cart).reduce((sum,[id,item]) => sum + PRODUCTS[id].price * item.qty, 0); }

  function money(n){ return "৳" + n.toLocaleString("en-BD"); }

  function renderCart(){
    const count = cartCount();
    $("#cartCount").textContent = count;
    $("#cartSubtotal").textContent = money(subtotal());
    $("#checkoutItems").textContent = count;
    $("#checkoutTotal").textContent = money(subtotal());

    const items = $("#cartItems");
    const empty = $("#cartEmpty");
    items.innerHTML = "";

    if (!count) {
      empty.style.display = "grid";
      $("#checkoutOpen").disabled = true;
      return;
    }

    empty.style.display = "none";
    $("#checkoutOpen").disabled = false;

    Object.entries(cart).forEach(([id,item]) => {
      const p = PRODUCTS[id];
      const row = document.createElement("div");
      row.className = "cart-row";
      row.innerHTML = `
        <div class="cart-thumb">${p.type}</div>
        <div>
          <h4>${p.name}</h4>
          <small>${money(p.price)} each</small>
          <div class="qty">
            <button type="button" data-action="minus" data-id="${id}">−</button>
            <span>${item.qty}</span>
            <button type="button" data-action="plus" data-id="${id}">+</button>
          </div>
          <button class="remove" type="button" data-action="remove" data-id="${id}">Remove</button>
        </div>
        <span class="price">${money(p.price * item.qty)}</span>
      `;
      items.appendChild(row);
    });
  }

  function showToast(message){
    toast.textContent = message;
    toast.classList.add("show");
    clearTimeout(showToast.timer);
    showToast.timer = setTimeout(() => toast.classList.remove("show"), 2200);
  }

  function addToCart(id){
    cart[id] = cart[id] || {qty:0};
    cart[id].qty++;
    saveCart();
    renderCart();
    showToast(`${PRODUCTS[id].name} added to cart`);
  }

  document.querySelectorAll("[data-add]").forEach(btn => {
    btn.addEventListener("click", () => addToCart(btn.dataset.add));
  });

  $("#cartItems").addEventListener("click", e => {
    const btn = e.target.closest("[data-action]");
    if (!btn) return;
    const {action,id} = btn.dataset;
    if (action === "plus") cart[id].qty++;
    if (action === "minus") {
      cart[id].qty--;
      if (cart[id].qty <= 0) delete cart[id];
    }
    if (action === "remove") delete cart[id];
    saveCart();
    renderCart();
  });

  function openCart(){
    cartDrawer.classList.add("open");
    overlay.classList.add("open");
    document.body.classList.add("lock");
  }
  function closeCart(){
    cartDrawer.classList.remove("open");
    overlay.classList.remove("open");
    if (!checkoutModal.classList.contains("open")) document.body.classList.remove("lock");
  }
  $("#cartOpen").addEventListener("click", openCart);
  $("#cartClose").addEventListener("click", closeCart);
  overlay.addEventListener("click", closeCart);

  function openCheckout(){
    if (!cartCount()) return;
    closeCart();
    checkoutModal.classList.add("open");
    checkoutModal.setAttribute("aria-hidden","false");
    document.body.classList.add("lock");
    $("#checkoutItems").textContent = cartCount();
    $("#checkoutTotal").textContent = money(subtotal());
    $("#checkoutForm").hidden = false;
    $("#orderSuccess").hidden = true;
  }
  function closeCheckout(){
    checkoutModal.classList.remove("open");
    checkoutModal.setAttribute("aria-hidden","true");
    document.body.classList.remove("lock");
  }
  $("#checkoutOpen").addEventListener("click", openCheckout);
  $("#checkoutClose").addEventListener("click", closeCheckout);
  checkoutModal.addEventListener("click", e => { if (e.target === checkoutModal) closeCheckout(); });

  function setError(input, message){
    const label = input.closest("label");
    label.classList.toggle("invalid", Boolean(message));
    label.querySelector(".error").textContent = message || "";
  }

  function validate(){
    const name = $("#customerName");
    const phone = $("#customerPhone");
    const address = $("#customerAddress");
    let valid = true;

    if (name.value.trim().length < 2) { setError(name,"Please enter your full name."); valid = false; }
    else setError(name,"");

    const digits = phone.value.replace(/\D/g,"");
    if (digits.length < 10 || digits.length > 15) { setError(phone,"Enter a valid phone number."); valid = false; }
    else setError(phone,"");

    if (address.value.trim().length < 8) { setError(address,"Please enter a complete delivery address."); valid = false; }
    else setError(address,"");

    return valid;
  }

  $("#checkoutForm").addEventListener("submit", e => {
    e.preventDefault();
    if (!validate()) return;

    const customer = {
      name: $("#customerName").value.trim(),
      phone: $("#customerPhone").value.trim(),
      address: $("#customerAddress").value.trim()
    };
    localStorage.setItem("masterChocolateCustomer", JSON.stringify(customer));

    const ref = "MC-" + Date.now().toString().slice(-7);
    const order = {reference:ref, customer, items:cart, total:subtotal(), createdAt:new Date().toISOString()};
    localStorage.setItem("masterChocolateLastOrder", JSON.stringify(order));

    $("#successName").textContent = customer.name.split(" ")[0];
    $("#orderRef").textContent = ref;
    $("#checkoutForm").hidden = true;
    $("#orderSuccess").hidden = false;

    cart = {};
    saveCart();
    renderCart();
  });

  $("#successDone").addEventListener("click", closeCheckout);

  ["customerName","customerPhone","customerAddress"].forEach(id => {
    $("#" + id).addEventListener("input", () => setError($("#"+id),""));
  });

  renderCart();
})();
