// NARKY business layer: logistics, checkout payments, accounts, emails and admin tools.
(function () {
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));
  const money = value => `${Math.round(Number(value || 0)).toLocaleString('cs-CZ')} Kč`;
  const safe = value => String(value ?? '').replace(/[&<>"'`]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;', '`': '&#96;' }[ch]));
  const json = (key, fallback) => {
    try { return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback)); }
    catch { return fallback; }
  };
  const setJson = (key, value) => localStorage.setItem(key, JSON.stringify(value));

  const CONFIG = {
    bankIban: localStorage.getItem('narky_bank_iban') || 'CZ0008000000000000000000',
    bankName: localStorage.getItem('narky_bank_name') || 'NARKY.cz',
    packetaApiKey: localStorage.getItem('narky_packeta_api_key') || 'PASTE_PACKETA_KEY',
  };

  function currentUserEmail() {
    return localStorage.getItem('narky_current_user') || '';
  }

  function getUsers() { return json('narky_users', []); }
  function saveUsers(users) { setJson('narky_users', users); }
  async function sha256(value) {
    const data = new TextEncoder().encode(value);
    const hash = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hash)).map(byte => byte.toString(16).padStart(2, '0')).join('');
  }

  function ensureDiscountCodes() {
    const codes = json('narky_discount_codes', []);
    if (!codes.some(code => code.code === 'NARKY5')) {
      codes.push({ code: 'NARKY5', percent: 5, used: false, source: 'manual', createdAt: new Date().toISOString() });
      setJson('narky_discount_codes', codes);
    }
    return codes;
  }

  function findDiscount(code) {
    const normalized = String(code || '').trim().toUpperCase();
    return ensureDiscountCodes().find(item => item.code === normalized && !item.used);
  }

  function markDiscountUsed(code, orderId) {
    if (!code) return;
    const codes = ensureDiscountCodes();
    const item = codes.find(x => x.code === String(code).trim().toUpperCase());
    if (item) {
      item.used = true;
      item.usedAt = new Date().toISOString();
      item.orderId = orderId;
      setJson('narky_discount_codes', codes);
    }
  }

  function queueEmail(to, type, subject, html) {
    const outbox = json('narky_email_outbox', []);
    outbox.unshift({ id: `MAIL-${Date.now()}`, to, type, subject, html, status: 'queued', createdAt: new Date().toISOString() });
    setJson('narky_email_outbox', outbox.slice(0, 250));
  }

  function saveSubscriber(email, code) {
    const subscribers = json('narky_newsletter', []);
    const existing = subscribers.find(item => item.email.toLowerCase() === email.toLowerCase());
    if (existing) existing.code = code;
    else subscribers.unshift({ email, code, createdAt: new Date().toISOString(), consent: true });
    setJson('narky_newsletter', subscribers);
  }

  function makeNewsletterCode(email) {
    const suffix = btoa(email.toLowerCase()).replace(/[^A-Z0-9]/gi, '').slice(0, 5).toUpperCase() || Math.random().toString(36).slice(2, 7).toUpperCase();
    return `NARKY5-${suffix}`;
  }

  function orderUrl(order) {
    const base = `${location.origin}${location.pathname.replace(/[^/]+$/, '')}objednavka.html`;
    return `${base}?id=${encodeURIComponent(order.id)}&email=${encodeURIComponent(order.address?.email || order.customerEmail || '')}`;
  }

  function qrPayload(order) {
    const vs = String(order.id || '').replace(/\D/g, '').slice(-10) || String(Date.now()).slice(-10);
    return `SPD*1.0*ACC:${CONFIG.bankIban}*AM:${Number(order.total || 0).toFixed(2)}*CC:CZK*MSG:NARKY ${order.id}*X-VS:${vs}`;
  }

  function qrImg(payload) {
    return `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(payload)}`;
  }

  function paymentLabel(id) {
    return { card: 'Platební karta', transfer: 'Bankovní převod', cash: 'Hotovost na prodejně' }[id] || id;
  }

  function statusLabel(status) {
    return {
      nova: 'Nová objednávka',
      'ceka-na-platbu': 'Čeká na platbu',
      zaplaceno: 'Zaplaceno',
      pripravujeme: 'Připravujeme k odeslání',
      'ceka-na-expedici': 'Čeká na expedici',
      expedovano: 'Expedováno',
      doruceno: 'Doručeno',
      zrusena: 'Zrušeno',
    }[status] || status;
  }

  function paymentStatusLabel(status) {
    return { unpaid: 'Nezaplaceno', pending: 'Čeká na platbu', paid: 'Zaplaceno', failed: 'Selhalo', refunded: 'Vráceno' }[status] || status;
  }

  function fulfillmentLabel(status) {
    return { new: 'Nová', preparing: 'Připravujeme', ready: 'Čeká na expedici', shipped: 'Expedováno', delivered: 'Doručeno', cancelled: 'Zrušeno' }[status] || status;
  }

  function cartItemsHTML() {
    return DB.getCart().map(item => {
      const p = DB.getProducts().find(x => x.id === item.id);
      if (!p) return '';
      const d = p.dimensions;
      return `<div class="co-cart-item">
        <img class="co-item-img" src="${p.images[0]}" alt="${safe(p.name)}"/>
        <div class="co-item-name">${safe(p.name)}<br><small style="color:var(--text2);font-weight:400">${safe(p.brand)} · ${p.weight} kg · ${d.length}×${d.width}×${d.height} cm</small></div>
        <div class="co-item-qty">× ${item.qty}</div>
        <div class="co-item-price">${money(p.price * item.qty)}</div>
      </div>`;
    }).join('');
  }

  function getDiscountAmount() {
    const discount = coState.discount;
    if (!discount) return 0;
    return Math.round(DB.getCartTotal() * (Number(discount.percent) || 0) / 100);
  }

  function shippingObject() {
    return DB.shipping.find(s => s.id === coState.shipping);
  }

  function orderTotal() {
    return Math.max(0, DB.getCartTotal() - getDiscountAmount() + (shippingObject()?.price || 0));
  }

  function renderCheckoutOverrides() {
    if (typeof coState === 'undefined') return;
    coState.discount = coState.discount || null;

    window.renderStepCart = function () {
      const metrics = DB.getCartMetrics();
      return `<div class="step-panel">
        <h2><i class="fas fa-shopping-cart"></i> Přehled objednávky</h2>
        ${cartItemsHTML()}
        <div class="logistics-box">
          <strong>Logistika zásilky</strong>
          <span>${metrics.weight.toFixed(1)} kg · ${metrics.length}×${metrics.width}×${metrics.height} cm</span>
        </div>
        <div class="discount-box">
          <label>Slevový kód</label>
          <div><input id="discountCodeInput" value="${safe(coState.discount?.code || '')}" placeholder="Např. NARKY5"/><button onclick="applyDiscountCode()">Použít</button></div>
          <p id="discountFeedback">${coState.discount ? `Aktivní sleva ${coState.discount.percent} % (${money(getDiscountAmount())})` : ''}</p>
        </div>
        <div class="step-nav">
          <a href="index.html" class="step-nav-back"><i class="fas fa-arrow-left"></i> Zpět do obchodu</a>
          <button class="step-nav-next" onclick="renderStep(2)">Doprava <i class="fas fa-arrow-right"></i></button>
        </div>
      </div>`;
    };

    window.applyDiscountCode = function () {
      const input = $('#discountCodeInput');
      const code = findDiscount(input?.value);
      const feedback = $('#discountFeedback');
      if (!code) {
        coState.discount = null;
        if (feedback) feedback.textContent = 'Kód není platný nebo už byl použit.';
        renderSummary();
        return;
      }
      coState.discount = code;
      if (feedback) feedback.textContent = `Aktivní sleva ${code.percent} % (${money(getDiscountAmount())})`;
      renderSummary();
    };

    window.renderStepShipping = function () {
      const options = DB.getShippingOptionsForCart();
      const metrics = DB.getCartMetrics();
      const opts = options.map(s => `
        <label class="shipping-option${coState.shipping===s.id?' selected':''}${!s.allowed?' disabled':''}" title="${safe(s.reason || '')}">
          <input type="radio" name="shipping" value="${s.id}" ${coState.shipping===s.id?'checked':''} ${!s.allowed?'disabled':''}/>
          <div class="ship-icon"><i class="fas ${s.icon}"></i></div>
          <div class="ship-info">
            <div class="ship-name">${safe(s.name)}</div>
            <div class="ship-desc">${safe(s.desc)}</div>
            ${!s.allowed ? `<div class="ship-warning"><i class="fas fa-ban"></i> Nelze vybrat: ${safe(s.reason)}</div>` : ''}
          </div>
          <div class="ship-price${s.price===0?' free':''}">${s.price===0?'Zdarma':money(s.price)}</div>
        </label>`).join('');
      return `<div class="step-panel">
        <h2><i class="fas fa-truck"></i> Způsob dopravy</h2>
        <div class="logistics-box"><strong>Balík podle košíku</strong><span>${metrics.weight.toFixed(1)} kg · ${metrics.length}×${metrics.width}×${metrics.height} cm</span></div>
        <div class="shipping-options" id="shippingOptions">${opts}</div>
        <div id="pickupWidgetArea"></div>
        <div class="step-nav">
          <button class="step-nav-back" onclick="renderStep(1)"><i class="fas fa-arrow-left"></i> Zpět</button>
          <button class="step-nav-next" onclick="proceedFromShipping()">Adresa <i class="fas fa-arrow-right"></i></button>
        </div>
      </div>`;
    };

    window.initShippingEvents = function () {
      $$('input[name=shipping]').forEach(radio => {
        radio.addEventListener('change', () => {
          const allowed = DB.checkShippingAllowed(radio.value);
          if (!allowed.allowed) {
            Toast?.error(`Tuto dopravu nejde zvolit: ${allowed.reason}`);
            radio.checked = false;
            return;
          }
          coState.shipping = radio.value;
          coState.pickupPoint = null;
          $$('.shipping-option').forEach(o => o.classList.remove('selected'));
          radio.closest('.shipping-option').classList.add('selected');
          renderPickupWidget(radio.value);
          renderSummary();
        });
      });
    };

    window.renderPickupWidget = function (shippingId) {
      const area = $('#pickupWidgetArea');
      if (!area) return;
      if (shippingId !== 'zasilkovna-point' && shippingId !== 'ppl-point') { area.innerHTML = ''; return; }
      const isPacketa = shippingId === 'zasilkovna-point';
      area.innerHTML = `<div class="pickup-widget">
        <p><i class="fas fa-map-marker-alt"></i> Vyberte výdejní místo ${isPacketa ? 'Zásilkovny' : 'PPL ParcelShop'}.</p>
        ${coState.pickupPoint ? `<div class="pickup-selected"><i class="fas fa-check-circle"></i> ${safe(coState.pickupPoint.name || coState.pickupPoint)}</div>` : ''}
        <button class="pickup-widget-btn" onclick="openPickupWidget('${shippingId}')"><i class="fas fa-map"></i> Otevřít mapu výdejen</button>
        <p class="pickup-note">${isPacketa ? 'Po doplnění Packeta API klíče se otevře oficiální mapa výdejen.' : 'PPL je v tomto prototypu zjednodušené.'}</p>
      </div>`;
    };

    window.openPickupWidget = function (type) {
      if (type === 'zasilkovna-point') {
        const finish = point => {
          if (!point) return;
          coState.pickupPoint = {
            id: point.id || point.idPacketa || point.externalId || '',
            name: point.name || point.place || 'Vybrané výdejní místo Zásilkovny',
            city: point.city || '',
            street: point.street || '',
          };
          renderPickupWidget(type);
          renderSummary();
        };
        if (window.Packeta?.Widget && CONFIG.packetaApiKey !== 'PASTE_PACKETA_KEY') {
          window.Packeta.Widget.pick(CONFIG.packetaApiKey, finish, { country: 'cz', language: 'cs', weight: DB.getCartMetrics().weight });
          return;
        }
        const script = document.createElement('script');
        script.src = 'https://widget.packeta.com/v6/www/js/library.js';
        script.onload = () => {
          if (window.Packeta?.Widget && CONFIG.packetaApiKey !== 'PASTE_PACKETA_KEY') window.Packeta.Widget.pick(CONFIG.packetaApiKey, finish, { country: 'cz', language: 'cs', weight: DB.getCartMetrics().weight });
          else {
            Toast?.error('Doplňte Packeta API klíč do localStorage `narky_packeta_api_key`.');
            finish({ id: 'demo-holice', name: 'Zásilkovna Holice, nám. T. G. Masaryka 1' });
          }
        };
        script.onerror = () => finish({ id: 'demo-holice', name: 'Zásilkovna Holice, nám. T. G. Masaryka 1' });
        document.head.appendChild(script);
        return;
      }
      coState.pickupPoint = { id: 'ppl-demo', name: 'PPL ParcelShop Holice, Nádražní 12' };
      renderPickupWidget(type);
      renderSummary();
    };

    window.proceedFromShipping = function () {
      if (!coState.shipping) { alert('Prosím vyberte způsob dopravy.'); return; }
      const allowed = DB.checkShippingAllowed(coState.shipping);
      if (!allowed.allowed) { alert(`Tuto dopravu nelze zvolit: ${allowed.reason}`); return; }
      if (['zasilkovna-point','ppl-point'].includes(coState.shipping) && !coState.pickupPoint) {
        alert('Prosím vyberte výdejní místo.');
        return;
      }
      renderStep(3);
    };

    window.renderStepPayment = function () {
      const methods = [
        { id: 'card', icon: 'fa-credit-card', label: 'Platební karta', desc: 'Bránu napojíte serverově přes GP webpay / zvoleného poskytovatele.' },
        { id: 'transfer', icon: 'fa-qrcode', label: 'Bankovní převod + QR platba', desc: 'Po odeslání objednávky se ukáže QR kód a platební údaje.' },
        ...(coState.shipping === 'osobni' ? [{ id: 'cash', icon: 'fa-money-bill-wave', label: 'Hotovost při osobním odběru', desc: 'Pouze pro osobní odběr na prodejně.' }] : []),
      ];
      const opts = methods.map(m => `
        <label class="payment-option${coState.payment===m.id?' selected':''}">
          <input type="radio" name="payment" value="${m.id}" ${coState.payment===m.id?'checked':''}/>
          <i class="fas ${m.icon}"></i>
          <span>${m.label}</span>
          <small>${m.desc}</small>
        </label>`).join('');
      return `<div class="step-panel">
        <h2><i class="fas fa-credit-card"></i> Způsob platby</h2>
        <div class="payment-options">${opts}</div>
        <div class="step-nav">
          <button class="step-nav-back" onclick="renderStep(3)"><i class="fas fa-arrow-left"></i> Zpět</button>
          <button class="step-nav-next" onclick="proceedFromPayment()">Souhrn <i class="fas fa-arrow-right"></i></button>
        </div>
      </div>`;
    };

    window.initPaymentEvents = function () {
      $$('input[name=payment]').forEach(input => {
        input.addEventListener('change', () => {
          if (input.value === 'cash' && coState.shipping !== 'osobni') return;
          coState.payment = input.value;
          $$('.payment-option').forEach(o => o.classList.remove('selected'));
          input.closest('.payment-option').classList.add('selected');
          renderSummary();
        });
      });
    };

    window.renderConfirmation = function () {
      const ship = shippingObject();
      const total = orderTotal();
      const discount = getDiscountAmount();
      const qr = coState.payment === 'transfer' ? qrPayload({ id: 'VS bude po odeslání', total }) : '';
      return `<div class="step-panel">
        <h2><i class="fas fa-clipboard-check"></i> Potvrzení objednávky</h2>
        ${cartItemsHTML()}
        <div class="checkout-confirm-grid">
          <div><h4>Doručení</h4><p><strong>${safe(coState.address.name)}</strong><br>${safe(coState.address.street)}<br>${safe(coState.address.zip)} ${safe(coState.address.city)}</p>${coState.pickupPoint ? `<p class="pickup-selected"><i class="fas fa-map-marker-alt"></i> ${safe(coState.pickupPoint.name || coState.pickupPoint)}</p>` : ''}</div>
          <div><h4>Platba a doprava</h4><p>${safe(ship?.name)}<br>${paymentLabel(coState.payment)}</p>${qr ? `<img class="payment-qr" src="${qrImg(qr)}" alt="QR platba"/>` : ''}</div>
        </div>
        <div class="summary-lines">
          <div class="summary-line"><span>Zboží</span><span>${money(DB.getCartTotal())}</span></div>
          ${discount ? `<div class="summary-line"><span>Sleva ${safe(coState.discount.code)}</span><span>-${money(discount)}</span></div>` : ''}
          <div class="summary-line"><span>Doprava</span><span>${ship?.price===0?'Zdarma':money(ship?.price || 0)}</span></div>
          <div class="summary-line total"><span>Celkem</span><span class="price">${money(total)}</span></div>
        </div>
        <div class="step-nav">
          <button class="step-nav-back" onclick="renderStep(4)"><i class="fas fa-arrow-left"></i> Zpět</button>
          <button class="step-nav-next" style="background:#2d6a4f" onclick="placeOrder()"><i class="fas fa-check"></i> Odeslat objednávku</button>
        </div>
      </div>`;
    };

    window.placeOrder = function () {
      const ship = shippingObject();
      const discount = getDiscountAmount();
      const items = DB.getCart().map(item => {
        const p = DB.getProducts().find(x => x.id === item.id);
        return { id: p.id, name: p.name, price: p.price, qty: item.qty };
      });
      const order = {
        items,
        customerEmail: currentUserEmail() || coState.address.email,
        address: coState.address,
        shipping: { id: coState.shipping, name: ship?.name, price: ship?.price || 0, pickupPoint: coState.pickupPoint },
        payment: coState.payment,
        paymentStatus: coState.payment === 'transfer' || coState.payment === 'card' ? 'pending' : 'unpaid',
        fulfillmentStatus: 'new',
        subtotal: DB.getCartTotal(),
        discount,
        discountCode: coState.discount?.code || '',
        total: orderTotal(),
        status: coState.payment === 'transfer' || coState.payment === 'card' ? 'ceka-na-platbu' : 'nova',
      };
      order.paymentQr = coState.payment === 'transfer' ? qrPayload({ id: `NO-${Date.now()}`, total: order.total }) : '';
      const orderId = DB.addOrder(order);
      const saved = DB.getOrders().find(o => o.id === orderId);
      if (coState.discount) markDiscountUsed(coState.discount.code, orderId);
      queueEmail(order.address.email, 'order-confirmation', `Potvrzení objednávky ${orderId}`, `<h1>Děkujeme za objednávku</h1><p>Objednávka ${orderId} je přijata.</p><p><a href="${orderUrl(saved || { ...order, id: orderId })}">Zobrazit detail objednávky</a></p>`);
      DB.clearCart();
      updateCartBadge();
      document.getElementById('checkoutMain').innerHTML = `<div class="step-panel order-success">
        <div class="success-icon"><i class="fas fa-check"></i></div>
        <h2>Objednávka přijata</h2>
        <p>Děkujeme, objednávku jsme uložili a připravili potvrzení e-mailu.</p>
        <div class="order-num">${orderId}</div>
        ${saved?.payment === 'transfer' ? `<p>Zaplaťte převodem nebo QR kódem:</p><img class="payment-qr" src="${qrImg(saved.paymentQr)}" alt="QR platba"/><p><strong>${money(saved.total)}</strong> na ${CONFIG.bankIban}</p>` : ''}
        <a href="objednavka.html?id=${encodeURIComponent(orderId)}&email=${encodeURIComponent(order.address.email)}" class="step-nav-next" style="margin-top:18px;text-decoration:none"><i class="fas fa-list"></i> Detail objednávky</a>
      </div>`;
      document.getElementById('orderSummary').innerHTML = '';
      $$('.step').forEach(el => { el.classList.remove('active'); el.classList.add('done'); });
      $$('.step .step-num').forEach(n => n.innerHTML = '<i class="fas fa-check"></i>');
    };

    window.renderSummary = function () {
      const sumEl = $('#orderSummary');
      if (!sumEl) return;
      const cart = DB.getCart();
      if (!cart.length) { sumEl.innerHTML = ''; return; }
      const ship = shippingObject();
      const discount = getDiscountAmount();
      const total = orderTotal();
      const items = cart.map(item => {
        const p = DB.getProducts().find(x => x.id === item.id);
        return p ? `<div class="summary-item"><span class="summary-item-name">${safe(p.name)} ×${item.qty}</span><span class="summary-item-price">${money(p.price * item.qty)}</span></div>` : '';
      }).join('');
      sumEl.innerHTML = `<h3>Souhrn objednávky</h3>
        <div class="summary-items">${items}</div>
        <div class="summary-lines">
          <div class="summary-line"><span>Mezisoučet</span><span>${money(DB.getCartTotal())}</span></div>
          ${discount ? `<div class="summary-line"><span>Sleva</span><span>-${money(discount)}</span></div>` : ''}
          <div class="summary-line"><span>Doprava</span><span>${ship ? (ship.price===0?'Zdarma':money(ship.price)) : '—'}</span></div>
          <div class="summary-line total"><span>Celkem</span><span class="price">${money(total)}</span></div>
        </div>
        <div style="font-size:.75rem;color:var(--text3);text-align:center"><i class="fas fa-lock"></i> Zabezpečené šifrování SSL</div>`;
    };

    try {
      renderStepCart = window.renderStepCart;
      applyDiscountCode = window.applyDiscountCode;
      renderStepShipping = window.renderStepShipping;
      initShippingEvents = window.initShippingEvents;
      renderPickupWidget = window.renderPickupWidget;
      openPickupWidget = window.openPickupWidget;
      proceedFromShipping = window.proceedFromShipping;
      renderStepPayment = window.renderStepPayment;
      initPaymentEvents = window.initPaymentEvents;
      renderConfirmation = window.renderConfirmation;
      placeOrder = window.placeOrder;
      renderSummary = window.renderSummary;
    } catch {}
  }

  function enhanceHeader() {
    const actions = $('.header-actions');
    if (!actions) return;
    if (!$('#narkyInfoLink')) {
      const link = document.createElement('a');
      link.id = 'narkyInfoLink';
      link.href = 'https://www.narky.cz/';
      link.target = '_blank';
      link.rel = 'noopener';
      link.className = 'hdr-action icon-btn';
      link.innerHTML = '<i class="fas fa-circle-info"></i><span>NARKY.cz</span>';
      actions.insertBefore(link, actions.firstChild);
    }
    if (!$('#accountHeaderBtn')) {
      const account = document.createElement('a');
      account.id = 'accountHeaderBtn';
      account.href = 'ucet.html';
      account.className = 'hdr-action icon-btn';
      account.innerHTML = `<i class="fas fa-user"></i><span>${currentUserEmail() ? 'Můj účet' : 'Přihlášení'}</span>`;
      actions.insertBefore(account, $('#wishlistHeaderBtn') || $('#cartBtn'));
    }
  }

  function patchNewsletter() {
    document.addEventListener('submit', event => {
      if (!event.target.matches('.newsletter-form')) return;
      const email = event.target.querySelector('input[type=email]')?.value.trim();
      if (!email) return;
      const code = makeNewsletterCode(email);
      const codes = ensureDiscountCodes();
      if (!codes.some(item => item.code === code)) codes.push({ code, percent: 5, used: false, source: 'newsletter', email, createdAt: new Date().toISOString() });
      setJson('narky_discount_codes', codes);
      saveSubscriber(email, code);
      queueEmail(email, 'newsletter-discount', 'Slevový kód NARKY.cz', `<h1>Váš slevový kód</h1><p>Kód <strong>${code}</strong> vám odečte 5 % z objednávky.</p>`);
    }, true);
  }

  function renderAccountPage() {
    const root = $('#accountApp');
    if (!root) return;
    const email = currentUserEmail();
    if (!email) {
      root.innerHTML = `<section class="account-panel"><h1>Můj účet</h1><div class="account-grid">
        <form id="loginForm"><h2>Přihlášení</h2><input name="email" type="email" placeholder="E-mail" required/><input name="password" type="password" placeholder="Heslo" required/><button>Přihlásit</button></form>
        <form id="registerForm"><h2>Registrace</h2><input name="name" placeholder="Jméno" required/><input name="email" type="email" placeholder="E-mail" required/><input name="password" type="password" placeholder="Heslo" required/><button>Vytvořit účet</button></form>
      </div></section>`;
      $('#loginForm').addEventListener('submit', async event => {
        event.preventDefault();
        const data = Object.fromEntries(new FormData(event.target));
        const user = getUsers().find(u => u.email.toLowerCase() === data.email.toLowerCase());
        if (!user || user.passwordHash !== await sha256(data.password)) { Toast?.error('Nesprávné přihlášení.'); return; }
        localStorage.setItem('narky_current_user', user.email);
        renderAccountPage();
      });
      $('#registerForm').addEventListener('submit', async event => {
        event.preventDefault();
        const data = Object.fromEntries(new FormData(event.target));
        const users = getUsers();
        if (users.some(u => u.email.toLowerCase() === data.email.toLowerCase())) { Toast?.error('Účet už existuje.'); return; }
        users.push({ name: data.name, email: data.email, passwordHash: await sha256(data.password), createdAt: new Date().toISOString() });
        saveUsers(users);
        localStorage.setItem('narky_current_user', data.email);
        const localWish = json('narky_wishlist', []);
        setJson(`narky_wishlist_${data.email.toLowerCase()}`, localWish);
        renderAccountPage();
      });
      return;
    }
    const orders = DB.getOrders().filter(o => (o.customerEmail || o.address?.email || '').toLowerCase() === email.toLowerCase());
    const wishIds = json(`narky_wishlist_${email.toLowerCase()}`, []);
    const wishItems = DB.getProducts().filter(p => wishIds.includes(p.id));
    root.innerHTML = `<section class="account-panel">
      <div class="account-head"><h1>Můj účet</h1><button onclick="NarkyBusiness.logout()">Odhlásit</button></div>
      <p>Přihlášen: <strong>${safe(email)}</strong></p>
      <h2>Moje objednávky</h2>
      <div class="account-list">${orders.length ? orders.map(o => `<a href="objednavka.html?id=${o.id}&email=${encodeURIComponent(email)}"><strong>${o.id}</strong><span>${statusLabel(o.status)} · ${paymentStatusLabel(o.paymentStatus)} · ${money(o.total)}</span></a>`).join('') : '<p>Zatím tu nejsou žádné objednávky.</p>'}</div>
      <h2>Oblíbené produkty</h2>
      <div class="account-list">${wishItems.length ? wishItems.map(p => `<a href="produkt.html?id=${p.id}"><strong>${safe(p.name)}</strong><span>${money(p.price)}</span></a>`).join('') : '<p>Zatím nemáte žádné oblíbené produkty.</p>'}</div>
    </section>`;
  }

  function renderOrderDetailPage() {
    const root = $('#orderDetailApp');
    if (!root) return;
    const params = new URLSearchParams(location.search);
    const id = params.get('id');
    const email = (params.get('email') || currentUserEmail()).toLowerCase();
    const order = DB.getOrders().find(o => o.id === id && (!email || (o.address?.email || o.customerEmail || '').toLowerCase() === email));
    if (!order) { root.innerHTML = '<section class="account-panel"><h1>Objednávka nenalezena</h1><p>Zkontrolujte odkaz nebo se přihlaste.</p></section>'; return; }
    root.innerHTML = `<section class="account-panel">
      <h1>Objednávka ${order.id}</h1>
      <div class="order-status-timeline">
        ${['ceka-na-platbu','pripravujeme','expedovano','doruceno'].map(step => `<div class="${order.status === step ? 'active' : ''}"><i class="fas fa-circle"></i><span>${statusLabel(step)}</span></div>`).join('')}
      </div>
      <p><strong>Stav:</strong> ${statusLabel(order.status)} · <strong>Platba:</strong> ${paymentStatusLabel(order.paymentStatus)} · <strong>Expedice:</strong> ${fulfillmentLabel(order.fulfillmentStatus)}</p>
      <h2>Položky</h2>
      ${order.items.map(i => `<div class="summary-item"><span>${safe(i.name)} ×${i.qty}</span><span>${money(i.price * i.qty)}</span></div>`).join('')}
      <div class="summary-lines"><div class="summary-line total"><span>Celkem</span><span>${money(order.total)}</span></div></div>
      ${order.payment === 'transfer' && order.paymentStatus !== 'paid' ? `<h2>Platba převodem</h2><img class="payment-qr" src="${qrImg(order.paymentQr || qrPayload(order))}" alt="QR platba"/><p>${CONFIG.bankIban}</p>` : ''}
    </section>`;
  }

  function renderAdminEnhancements() {
    if (!document.body.classList.contains('admin-body')) return;
    const productsSection = $('#s-products .section-header-row');
    if (productsSection && !$('#newProductBtn')) {
      const btn = document.createElement('button');
      btn.id = 'newProductBtn';
      btn.className = 'btn-primary';
      btn.innerHTML = '<i class="fas fa-plus"></i> Přidat produkt';
      btn.onclick = () => openProductEditor();
      productsSection.appendChild(btn);
    }
    if (!$('#businessAdminModals')) {
      const wrap = document.createElement('div');
      wrap.id = 'businessAdminModals';
      wrap.innerHTML = `<div class="modal-overlay" id="productEditorModal" style="display:none"><div class="modal-box product-editor-box">
        <div class="modal-header"><h3 id="productEditorTitle">Produkt</h3><button onclick="closeProductEditor()"><i class="fas fa-times"></i></button></div>
        <form class="modal-body product-editor-form" id="productEditorForm">
          <input type="hidden" name="id"/>
          <label>Název<input name="name" required/></label>
          <label>Značka<input name="brand" required/></label>
          <label>Kategorie<select name="category">${DB.categories.map(c => `<option value="${c.id}">${c.name}</option>`).join('')}</select></label>
          <label>Cena<input name="price" type="number" required/></label>
          <label>Původní cena<input name="priceOld" type="number"/></label>
          <label>Sklad<input name="stock" type="number" min="0" required/></label>
          <label>Váha kg<input name="weight" type="number" step="0.1" required/></label>
          <label>Délka cm<input name="length" type="number" required/></label>
          <label>Šířka cm<input name="width" type="number" required/></label>
          <label>Výška cm<input name="height" type="number" required/></label>
          <label>Fotky URL, každá na nový řádek<textarea name="images" rows="3"></textarea></label>
          <label>Popisek<textarea name="description" rows="4"></textarea></label>
          <label>Parametry JSON<textarea name="specs" rows="4" placeholder='{"výkon":"1200 W"}'></textarea></label>
          <label>Štítky<input name="tags" placeholder="bestseller,sleva,novinka"/></label>
          <div class="modal-footer"><button type="button" class="btn-ghost" onclick="closeProductEditor()">Zrušit</button><button class="btn-primary">Uložit produkt</button></div>
        </form>
      </div></div>`;
      document.body.appendChild(wrap);
      $('#productEditorForm').addEventListener('submit', event => {
        event.preventDefault();
        const data = Object.fromEntries(new FormData(event.target));
        let specs = {};
        try { specs = data.specs ? JSON.parse(data.specs) : {}; } catch { Toast?.error('Parametry musí být platné JSON.'); return; }
        const product = {
          id: data.id ? Number(data.id) : undefined,
          name: data.name,
          brand: data.brand,
          category: data.category,
          price: Number(data.price),
          priceOld: data.priceOld ? Number(data.priceOld) : null,
          stock: Number(data.stock),
          stockStatus: Number(data.stock) > 0 ? 'skladem' : 'neni-skladem',
          weight: Number(data.weight),
          dimensions: { length: Number(data.length), width: Number(data.width), height: Number(data.height) },
          images: data.images.split(/\n+/).map(s => s.trim()).filter(Boolean),
          description: data.description,
          specs,
          tags: data.tags.split(',').map(s => s.trim()).filter(Boolean),
          sales: 0,
          sizeClass: 'custom',
        };
        if (product.id) DB.updateProduct(product.id, product);
        else DB.addProduct(product);
        Security?.audit?.('product_save', product.name);
        closeProductEditor();
        renderProducts();
      });
    }

    window.renderProducts = function () {
      const body = $('#productsBody');
      if (!body) return;
      body.innerHTML = DB.getProducts().map(p => `<tr>
        <td>${p.id}</td><td style="color:#f0f2f8;font-weight:700">${safe(p.name)}</td><td>${safe(p.brand)}</td>
        <td>${DB.categories.find(c=>c.id===p.category)?.name || p.category}</td><td>${money(p.price)}</td>
        <td>${p.stock} ks</td><td>${p.weight} kg · ${p.dimensions.length}×${p.dimensions.width}×${p.dimensions.height} cm</td>
        <td><button class="table-action-btn btn-view" onclick="openProductEditor(${p.id})"><i class="fas fa-edit"></i> Upravit</button> <button class="table-action-btn" onclick="deleteProductAdmin(${p.id})"><i class="fas fa-trash"></i></button></td>
      </tr>`).join('');
    };

    window.renderOrders = function () {
      const orders = DB.getOrders();
      const body = $('#ordersBody');
      if (!body) return;
      $('#ordersTable thead tr').innerHTML = '<th>Č. obj.</th><th>Datum</th><th>Zákazník</th><th>Celkem</th><th>Platba</th><th>Objednávka</th><th>Expedice</th><th>Akce</th>';
      body.innerHTML = orders.map(o => `<tr>
        <td style="font-weight:700;color:#f0f2f8">${o.id}</td><td>${new Date(o.date).toLocaleDateString('cs-CZ')}</td>
        <td style="color:#f0f2f8">${safe(o.address?.name || '')}<br><small>${safe(o.address?.email || '')}</small></td>
        <td style="color:var(--primary);font-weight:800">${money(o.total)}</td>
        <td><select class="status-select" onchange="updatePaymentStatus('${o.id}',this.value)">${['unpaid','pending','paid','failed','refunded'].map(s => `<option value="${s}"${o.paymentStatus===s?' selected':''}>${paymentStatusLabel(s)}</option>`).join('')}</select></td>
        <td><select class="status-select" onchange="updateOrderStatus('${o.id}',this.value)">${['nova','ceka-na-platbu','zaplaceno','pripravujeme','ceka-na-expedici','expedovano','doruceno','zrusena'].map(s => `<option value="${s}"${o.status===s?' selected':''}>${statusLabel(s)}</option>`).join('')}</select></td>
        <td><select class="status-select" onchange="updateFulfillmentStatus('${o.id}',this.value)">${['new','preparing','ready','shipped','delivered','cancelled'].map(s => `<option value="${s}"${o.fulfillmentStatus===s?' selected':''}>${fulfillmentLabel(s)}</option>`).join('')}</select></td>
        <td><button class="table-action-btn btn-view" onclick="viewOrder('${o.id}')"><i class="fas fa-eye"></i> Detail</button></td>
      </tr>`).join('');
    };

    window.updatePaymentStatus = function (id, paymentStatus) {
      const orders = DB.getOrders();
      const order = orders.find(o => o.id === id);
      if (!order) return;
      const wasPaid = order.paymentStatus === 'paid';
      order.paymentStatus = paymentStatus;
      if (paymentStatus === 'paid') {
        order.status = 'zaplaceno';
        if (!wasPaid) queueEmail(order.address.email, 'payment-received', `Platba přijata ${order.id}`, `<h1>Platba přijata</h1><p>Objednávku ${order.id} jsme označili jako zaplacenou.</p>`);
      }
      DB.saveOrders(orders);
      renderOrders();
      renderDashboard();
    };

    window.updateFulfillmentStatus = function (id, fulfillmentStatus) {
      const orders = DB.getOrders();
      const order = orders.find(o => o.id === id);
      if (!order) return;
      const wasShipped = order.fulfillmentStatus === 'shipped';
      order.fulfillmentStatus = fulfillmentStatus;
      if (fulfillmentStatus === 'shipped') {
        order.status = 'expedovano';
        if (!wasShipped) queueEmail(order.address.email, 'order-shipped', `Objednávka ${order.id} expedována`, `<h1>Zboží je odesláno</h1><p>Objednávka ${order.id} byla expedována.</p>`);
      }
      if (fulfillmentStatus === 'delivered') order.status = 'doruceno';
      DB.saveOrders(orders);
      renderOrders();
      renderDashboard();
    };

    function renderOpsDashboard() {
      const dashboard = $('#s-dashboard');
      if (!dashboard) return;
      let panel = $('#businessOpsPanel');
      if (!panel) {
        panel = document.createElement('div');
        panel.id = 'businessOpsPanel';
        panel.className = 'dash-row business-ops-panel';
        dashboard.appendChild(panel);
      }
      const subscribers = json('narky_newsletter', []);
      const outbox = json('narky_email_outbox', []);
      panel.innerHTML = `
        <div class="dash-card">
          <h3>Newsletter</h3>
          <div class="ops-list">
            ${subscribers.length ? subscribers.slice(0, 8).map(item => `<div><strong>${safe(item.email)}</strong><span>${safe(item.code || '')}</span></div>`).join('') : '<p>Zatím žádní odběratelé.</p>'}
          </div>
        </div>
        <div class="dash-card">
          <h3>Fronta e-mailů</h3>
          <div class="ops-list">
            ${outbox.length ? outbox.slice(0, 8).map(mail => `<div><strong>${safe(mail.to)}</strong><span>${safe(mail.type)} · ${safe(mail.status)}</span></div>`).join('') : '<p>Žádné e-maily ve frontě.</p>'}
          </div>
        </div>`;
    }

    const originalRenderDashboard = window.renderDashboard;
    window.renderDashboard = function () {
      if (typeof originalRenderDashboard === 'function') originalRenderDashboard();
      renderOpsDashboard();
    };
    try { renderDashboard = window.renderDashboard; } catch {}
    renderOpsDashboard();
  }

  window.openProductEditor = function (id) {
    const product = id ? DB.getProducts().find(p => p.id === Number(id)) : null;
    const form = $('#productEditorForm');
    if (!form) return;
    const fields = form.elements;
    form.reset();
    $('#productEditorTitle').textContent = product ? 'Upravit produkt' : 'Přidat produkt';
    fields.id.value = product?.id || '';
    fields.name.value = product?.name || '';
    fields.brand.value = product?.brand || '';
    fields.category.value = product?.category || DB.categories[0].id;
    fields.price.value = product?.price || '';
    fields.priceOld.value = product?.priceOld || '';
    fields.stock.value = product?.stock || 0;
    fields.weight.value = product?.weight || 1;
    fields.length.value = product?.dimensions?.length || 35;
    fields.width.value = product?.dimensions?.width || 25;
    fields.height.value = product?.dimensions?.height || 15;
    fields.images.value = (product?.images || []).join('\n');
    fields.description.value = product?.description || '';
    fields.specs.value = JSON.stringify(product?.specs || {}, null, 2);
    fields.tags.value = (product?.tags || []).join(',');
    $('#productEditorModal').style.display = 'flex';
  };
  window.closeProductEditor = () => { const modal = $('#productEditorModal'); if (modal) modal.style.display = 'none'; };
  window.deleteProductAdmin = id => { if (confirm('Opravdu smazat produkt?')) { DB.deleteProduct(id); renderProducts(); } };

  window.NarkyBusiness = {
    logout() { localStorage.removeItem('narky_current_user'); location.href = 'ucet.html'; },
    queueEmail,
    statusLabel,
  };

  ensureDiscountCodes();
  renderCheckoutOverrides();
  patchNewsletter();
  document.addEventListener('DOMContentLoaded', () => {
    enhanceHeader();
    renderAccountPage();
    renderOrderDetailPage();
    renderAdminEnhancements();
  });
})();
