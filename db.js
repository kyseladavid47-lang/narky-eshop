// NARKY shared product, cart and order data.
// Client-side storage is demo-only; production needs a backend database.
var DB = {

  // ── PRODUCTS ─────────────────────────────────────────────
  products: [
    // SEKAČKY
    { id: 1, slug: 'husqvarna-lc353v', name: 'Husqvarna LC 353V – motorová sekačka', brand: 'Husqvarna', category: 'sekacky', subcategory: 'benzinove-sekacky', price: 12990, priceOld: 14990, stock: 5, stockStatus: 'skladem', images: ['https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=600&q=80'], description: 'Výkonná motorová sekačka s pojezdem, ideální pro středně velké zahrady.', specs: { engine: '140 cm³', width: '53 cm', drive: 'Pojezd', weight: '32 kg' }, tags: ['bestseller'], sales: 128, weight: 32, sizeClass: 'large' },
    { id: 2, slug: 'husqvarna-lc141p', name: 'Husqvarna LC141P – aku sekačka', brand: 'Husqvarna', category: 'sekacky', subcategory: 'aku-sekacky', price: 8990, priceOld: null, stock: 8, stockStatus: 'skladem', images: ['https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=600&q=80'], description: 'Bezdrátová aku sekačka. Tichá, bez výfuku, ideální do menší zahrady.', specs: { battery: '40V 2.5Ah', width: '41 cm', drive: 'Ruční', weight: '14 kg' }, tags: ['novinka'], sales: 56, weight: 14, sizeClass: 'medium' },
    { id: 3, slug: 'stihl-rma448tc', name: 'STIHL RMA 448 TC – aku sekačka', brand: 'STIHL', category: 'sekacky', subcategory: 'aku-sekacky', price: 15490, priceOld: 16990, stock: 3, stockStatus: 'skladem', images: ['https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=600&q=80'], description: 'Profesionální aku sekačka STIHL s pojezdem. Výkonná a tichá.', specs: { battery: '36V 5.2Ah', width: '48 cm', drive: 'Pojezd', weight: '22 kg' }, tags: ['bestseller', 'sleva'], sales: 89, weight: 22, sizeClass: 'large' },
    { id: 4, slug: 'honda-hrg416vkeh', name: 'Honda HRG 416 VKE H – sekačka', brand: 'Honda', category: 'sekacky', subcategory: 'benzinove-sekacky', price: 17500, priceOld: null, stock: 2, stockStatus: 'skladem', images: ['https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=600&q=80'], description: 'Japonská kvalita Honda s automatickým pojezdem a mulčováním.', specs: { engine: '166 cm³', width: '41 cm', drive: 'Automatický pojezd', weight: '28 kg' }, tags: [], sales: 45, weight: 28, sizeClass: 'large' },
    
    // MOTOROVÉ PILY
    { id: 5, slug: 'husqvarna-445e', name: 'Husqvarna 445e – motorová pila', brand: 'Husqvarna', category: 'motorove-pily', subcategory: 'benzinove-pily', price: 9990, priceOld: 11490, stock: 6, stockStatus: 'skladem', images: ['https://images.unsplash.com/photo-1504148455328-c376907d081c?w=600&q=80'], description: 'Profesionální motorová pila pro náročné sekání dřeva i v lese.', specs: { engine: '50.1 cm³', bar: '45 cm', weight: '5.1 kg' }, tags: ['bestseller', 'sleva'], sales: 201, weight: 5.1, sizeClass: 'medium' },
    { id: 6, slug: 'stihl-ms261c', name: 'STIHL MS 261 C-M – motorová pila', brand: 'STIHL', category: 'motorove-pily', subcategory: 'benzinove-pily', price: 18900, priceOld: null, stock: 4, stockStatus: 'skladem', images: ['https://images.unsplash.com/photo-1504148455328-c376907d081c?w=600&q=80'], description: 'Profesionální pila pro těžké podmínky s technologií M-Tronic.', specs: { engine: '50.2 cm³', bar: '40-45 cm', weight: '5.6 kg' }, tags: [], sales: 77, weight: 5.6, sizeClass: 'medium' },
    { id: 7, slug: 'husqvarna-120i', name: 'Husqvarna 120i – aku pila', brand: 'Husqvarna', category: 'motorove-pily', subcategory: 'aku-pily', price: 7490, priceOld: 8490, stock: 7, stockStatus: 'skladem', images: ['https://images.unsplash.com/photo-1504148455328-c376907d081c?w=600&q=80'], description: 'Lehká aku pila pro příležitostné řezání. Tichá a bez výfuku.', specs: { battery: '36V', bar: '30 cm', weight: '2.9 kg' }, tags: ['sleva'], sales: 63, weight: 2.9, sizeClass: 'small' },
    
    // KŘOVINOŘEZY
    { id: 8, slug: 'husqvarna-525l', name: 'Husqvarna 525L – křovinořez', brand: 'Husqvarna', category: 'krovinorezy', subcategory: 'benzinove-krovinorezy', price: 8900, priceOld: null, stock: 5, stockStatus: 'skladem', images: ['https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=600&q=80'], description: 'Lehký a výkonný křovinořez pro údržbu zahrady i svahů.', specs: { engine: '25.4 cm³', head: '2-hrot nylonový', weight: '4.8 kg' }, tags: [], sales: 95, weight: 4.8, sizeClass: 'medium' },
    { id: 9, slug: 'stihl-fs90r', name: 'STIHL FS 90 R – křovinořez', brand: 'STIHL', category: 'krovinorezy', subcategory: 'benzinove-krovinorezy', price: 12490, priceOld: null, stock: 3, stockStatus: 'skladem', images: ['https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=600&q=80'], description: 'Profesionální křovinořez s anti-vibračním systémem. Pro lesní brigády.', specs: { engine: '40.2 cm³', head: 'Kombinovaný', weight: '5.5 kg' }, tags: ['bestseller'], sales: 112, weight: 5.5, sizeClass: 'medium' },
    { id: 10, slug: 'makita-ur3501', name: 'Makita UR3501 – aku strunový sekáč', brand: 'Makita', category: 'krovinorezy', subcategory: 'aku-krovinorezy', price: 4290, priceOld: 5490, stock: 10, stockStatus: 'skladem', images: ['https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=600&q=80'], description: 'Kompaktní aku sekáč pro úpravu trávy u plotů a rohů.', specs: { battery: '18V', head: 'Nylonový', weight: '2.1 kg' }, tags: ['sleva'], sales: 178, weight: 2.1, sizeClass: 'small' },
    
    // TRAKTORY
    { id: 11, slug: 'husqvarna-ts348', name: 'Husqvarna TS 348 – zahradní traktor', brand: 'Husqvarna', category: 'traktory', subcategory: 'zahradni-traktory', price: 89990, priceOld: 99990, stock: 1, stockStatus: 'skladem', images: ['https://images.unsplash.com/photo-1464226184884-fa280b87c399?w=600&q=80'], description: 'Výkonný zahradní traktor s hydrostátem pro velké zahrady nad 4000 m².', specs: { engine: 'Briggs 24 HP', width: '122 cm', drive: 'Hydrostát', weight: '330 kg' }, tags: ['top'], sales: 12, weight: 330, sizeClass: 'xtralarge' },
    { id: 12, slug: 'husqvarna-ts342', name: 'Husqvarna TS 342 – zahradní traktor', brand: 'Husqvarna', category: 'traktory', subcategory: 'zahradni-traktory', price: 69990, priceOld: null, stock: 2, stockStatus: 'skladem', images: ['https://images.unsplash.com/photo-1464226184884-fa280b87c399?w=600&q=80'], description: 'Spolehlivý zahradní traktor pro zahrady 2000–4000 m². Snímatelný koš.', specs: { engine: 'Briggs 21.5 HP', width: '107 cm', drive: 'Automatický', weight: '270 kg' }, tags: [], sales: 19, weight: 270, sizeClass: 'xtralarge' },
    { id: 13, slug: 'stiga-estate698', name: 'STIGA Estate 698 W – zahradní traktor', brand: 'STIGA', category: 'traktory', subcategory: 'zahradni-traktory', price: 79900, priceOld: 84900, stock: 0, stockStatus: 'brzy-dorazi', images: ['https://images.unsplash.com/photo-1464226184884-fa280b87c399?w=600&q=80'], description: 'Prémiový traktor s 4WD pohonem pro náročné terény.', specs: { engine: 'Briggs 23 HP', width: '107 cm', drive: '4WD', weight: '295 kg' }, tags: ['sleva'], sales: 8, weight: 295, sizeClass: 'xtralarge' },
    
    // FOUKAČE LISTÍ
    { id: 14, slug: 'husqvarna-125bvx', name: 'Husqvarna 125BVX – foukač listí', brand: 'Husqvarna', category: 'foukace', subcategory: 'benzinove-foukace', price: 4490, priceOld: 5290, stock: 8, stockStatus: 'skladem', images: ['https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=600&q=80'], description: 'Lehký foukač/vysavač listí s benzínovým motorem. Rychlá podzimní úklid.', specs: { engine: '28 cm³', airflow: '12.9 m³/min', weight: '4.9 kg' }, tags: ['sleva'], sales: 134, weight: 4.9, sizeClass: 'medium' },
    { id: 15, slug: 'stihl-bga56', name: 'STIHL BGA 56 – aku foukač', brand: 'STIHL', category: 'foukace', subcategory: 'aku-foukace', price: 5490, priceOld: null, stock: 6, stockStatus: 'skladem', images: ['https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=600&q=80'], description: 'Tichý aku foukač pro rychlý úklid listí bez hluku a výfuku.', specs: { battery: '36V', airflow: '11.5 m³/min', weight: '2.4 kg' }, tags: ['novinka'], sales: 67, weight: 2.4, sizeClass: 'small' },
    
    // MULČOVAČE
    { id: 16, slug: 'husqvarna-tf545d', name: 'Husqvarna TF 545D – mulčovač', brand: 'Husqvarna', category: 'mulcovace', subcategory: 'zahradni-mulcovace', price: 22990, priceOld: null, stock: 3, stockStatus: 'skladem', images: ['https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=600&q=80'], description: 'Výkonný bubnový mulčovač pro velké zahrady. Mlátí větve do 6 cm.', specs: { engine: 'Briggs 205 cm³', width: '45 cm', weight: '60 kg' }, tags: ['bestseller'], sales: 29, weight: 60, sizeClass: 'xlarge' },
    { id: 17, slug: 'viking-ge355', name: 'VIKING GE 355 – elektrický mulčovač', brand: 'VIKING', category: 'mulcovace', subcategory: 'elektricke-mulcovace', price: 7990, priceOld: 9490, stock: 4, stockStatus: 'skladem', images: ['https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=600&q=80'], description: 'Elektrický mulčovač pro menší zahrady, větvičky do 35 mm.', specs: { power: '2500W', width: '40 cm', weight: '15 kg' }, tags: ['sleva'], sales: 42, weight: 15, sizeClass: 'large' },
    
    // VYSOKOTLAKÉ ČERPADLA
    { id: 18, slug: 'karcher-k5-premium', name: 'Kärcher K5 Premium – tlaková myčka', brand: 'Kärcher', category: 'tlakove-mycky', subcategory: 'elektricke-mycky', price: 8990, priceOld: 10490, stock: 9, stockStatus: 'skladem', images: ['https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80'], description: 'Výkonná tlaková myčka 145 bar s přívěsem na hadici. Na auto i terasu.', specs: { pressure: '145 bar', flow: '500 l/h', power: '2300W', weight: '13 kg' }, tags: ['bestseller', 'sleva'], sales: 223, weight: 13, sizeClass: 'medium' },
    { id: 19, slug: 'karcher-k3-compact', name: 'Kärcher K3 Compact – tlaková myčka', brand: 'Kärcher', category: 'tlakove-mycky', subcategory: 'elektricke-mycky', price: 4590, priceOld: 5490, stock: 12, stockStatus: 'skladem', images: ['https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80'], description: 'Kompaktní myčka pro domácnost a auto. Snadné uložení.', specs: { pressure: '120 bar', flow: '380 l/h', power: '1600W', weight: '5.5 kg' }, tags: ['sleva'], sales: 312, weight: 5.5, sizeClass: 'small' },
    
    // ELEKTRICKÉ NÁŘADÍ
    { id: 20, slug: 'makita-dhr243z', name: 'Makita DHR243Z – aku vrtací kladivo', brand: 'Makita', category: 'elektricke-naradi', subcategory: 'vrtacky', price: 5990, priceOld: null, stock: 7, stockStatus: 'skladem', images: ['https://images.unsplash.com/photo-1504148455328-c376907d081c?w=600&q=80'], description: 'Profesionální aku vrtací kladivo SDS+ bez baterií. 3 funkce v 1.', specs: { battery: '18V', impact: '2.0 J', weight: '2.9 kg' }, tags: [], sales: 88, weight: 2.9, sizeClass: 'small' },
    { id: 21, slug: 'bosch-gks185-li', name: 'Bosch GKS 185-LI – aku okružní pila', brand: 'Bosch', category: 'elektricke-naradi', subcategory: 'pily', price: 7290, priceOld: 8490, stock: 5, stockStatus: 'skladem', images: ['https://images.unsplash.com/photo-1504148455328-c376907d081c?w=600&q=80'], description: 'Lehká aku okružní pila pro řezání dřeva, desek a laminátů.', specs: { battery: '18V', blade: '165 mm', weight: '3.7 kg' }, tags: ['sleva'], sales: 71, weight: 3.7, sizeClass: 'small' },
    { id: 22, slug: 'dewalt-dcd796d2', name: 'DeWALT DCD796D2 – aku příklepový šroubovák', brand: 'DeWALT', category: 'elektricke-naradi', subcategory: 'sroubovaky', price: 6990, priceOld: null, stock: 6, stockStatus: 'skladem', images: ['https://images.unsplash.com/photo-1504148455328-c376907d081c?w=600&q=80'], description: 'Kompaktní aku šroubovák s příklepem. Sada 2× 2Ah baterií + nabíječka.', specs: { battery: '18V 2Ah', torque: '70 Nm', weight: '1.59 kg' }, tags: [], sales: 145, weight: 1.59, sizeClass: 'small' },
    
    // ZAHRADNÍ ČERPADLA
    { id: 23, slug: 'grundfos-cm5a', name: 'Grundfos CM5-A – zahradní čerpadlo', brand: 'Grundfos', category: 'cerpadla', subcategory: 'zahradni-cerpadla', price: 9490, priceOld: null, stock: 4, stockStatus: 'skladem', images: ['https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=600&q=80'], description: 'Nerezové čerpadlo pro zahradní závlahu i cirkulaci. Tichý provoz.', specs: { power: '750W', flow: '65 l/min', head: '43 m', weight: '5.3 kg' }, tags: [], sales: 34, weight: 5.3, sizeClass: 'medium' },
    { id: 24, slug: 'al-ko-hw1300', name: 'AL-KO HW 1300 – domácí vodárna', brand: 'AL-KO', category: 'cerpadla', subcategory: 'vodarny', price: 6990, priceOld: 7990, stock: 5, stockStatus: 'skladem', images: ['https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=600&q=80'], description: 'Kompletní domácí vodárna s tlakovým spínačem a nádrží 24 l.', specs: { power: '1300W', pressure: '4.5 bar', tank: '24 l', weight: '18 kg' }, tags: ['sleva'], sales: 58, weight: 18, sizeClass: 'large' },
    
    // PŘÍSLUŠENSTVÍ
    { id: 25, slug: 'husqvarna-olej-2t', name: 'Husqvarna 2-taktní olej 1 l', brand: 'Husqvarna', category: 'prislusenstvi', subcategory: 'oleje-a-maziva', price: 299, priceOld: null, stock: 50, stockStatus: 'skladem', images: ['https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80'], description: 'Originální 2-taktní olej Husqvarna. Mísicí poměr 1:50.', specs: { volume: '1 l', mix: '1:50' }, tags: [], sales: 487, weight: 1.1, sizeClass: 'small' },
    { id: 26, slug: 'stihl-retezovka-olej', name: 'STIHL BioPlus – olej na řetěz 1 l', brand: 'STIHL', category: 'prislusenstvi', subcategory: 'oleje-a-maziva', price: 249, priceOld: null, stock: 40, stockStatus: 'skladem', images: ['https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80'], description: 'Biologicky odbouratelný olej na řetěz. Vhodný pro všechny pily.', specs: { volume: '1 l' }, tags: [], sales: 356, weight: 1.1, sizeClass: 'small' },
    { id: 27, slug: 'husqvarna-helma', name: 'Husqvarna Technical – ochranná helma', brand: 'Husqvarna', category: 'prislusenstvi', subcategory: 'ochrana', price: 1890, priceOld: 2290, stock: 8, stockStatus: 'skladem', images: ['https://images.unsplash.com/photo-1504148455328-c376907d081c?w=600&q=80'], description: 'Ochranná helma s hledím a chrániči sluchu pro práci s pilou.', specs: { protection: 'EN 397', hearing: '27 dB SNR' }, tags: ['sleva'], sales: 76, weight: 0.6, sizeClass: 'small' },
    { id: 28, slug: 'husqvarna-rukavice', name: 'Husqvarna – protipořezové rukavice', brand: 'Husqvarna', category: 'prislusenstvi', subcategory: 'ochrana', price: 890, priceOld: null, stock: 15, stockStatus: 'skladem', images: ['https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=600&q=80'], description: 'Protipořezové rukavice třída C. Komfortní střih.', specs: { class: 'C', material: 'Kevlar' }, tags: [], sales: 203, weight: 0.3, sizeClass: 'small' },
  ],

  categories: [
    { id: 'sekacky', name: 'Sekačky', icon: 'fa-seedling', subs: ['benzinove-sekacky','aku-sekacky'] },
    { id: 'motorove-pily', name: 'Motorové pily', icon: 'fa-tree', subs: ['benzinove-pily','aku-pily'] },
    { id: 'krovinorezy', name: 'Křovinořezy', icon: 'fa-leaf', subs: ['benzinove-krovinorezy','aku-krovinorezy'] },
    { id: 'traktory', name: 'Zahradní traktory', icon: 'fa-tractor', subs: ['zahradni-traktory'] },
    { id: 'foukace', name: 'Foukače listí', icon: 'fa-wind', subs: ['benzinove-foukace','aku-foukace'] },
    { id: 'mulcovace', name: 'Mulčovače', icon: 'fa-recycle', subs: ['zahradni-mulcovace','elektricke-mulcovace'] },
    { id: 'tlakove-mycky', name: 'Tlakové myčky', icon: 'fa-shower', subs: ['elektricke-mycky'] },
    { id: 'elektricke-naradi', name: 'El. nářadí', icon: 'fa-bolt', subs: ['vrtacky','pily','sroubovaky'] },
    { id: 'cerpadla', name: 'Čerpadla', icon: 'fa-tint', subs: ['zahradni-cerpadla','vodarny'] },
    { id: 'prislusenstvi', name: 'Příslušenství', icon: 'fa-toolbox', subs: ['oleje-a-maziva','ochrana'] },
  ],

  brands: ['Husqvarna','STIHL','Honda','Makita','Bosch','DeWALT','Kärcher','VIKING','AL-KO','STIGA','Grundfos'],

  // ── SHIPPING ──────────────────────────────────────────────
  shipping: [
    { id: 'osobni', name: 'Osobní odběr – Ostřetín', price: 0, desc: 'Zdarma – vyzvednutí na prodejně Po–Pá 8–16', icon: 'fa-store', sizeLimit: 'all' },
    { id: 'zasilkovna-point', name: 'Zásilkovna – výdejní místo', price: 89, desc: 'Cena pro zásilky do 10 kg / 50×40×30 cm', icon: 'fa-map-marker-alt', sizeLimit: 'small', widget: 'zasilkovna' },
    { id: 'ppl-point', name: 'PPL – výdejní místo ParcelShop', price: 129, desc: 'Zásilky do 15 kg / 100×60×60 cm', icon: 'fa-map-marker-alt', sizeLimit: 'medium', widget: 'ppl' },
    { id: 'zasilkovna-home', name: 'Zásilkovna – na adresu', price: 149, desc: 'Do 10 kg. Doručení 1–2 prac. dní', icon: 'fa-home', sizeLimit: 'small' },
    { id: 'ppl-home', name: 'PPL – doručení na adresu', price: 189, desc: 'Do 30 kg. Doručení 1–2 prac. dní', icon: 'fa-truck', sizeLimit: 'medium' },
    { id: 'dpd-home', name: 'DPD – doručení na adresu', price: 229, desc: 'Do 50 kg / nadrozměr. Doručení 2–3 prac. dní', icon: 'fa-truck', sizeLimit: 'large' },
    { id: 'paleta', name: 'Paletová přeprava – traktor/velké stroje', price: 1490, desc: 'Traktory a stroje nad 100 kg. Termín dohodou', icon: 'fa-pallet', sizeLimit: 'xtralarge' },
  ],

  // ── ORDERS ────────────────────────────────────────────────
  sanitizeText(value) {
    return String(value ?? '').replace(/[&<>"'`]/g, ch => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
      '`': '&#96;',
    }[ch]));
  },
  sanitizeOrder(order) {
    const safe = { ...(order || {}) };
    safe.status = ['nova','ceka-na-platbu','zaplaceno','pripravujeme','ceka-na-expedici','expedovano','doruceno','zrusena'].includes(safe.status) ? safe.status : 'nova';
    safe.paymentStatus = ['unpaid','pending','paid','failed','refunded'].includes(safe.paymentStatus) ? safe.paymentStatus : 'unpaid';
    safe.fulfillmentStatus = ['new','preparing','ready','shipped','delivered','cancelled'].includes(safe.fulfillmentStatus) ? safe.fulfillmentStatus : 'new';
    safe.discountCode = this.sanitizeText(safe.discountCode);
    safe.discount = Number(safe.discount) || 0;
    safe.paymentQr = this.sanitizeText(safe.paymentQr);
    safe.payment = this.sanitizeText(safe.payment);
    safe.address = Object.fromEntries(Object.entries(safe.address || {}).map(([key, value]) => [key, this.sanitizeText(value)]));
    safe.shipping = Object.fromEntries(Object.entries(safe.shipping || {}).map(([key, value]) => [key, key === 'price' ? Number(value) || 0 : this.sanitizeText(value)]));
    safe.items = Array.isArray(safe.items) ? safe.items.map(item => ({
      id: Number(item.id) || 0,
      name: this.sanitizeText(item.name),
      price: Number(item.price) || 0,
      qty: Math.max(1, Number.parseInt(item.qty, 10) || 1),
    })) : [];
    safe.subtotal = Number(safe.subtotal) || 0;
    safe.total = Number(safe.total) || safe.subtotal;
    return safe;
  },
  getOrders() {
    try {
      const orders = JSON.parse(localStorage.getItem('narky_orders') || '[]');
      return Array.isArray(orders) ? orders.map(order => this.sanitizeOrder(order)) : [];
    } catch {
      return [];
    }
  },
  saveOrders(orders) { localStorage.setItem('narky_orders', JSON.stringify((Array.isArray(orders) ? orders : []).map(order => this.sanitizeOrder(order)))); },
  addOrder(order) {
    const orders = this.getOrders();
    order = this.sanitizeOrder(order);
    order.id = 'NO-' + Date.now();
    order.date = new Date().toISOString();
    orders.unshift(order);
    this.saveOrders(orders);
    // Odečíst ze skladu
    order.items.forEach(item => {
      const p = this.products.find(p => p.id === item.id);
      if (p) {
        p.stock = Math.max(0, p.stock - item.qty);
        p.stockStatus = p.stock > 0 ? 'skladem' : 'neni-skladem';
      }
    });
    this.saveProducts();
    return order.id;
  },

  // ── PRODUCT STORAGE ───────────────────────────────────────
  packageDefaults: {
    small: { length: 35, width: 25, height: 15 },
    medium: { length: 60, width: 35, height: 25 },
    large: { length: 90, width: 60, height: 45 },
    xlarge: { length: 120, width: 80, height: 80 },
    xtralarge: { length: 180, width: 120, height: 120 },
  },
  shippingLimits: {
    osobni: { label: 'bez omezení' },
    'zasilkovna-point': { maxWeight: 10, maxLength: 50, maxWidth: 40, maxHeight: 30 },
    'zasilkovna-home': { maxWeight: 10, maxLength: 50, maxWidth: 40, maxHeight: 30 },
    'ppl-point': { maxWeight: 15, maxLength: 100, maxWidth: 60, maxHeight: 60 },
    'ppl-home': { maxWeight: 30, maxLength: 120, maxWidth: 80, maxHeight: 80 },
    'dpd-home': { maxWeight: 50, maxLength: 175, maxWidth: 80, maxHeight: 80 },
    paleta: { maxWeight: 1000, maxLength: 240, maxWidth: 140, maxHeight: 180 },
  },
  normalizeProduct(product) {
    const sizeClass = product.sizeClass || 'small';
    const fallback = this.packageDefaults[sizeClass] || this.packageDefaults.small;
    const dimensions = product.dimensions || product.package || fallback;
    const weight = Number(product.weight || String(product.specs?.weight || '').replace(',', '.').match(/[\d.]+/)?.[0] || 1);
    return {
      ...product,
      id: Number(product.id),
      price: Number(product.price) || 0,
      priceOld: product.priceOld ? Number(product.priceOld) : null,
      stock: Math.max(0, Number.parseInt(product.stock, 10) || 0),
      stockStatus: product.stockStatus || (Number(product.stock) > 0 ? 'skladem' : 'neni-skladem'),
      images: Array.isArray(product.images) && product.images.length ? product.images : ['https://images.unsplash.com/photo-1504148455328-c376907d081c?w=600&q=80'],
      specs: product.specs || {},
      tags: Array.isArray(product.tags) ? product.tags : [],
      sales: Number(product.sales) || 0,
      weight,
      dimensions: {
        length: Number(dimensions.length) || fallback.length,
        width: Number(dimensions.width) || fallback.width,
        height: Number(dimensions.height) || fallback.height,
      },
      sizeClass,
    };
  },
  getProducts() {
    this.products = this.products.map(p => this.normalizeProduct(p));
    const savedFull = localStorage.getItem('narky_products_full');
    const savedLegacy = localStorage.getItem('narky_products');
    if (savedFull) {
      try {
        const saved = JSON.parse(savedFull);
        if (Array.isArray(saved) && saved.length) this.products = saved.map(p => this.normalizeProduct(p));
      } catch {}
    } else if (savedLegacy) {
      try {
        const saved = JSON.parse(savedLegacy);
        this.products.forEach((p, i) => {
          const found = saved.find(x => Number(x.id) === p.id);
          if (found) this.products[i] = this.normalizeProduct({ ...p, stock: found.stock, stockStatus: found.stockStatus });
        });
      } catch {}
    }
    return this.products;
  },
  saveProducts() {
    this.products = this.products.map(p => this.normalizeProduct(p));
    localStorage.setItem('narky_products_full', JSON.stringify(this.products));
    localStorage.setItem('narky_products', JSON.stringify(this.products.map(p => ({ id: p.id, stock: p.stock, stockStatus: p.stockStatus }))));
  },
  updateProduct(id, changes) {
    const idx = this.products.findIndex(p => p.id === id);
    if (idx > -1) { this.products[idx] = this.normalizeProduct({ ...this.products[idx], ...changes }); this.saveProducts(); }
  },
  addProduct(product) {
    const id = Number(product.id) || Math.max(0, ...this.products.map(p => Number(p.id) || 0)) + 1;
    const slug = product.slug || this.slugify(product.name || `produkt-${id}`);
    const next = this.normalizeProduct({ ...product, id, slug });
    this.products.push(next);
    this.saveProducts();
    return next;
  },
  deleteProduct(id) {
    this.products = this.products.filter(p => p.id !== Number(id));
    this.saveProducts();
  },
  slugify(value) {
    return String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || `produkt-${Date.now()}`;
  },

  // ── CART ──────────────────────────────────────────────────
  getCart() {
    try {
      const raw = JSON.parse(localStorage.getItem('narky_cart') || '[]');
      if (!Array.isArray(raw)) return [];
      return raw.reduce((items, item) => {
        const id = Number(item?.id);
        const product = this.products.find(p => p.id === id);
        if (!product || product.stockStatus === 'neni-skladem') return items;
        const maxQty = Math.max(1, Number(product.stock) || 99);
        const qty = Math.min(maxQty, Math.max(1, Number.parseInt(item?.qty, 10) || 1));
        const existing = items.find(i => i.id === id);
        if (existing) existing.qty = Math.min(maxQty, existing.qty + qty);
        else items.push({ id, qty });
        return items;
      }, []);
    } catch {
      return [];
    }
  },
  saveCart(cart) {
    const safeCart = Array.isArray(cart) ? cart : [];
    localStorage.setItem('narky_cart', JSON.stringify(safeCart));
    window.dispatchEvent(new CustomEvent('cartUpdate'));
  },
  addToCart(productId, qty = 1) {
    const id = Number(productId);
    const product = this.products.find(p => p.id === id);
    if (!product || product.stockStatus === 'neni-skladem') return false;
    const maxQty = Math.max(1, Number(product.stock) || 99);
    const addQty = Math.min(maxQty, Math.max(1, Number.parseInt(qty, 10) || 1));
    const cart = this.getCart();
    const existing = cart.find(i => i.id === id);
    if (existing) existing.qty = Math.min(maxQty, existing.qty + addQty);
    else cart.push({ id, qty: addQty });
    this.saveCart(cart);
    return true;
  },
  removeFromCart(productId) { const id = Number(productId); this.saveCart(this.getCart().filter(i => i.id !== id)); },
  updateCartQty(productId, qty) {
    const id = Number(productId);
    const product = this.products.find(p => p.id === id);
    const cart = this.getCart();
    const item = cart.find(i => i.id === id);
    if (!item) return;
    const nextQty = Number.parseInt(qty, 10) || 0;
    if (nextQty <= 0) this.removeFromCart(id);
    else {
      item.qty = Math.min(Math.max(1, Number(product?.stock) || 99), nextQty);
      this.saveCart(cart);
    }
  },
  clearCart() { localStorage.removeItem('narky_cart'); window.dispatchEvent(new CustomEvent('cartUpdate')); },
  getCartTotal() {
    const cart = this.getCart();
    return cart.reduce((sum, item) => { const p = this.products.find(p => p.id === item.id); return sum + (p ? p.price * item.qty : 0); }, 0);
  },

  // ── HELPERS ───────────────────────────────────────────────
  getCartMetrics() {
    const metrics = { weight: 0, length: 0, width: 0, height: 0, items: [] };
    this.getCart().forEach(item => {
      const product = this.getProducts().find(p => p.id === item.id);
      if (!product) return;
      const dims = product.dimensions || this.packageDefaults[product.sizeClass] || this.packageDefaults.small;
      metrics.weight += (Number(product.weight) || 0) * item.qty;
      metrics.length = Math.max(metrics.length, Number(dims.length) || 0);
      metrics.width = Math.max(metrics.width, Number(dims.width) || 0);
      metrics.height = Math.max(metrics.height, Number(dims.height) || 0);
      metrics.items.push({ id: product.id, name: product.name, qty: item.qty, weight: product.weight, dimensions: dims });
    });
    return metrics;
  },
  checkShippingAllowed(shippingId) {
    if (shippingId === 'osobni') return { allowed: true, reason: '' };
    const limits = this.shippingLimits[shippingId];
    const metrics = this.getCartMetrics();
    if (!limits) return { allowed: true, reason: '' };
    if (metrics.weight > limits.maxWeight) return { allowed: false, reason: `váha ${metrics.weight.toFixed(1)} kg překračuje limit ${limits.maxWeight} kg` };
    if (metrics.length > limits.maxLength || metrics.width > limits.maxWidth || metrics.height > limits.maxHeight) {
      return {
        allowed: false,
        reason: `rozměr ${metrics.length}×${metrics.width}×${metrics.height} cm překračuje limit ${limits.maxLength}×${limits.maxWidth}×${limits.maxHeight} cm`,
      };
    }
    return { allowed: true, reason: '' };
  },
  getShippingOptionsForCart() {
    return this.shipping.map(option => ({ ...option, ...this.checkShippingAllowed(option.id) }));
  },
  getShippingForCart() {
    return this.getShippingOptionsForCart().filter(option => option.allowed);
  },
};

// Init
DB.getProducts();
window.DB = DB;
