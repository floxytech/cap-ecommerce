/**
 * js/main.js
 * Deployment-ready, robust client-side script for Caperone Enterprises
 * - Defensive DOM handling (waits for DOMContentLoaded)
 * - Safe path handling for GitHub Pages (relative URLs)
 * - Prevents common problems (missing elements, unencoded query strings)
 * - Product rendering, search, category filter, quick-view modal, prefill order
 * - Lightweight localStorage cart (optional, persists during session)
 *
 * Place this file at: js/main.js
 */

(function () {
  'use strict';

  /* -------------------------
     Product dataset (editable)
     Keep image paths relative to project root: assets/images/<name>.jpg
     ------------------------- */
  const PRODUCTS = [
    { id: 1, category: 'Jewels', title: 'Gold Ring', price: 50, image: 'assets/images/jewels-ring.jpg', badges: ['New'] },
    { id: 2, category: 'Jewels', title: 'Pearl Necklace', price: 40, image: 'assets/images/jewels-necklace.jpg', badges: [] },
    { id: 3, category: 'Shoes', title: 'Red Sneakers', price: 60, image: 'assets/images/shoes-sneaker.jpg', badges: ['Bestseller'] },
    { id: 4, category: 'Shoes', title: 'Classic Heels', price: 45, image: 'assets/images/shoes-heels.jpg', badges: [] },
    { id: 5, category: 'Phones', title: 'iPhone 14', price: 999, image: 'assets/images/phones-iphone.jpg', badges: ['Bestseller'] },
    { id: 6, category: 'Phones', title: 'Tecno Spark 10', price: 150, image: 'assets/images/phones-tecno.jpg', badges: [] },
    { id: 7, category: 'Wigs', title: 'Curly Lace Front', price: 70, image: 'assets/images/wigs-curly.jpg', badges: [] },
    { id: 8, category: 'Wigs', title: 'Straight Bob', price: 65, image: 'assets/images/wigs-straight.jpg', badges: [] }
  ];

  /* -------------------------
     Utility helpers
     ------------------------- */
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const safeText = s => (s === null || s === undefined) ? '' : String(s);
  const fmt = n => `$${Number(n).toFixed(2)}`;

  // Escape for textContent usage (we'll use textContent rather than innerHTML where possible)
  const createNodeFromHTML = html => {
    const tpl = document.createElement('template');
    tpl.innerHTML = html.trim();
    return tpl.content.firstChild;
  };

  /* -------------------------
     Render products into grid
     ------------------------- */
  function renderProducts(list, gridEl) {
    if (!gridEl) return;
    gridEl.innerHTML = '';
    list.forEach(p => {
      const card = document.createElement('div');
      card.className = 'card';

      // build content safely
      const img = document.createElement('img');
      img.src = p.image || 'assets/images/placeholder.jpg';
      img.alt = safeText(p.title);
      img.loading = 'lazy';
      img.onerror = function () { this.onerror = null; this.src = 'assets/images/placeholder.jpg'; };

      const title = document.createElement('div');
      title.className = 'title';
      title.textContent = p.title;

      const price = document.createElement('div');
      price.className = 'price';
      price.textContent = fmt(p.price);

      const meta = document.createElement('div');
      meta.className = 'meta';

      const cat = document.createElement('div');
      cat.textContent = p.category;

      const actions = document.createElement('div');
      actions.className = 'actions';

      // badges
      (p.badges || []).forEach(b => {
        const span = document.createElement('span');
        span.className = 'badge' + (b === 'Bestseller' ? ' bestseller' : '');
        span.textContent = b;
        actions.appendChild(span);
      });

      // Order button
      const orderBtn = document.createElement('button');
      orderBtn.className = 'btn primary';
      orderBtn.dataset.action = 'order';
      orderBtn.dataset.id = p.id;
      orderBtn.textContent = 'Order';
      actions.appendChild(orderBtn);

      // Quick view
      const viewBtn = document.createElement('button');
      viewBtn.className = 'btn ghost';
      viewBtn.dataset.action = 'view';
      viewBtn.dataset.id = p.id;
      viewBtn.textContent = 'Quick View';
      actions.appendChild(viewBtn);

      meta.appendChild(cat);
      meta.appendChild(actions);

      card.appendChild(img);
      card.appendChild(title);
      card.appendChild(price);
      card.appendChild(meta);

      gridEl.appendChild(card);
    });
  }

  /* -------------------------
     Modal (quick view)
     ------------------------- */
  function openModal(product) {
    const modal = $('#modal');
    const modalCard = $('#modal-card');
    if (!modal || !modalCard || !product) return;

    modal.classList.add('show');
    modalCard.innerHTML = ''; // clear

    // left: image
    const left = document.createElement('div');
    left.className = 'modal-left';
    const img = document.createElement('img');
    img.src = product.image || 'assets/images/placeholder.jpg';
    img.alt = safeText(product.title);
    img.onerror = function () { this.onerror = null; this.src = 'assets/images/placeholder.jpg'; };
    left.appendChild(img);

    // right: details
    const right = document.createElement('div');
    right.className = 'modal-right';
    const h3 = document.createElement('h3'); h3.textContent = product.title;
    const pCat = document.createElement('p'); pCat.style.color = '#666'; pCat.textContent = product.category;
    const pPrice = document.createElement('p'); pPrice.style.fontWeight = '800'; pPrice.style.color = 'var(--gold)'; pPrice.textContent = fmt(product.price);
    const pDesc = document.createElement('p'); pDesc.style.marginTop = '12px'; pDesc.textContent = 'High-quality product suitable for dropshipping; competitive margins and reliable suppliers.';

    const controls = document.createElement('div'); controls.style.marginTop = '14px'; controls.style.display = 'flex'; controls.style.gap = '10px';
    const orderLink = document.createElement('a');
    orderLink.className = 'btn primary';
    // build safe URL with encoded product name
    orderLink.href = `order.html?product=${encodeURIComponent(product.title)}`;
    orderLink.textContent = 'Order Now';

    const closeBtn = document.createElement('button');
    closeBtn.className = 'btn ghost';
    closeBtn.id = 'modal-close';
    closeBtn.textContent = 'Close';

    controls.appendChild(orderLink);
    controls.appendChild(closeBtn);

    right.appendChild(h3);
    right.appendChild(pCat);
    right.appendChild(pPrice);
    right.appendChild(pDesc);
    right.appendChild(controls);

    modalCard.appendChild(left);
    modalCard.appendChild(right);

    // attach close handler (in case not delegated)
    $('#modal-close')?.addEventListener('click', closeModal);
  }

  function closeModal() {
    const modal = $('#modal');
    if (modal) modal.classList.remove('show');
  }

  /* -------------------------
     Event delegation for product actions
     ------------------------- */
  function setupDelegation() {
    document.addEventListener('click', function (ev) {
      const btn = ev.target.closest('[data-action]');
      if (!btn) return;
      const action = btn.dataset.action;
      const id = Number(btn.dataset.id);
      if (action === 'view') {
        const product = PRODUCTS.find(p => p.id === id);
        openModal(product);
      } else if (action === 'order') {
        const product = PRODUCTS.find(p => p.id === id);
        if (product) {
          // navigate to order page with safe encoding
          location.href = `order.html?product=${encodeURIComponent(product.title)}`;
        }
      }
    });

    // modal: click outside or ESC to close
    document.addEventListener('click', function (ev) {
      if (ev.target && ev.target.id === 'modal') closeModal();
    });
    document.addEventListener('keydown', function (ev) {
      if (ev.key === 'Escape') closeModal();
    });
  }

  /* -------------------------
     Search and category filters
     ------------------------- */
  function setupFilters(gridEl) {
    const search = $('#search');
    const filters = $$('.filter-btn');

    if (filters && filters.length) {
      filters.forEach(btn => {
        btn.addEventListener('click', function () {
          const cat = this.dataset.cat || this.textContent.trim();
          const list = (cat === 'All' || cat === 'all') ? PRODUCTS.slice() : PRODUCTS.filter(p => p.category === cat);
          renderProducts(list, gridEl);
        });
      });
    }

    if (search) {
      search.addEventListener('input', function () {
        const q = this.value.trim().toLowerCase();
        const filtered = PRODUCTS.filter(p =>
          p.title.toLowerCase().includes(q) || p.category.toLowerCase().includes(q)
        );
        renderProducts(filtered, gridEl);
      });
    }
  }

  /* -------------------------
     Pre-fill order form when product query present
     ------------------------- */
  function prefillOrder() {
    try {
      if (!location.pathname.endsWith('order.html')) return;
      const params = new URLSearchParams(location.search);
      const pname = params.get('product');
      if (!pname) return;
      const input = $('#product-name') || $('input[name="product"]');
      if (input) input.value = pname;
    } catch (err) {
      console.warn('prefillOrder error', err);
    }
  }

  /* -------------------------
     Simple cart (localStorage) - optional usage
     - addToCart(productId) / getCart() / clearCart()
     - Buttons not shown by default; left as utility for future extension
     ------------------------- */
  const CART_KEY = 'caperone_cart_v1';
  function getCart() {
    try {
      const raw = localStorage.getItem(CART_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  }
  function saveCart(cart) {
    try { localStorage.setItem(CART_KEY, JSON.stringify(cart)); } catch (e) { /* ignore */ }
  }
  function addToCart(productId, qty = 1) {
    const cart = getCart();
    const idx = cart.findIndex(i => i.id === productId);
    if (idx > -1) cart[idx].qty += qty;
    else cart.push({ id: productId, qty });
    saveCart(cart);
  }
  function clearCart() { localStorage.removeItem(CART_KEY); }

  /* -------------------------
     Initialization
     ------------------------- */
  function init() {
    // grid may be absent on pages that don't need it (defensive)
    const grid = $('#products-grid');
    if (grid) renderProducts(PRODUCTS, grid);

    setupDelegation();
    setupFilters(grid);
    prefillOrder();

    // debug note
    console.info('caperone main.js ready');
  }

  // wait for DOM
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
