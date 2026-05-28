// NARKY UI, wishlist, reviews, notifications and lightweight hardening.
(function () {
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));
  const sanitize = html => window.DOMPurify ? DOMPurify.sanitize(html) : html;
  const setHTML = (el, html) => { if (el) el.innerHTML = sanitize(html); };
  const money = value => Number(value || 0).toLocaleString('cs-CZ') + ' Kč';

  const iconMap = {
    sekacky: 'fa-seedling',
    'motorove-pily': 'fa-tree',
    krovinorezy: 'fa-leaf',
    traktory: 'fa-tractor',
    foukace: 'fa-wind',
    mulcovace: 'fa-recycle',
    'tlakove-mycky': 'fa-shower',
    'elektricke-naradi': 'fa-bolt',
    cerpadla: 'fa-water',
    prislusenstvi: 'fa-screwdriver-wrench',
  };

  const Wishlist = {
    get key() {
      const email = localStorage.getItem('narky_current_user');
      return email ? `narky_wishlist_${email.toLowerCase()}` : 'narky_wishlist';
    },
    get() {
      try { return JSON.parse(localStorage.getItem(this.key) || '[]').map(Number).filter(Boolean); }
      catch { return []; }
    },
    save(ids) {
      localStorage.setItem(this.key, JSON.stringify([...new Set(ids.map(Number).filter(Boolean))]));
      this.updateHeader();
    },
    has(id) { return this.get().includes(Number(id)); },
    toggle(id) {
      id = Number(id);
      const ids = this.get();
      const next = ids.includes(id) ? ids.filter(x => x !== id) : [...ids, id];
      this.save(next);
      return next.includes(id);
    },
    updateHeader() {
      const btn = $('#wishlistHeaderBtn');
      if (!btn) return;
      btn.querySelector('.wishlist-count').textContent = String(this.get().length);
    },
  };

  const Toast = {
    stack: null,
    init() {
      if (this.stack) return;
      this.stack = document.createElement('div');
      this.stack.className = 'toast-stack';
      document.body.appendChild(this.stack);
    },
    show(message, type = 'success') {
      this.init();
      const el = document.createElement('div');
      el.className = `toast ${type}`;
      el.innerHTML = `<i class="fas ${type === 'error' ? 'fa-triangle-exclamation' : 'fa-circle-check'}"></i><span>${message}</span>`;
      this.stack.appendChild(el);
      setTimeout(() => el.remove(), 3200);
    },
    success(message) { this.show(message, 'success'); },
    error(message) { this.show(message, 'error'); },
  };

  const Analytics = {
    track(event, payload = {}) {
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({ event, ecommerce: payload });
    },
  };

  window.Toast = Toast;
  window.NarkyAnalytics = Analytics;
  window.CSRF = {
    token: null,
    generate() {
      const bytes = new Uint8Array(32);
      crypto.getRandomValues(bytes);
      this.token = btoa(String.fromCharCode(...bytes));
      sessionStorage.setItem('csrf_token', this.token);
      return this.token;
    },
    validate(token) { return token === sessionStorage.getItem('csrf_token'); },
    getHeader() { return { 'X-CSRF-Token': this.token || this.generate() }; },
  };

  function getProduct(id) {
    return window.DB?.products?.find(product => product.id === Number(id));
  }

  function getRating(product) {
    const rating = Math.min(4.9, 4.2 + ((product.id * 7) % 8) / 10);
    const count = Math.max(12, Math.round((product.sales || 20) * 0.7));
    return { rating, count };
  }

  function ratingHTML(product, className = 'rating-row') {
    const { rating, count } = getRating(product);
    const full = Math.floor(rating);
    const half = rating - full >= .5;
    const stars = Array.from({ length: 5 }, (_, i) => {
      if (i < full) return '<i class="fas fa-star"></i>';
      if (i === full && half) return '<i class="fas fa-star-half-alt"></i>';
      return '<i class="far fa-star"></i>';
    }).join('');
    return `<div class="${className}">${stars}<span>${rating.toFixed(1).replace('.', ',')} (${count})</span></div>`;
  }

  function ensureHeaderTools() {
    const search = $('.header-search');
    const input = $('#globalSearch');
    if (search && input && !$('.search-submit', search)) {
      const button = document.createElement('button');
      button.className = 'search-submit';
      button.type = 'button';
      button.textContent = 'Hledat';
      button.addEventListener('click', () => {
        if (typeof state !== 'undefined' && typeof renderProducts === 'function') {
          state.page = 1;
          renderProducts();
        } else if (input.value.trim()) {
          window.location.href = `index.html?q=${encodeURIComponent(input.value.trim())}`;
        }
      });
      search.appendChild(button);
    }

    const actions = $('.header-actions');
    if (actions && !$('#wishlistHeaderBtn')) {
      const btn = document.createElement('button');
      btn.id = 'wishlistHeaderBtn';
      btn.className = 'hdr-action icon-btn wishlist-header-btn';
      btn.type = 'button';
      btn.title = 'Oblíbené';
      btn.innerHTML = '<i class="fas fa-heart"></i><span class="wishlist-count">0</span>';
      btn.addEventListener('click', () => {
        const hasAccount = Boolean(localStorage.getItem('narky_current_user'));
        Toast.success(hasAccount ? 'Oblíbené produkty jsou uložené u vašeho účtu.' : 'Oblíbené produkty máte uložené v tomto prohlížeči.');
      });
      actions.insertBefore(btn, $('#cartBtn'));
      Wishlist.updateHeader();
    }
  }

  function decorateCards(root = document) {
    $$('.product-card[data-id]', root).forEach(card => {
      const product = getProduct(card.dataset.id);
      if (!product) return;
      const imageWrap = $('.card-img-wrap', card);
      if (imageWrap && !$('.wishlist-btn', imageWrap)) {
        const wish = document.createElement('button');
        wish.type = 'button';
        wish.className = 'wishlist-btn' + (Wishlist.has(product.id) ? ' active' : '');
        wish.title = 'Přidat do oblíbených';
        wish.innerHTML = '<i class="fas fa-heart"></i>';
        wish.addEventListener('click', event => {
          event.preventDefault();
          event.stopPropagation();
          const active = Wishlist.toggle(product.id);
          wish.classList.toggle('active', active);
          Toast.success(active ? 'Přidáno do oblíbených.' : 'Odebráno z oblíbených.');
        });
        imageWrap.appendChild(wish);
      }
      const name = $('.card-name', card);
      if (name && !$('.rating-row', card)) {
        name.insertAdjacentHTML('afterend', ratingHTML(product));
      }
    });
  }

  function renderPromoHome() {
    if (!$('.products-area') || $('#narkyPromoStage') || location.pathname.includes('produkt') || location.pathname.includes('pokladna')) return;
    const featured = DB.products.find(p => p.tags.includes('bestseller')) || DB.products[0];
    const tiles = DB.products.filter(p => p.id !== featured.id).slice(4, 8);
    const cats = DB.categories.slice(0, 10).map(cat => `
      <a href="index.html?cat=${cat.id}">
        <i class="fas ${iconMap[cat.id] || cat.icon || 'fa-tag'}"></i>
        <span>${cat.name}</span>
      </a>`).join('');
    const tileHTML = tiles.map(product => `
      <a class="promo-tile" href="produkt.html?id=${product.id}">
        <div><strong>${product.name}</strong><span>${money(product.price)}</span></div>
        <img src="${product.images[0]}" alt="${product.name}" loading="lazy"/>
      </a>`).join('');

    const stage = document.createElement('section');
    stage.id = 'narkyPromoStage';
    stage.className = 'narky-promo-stage';
    setHTML(stage, `
      <nav class="promo-menu">${cats}</nav>
      <div class="promo-content">
        <a class="promo-hero" href="produkt.html?id=${featured.id}">
          <span class="promo-kicker"><i class="fas fa-percent"></i> Akční nabídka</span>
          <h2>Nářadí a zahradní technika připravená na sezonu</h2>
          <p>${featured.name} teď za ${money(featured.price)}. Osobní odběr v Ostřetíně zdarma.</p>
          <span class="promo-cta">Koupit teď <i class="fas fa-arrow-right"></i></span>
        </a>
        <div class="promo-tiles">${tileHTML}</div>
        <div class="narky-trust-row">
          <div class="trust-item"><i class="fas fa-store"></i> Kamenná prodejna</div>
          <div class="trust-item"><i class="fas fa-tools"></i> Vlastní servis</div>
          <div class="trust-item"><i class="fas fa-truck-fast"></i> Doprava od 99 Kč</div>
          <div class="trust-item"><i class="fas fa-shield-halved"></i> Bezpečná objednávka</div>
        </div>
      </div>`);
    $('.breadcrumb-bar')?.insertAdjacentElement('afterend', stage);
    $('.promo-hero', stage)?.style.setProperty('--promo-image', `url("${featured.images[0]}")`);

    if (!$('#sideAdLeft')) {
      const left = document.createElement('aside');
      left.id = 'sideAdLeft';
      left.className = 'side-ad left';
      left.innerHTML = `<strong>Servis i prodej zahradní techniky</strong><span>Sezona běží</span><img src="${featured.images[0]}" alt="">`;
      document.body.appendChild(left);
      const rightProduct = tiles[0] || featured;
      const right = document.createElement('aside');
      right.id = 'sideAdRight';
      right.className = 'side-ad right';
      right.innerHTML = `<strong>Slevy na vybrané stroje</strong><span>- až 15 %</span><img src="${rightProduct.images[0]}" alt="">`;
      document.body.appendChild(right);
    }
  }

  function enhanceDetail() {
    const wrap = $('#detailWrap');
    if (!wrap) return;
    const id = Number(new URLSearchParams(location.search).get('id'));
    const product = getProduct(id);
    if (!product) return;
    const heading = $('.detail-name', wrap);
    if (heading && !$('.detail-rating', wrap)) {
      heading.insertAdjacentHTML('afterend', ratingHTML(product, 'rating-row detail-rating'));
    }
    const tabs = $('.detail-tabs', wrap);
    if (tabs && !$('.review-panel', tabs)) {
      tabs.insertAdjacentHTML('beforeend', `
        <div class="review-panel">
          <h3>Recenze zákazníků</h3>
          <div class="review-row"><strong>Ověřený zákazník</strong> ${ratingHTML(product)}<p>Rychlé dodání, stroj odpovídá popisu a oceňuji možnost servisu.</p></div>
          <div class="review-row"><strong>Jan z Pardubic</strong> ${ratingHTML({ ...product, id: product.id + 1 })}<p>Dobrá komunikace a férová cena. Za mě spokojenost.</p></div>
        </div>`);
    }
    if (product.stockStatus !== 'skladem' && !$('.stock-alert', wrap)) {
      $('.detail-qty-row', wrap)?.insertAdjacentHTML('afterend', '<div class="stock-alert"><i class="fas fa-bell"></i> Produkt není skladem. Napište nám a dáme vám vědět, až dorazí.</div>');
    }
  }

  function enhanceCheckout() {
    const layout = $('.checkout-layout');
    if (!layout || $('#checkoutTrust')) return;
    const trust = document.createElement('div');
    trust.id = 'checkoutTrust';
    trust.className = 'checkout-trust container';
    trust.innerHTML = `
      <span><i class="fas fa-lock"></i> SSL zabezpečení</span>
      <span><i class="fas fa-user-check"></i> Nákup bez registrace</span>
      <span><i class="fas fa-headset"></i> Telefonická podpora</span>`;
    layout.insertAdjacentElement('beforebegin', trust);
  }

  function initNewsletter() {
    if (document.body.classList.contains('admin-body') || document.body.classList.contains('checkout-page')) return;
    if (sessionStorage.getItem('narky_newsletter_seen')) return;
    const modal = document.createElement('div');
    modal.className = 'newsletter-backdrop';
    modal.id = 'newsletterModal';
    modal.innerHTML = `
      <div class="newsletter-box">
        <button class="newsletter-close" type="button" aria-label="Zavřít"><i class="fas fa-times"></i></button>
        <h3>Sleva 5 % na první nákup</h3>
        <p>Pošleme vám slevový kód a novinky ze servisu zahradní techniky.</p>
        <form class="newsletter-form">
          <input type="email" required placeholder="vas@email.cz" autocomplete="email"/>
          <button type="submit">Získat slevu</button>
        </form>
      </div>`;
    document.body.appendChild(modal);
    const close = () => {
      modal.classList.remove('open');
      sessionStorage.setItem('narky_newsletter_seen', '1');
    };
    $('.newsletter-close', modal).addEventListener('click', close);
    modal.addEventListener('click', event => { if (event.target === modal) close(); });
    $('.newsletter-form', modal).addEventListener('submit', event => {
      event.preventDefault();
      localStorage.setItem('narky_newsletter_email', $('input', modal).value.trim());
      Toast.success('Děkujeme, slevový kód je uložený pro demo.');
      close();
    });
    setTimeout(() => modal.classList.add('open'), 30000);
  }

  function patchCartActions() {
    if (typeof addToCartAnim === 'function') {
      window.addToCartAnim = function (id, btn) {
        const product = getProduct(id);
        if (!DB.addToCart(id, 1)) {
          Toast.error('Produkt není možné přidat do košíku.');
          return;
        }
        Analytics.track('add_to_cart', { items: [{ item_id: id, item_name: product?.name, quantity: 1 }] });
        updateCartBadge();
        if (btn) {
          const original = btn.innerHTML;
          btn.innerHTML = '<i class="fas fa-check"></i> Přidáno';
          setTimeout(() => { btn.innerHTML = original; }, 1400);
        }
        Toast.success('Přidáno do košíku.');
        if (typeof renderCartDrawer === 'function') renderCartDrawer();
        if (typeof openCart === 'function') openCart();
      };
    }

    if (typeof addDetailToCart === 'function') {
      window.addDetailToCart = function (id) {
        const qty = Number.parseInt($('#detailQty')?.value || '1', 10) || 1;
        const product = getProduct(id);
        if (!DB.addToCart(id, qty)) {
          Toast.error('Produkt není možné přidat do košíku.');
          return;
        }
        Analytics.track('add_to_cart', { items: [{ item_id: id, item_name: product?.name, quantity: qty }] });
        updateCartBadge();
        Toast.success('Přidáno do košíku.');
        if (typeof renderCartDrawer === 'function') renderCartDrawer();
        if (typeof openCart === 'function') openCart();
      };
    }

    if (typeof placeOrder === 'function') {
      const originalPlaceOrder = window.placeOrder;
      window.placeOrder = function () {
        Analytics.track('purchase', { value: DB.getCartTotal(), currency: 'CZK' });
        return originalPlaceOrder();
      };
    }
  }

  function patchRenderers() {
    if (typeof renderProducts === 'function' && !renderProducts.__narkyPatched) {
      const original = renderProducts;
      window.renderProducts = function () {
        original();
        decorateCards(document);
      };
      window.renderProducts.__narkyPatched = true;
    }
    if (typeof renderRelated === 'function' && !renderRelated.__narkyPatched) {
      const originalRelated = renderRelated;
      window.renderRelated = function (product) {
        originalRelated(product);
        decorateCards(document);
      };
      window.renderRelated.__narkyPatched = true;
    }
    if (typeof renderDetail === 'function' && !renderDetail.__narkyPatched) {
      const originalDetail = renderDetail;
      window.renderDetail = function (product) {
        originalDetail(product);
        enhanceDetail();
      };
      window.renderDetail.__narkyPatched = true;
    }
  }

  function registerPWA() {
    if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
      navigator.serviceWorker.register('sw.js').catch(() => {});
    }
  }

  patchRenderers();
  patchCartActions();

  document.addEventListener('DOMContentLoaded', () => {
    ensureHeaderTools();
    renderPromoHome();
    decorateCards(document);
    enhanceDetail();
    enhanceCheckout();
    initNewsletter();
    registerPWA();
  });
})();
