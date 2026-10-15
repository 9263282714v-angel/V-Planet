(function () {
  const VP = window.VP;
  const byId = Object.fromEntries(VP.products.map((p) => [p.id, p]));

  const money = (n) => new Intl.NumberFormat("ru-RU").format(n) + " ₽";
  const page = document.body.dataset.page || "";
  function pageParams() {
    const raw = location.search.slice(1);
    if (!/^https?:\/\//i.test(raw)) return new URLSearchParams(raw);
    const idx = raw.indexOf("?");
    return new URLSearchParams(idx >= 0 ? raw.slice(idx + 1) : "");
  }
  function rewritePreviewLinks(scope) {
    if (!/htmlpreview\.github\.io/i.test(location.hostname)) return;
    const base = document.querySelector("base")?.href || location.search.slice(1);
    (scope || document).querySelectorAll("a[href]").forEach((a) => {
      const href = a.getAttribute("href") || "";
      if (!href || href.startsWith("#") || /^(https?:|mailto:|tel:|\/\/)/i.test(href)) return;
      if (!/\.html(\?|$)/i.test(href)) return;
      a.href = `${location.origin}${location.pathname}?${new URL(href, base).href}`;
    });
  }

  function priced(product) {
    return !!product && typeof product.price === "number" && product.price > 0;
  }

  function loadCart() {
    try {
      return JSON.parse(localStorage.getItem("vp-cart") || "[]");
    } catch (e) {
      return [];
    }
  }
  function saveCart(items) {
    localStorage.setItem("vp-cart", JSON.stringify(items));
    renderCart();
    updateCount();
  }
  function cartItems() {
    return loadCart().filter((item) => priced(byId[item.id]));
  }
  function addToCart(id, qty) {
    if (!priced(byId[id])) return;
    const items = cartItems();
    const found = items.find((item) => item.id === id);
    if (found) found.qty += qty;
    else items.push({ id, qty });
    saveCart(items);
    openCart();
  }
  function setQty(id, qty) {
    let items = cartItems();
    if (qty <= 0) items = items.filter((item) => item.id !== id);
    else items = items.map((item) => (item.id === id ? { ...item, qty } : item));
    saveCart(items);
  }
  function total() {
    return cartItems().reduce((sum, item) => sum + byId[item.id].price * item.qty, 0);
  }
  function count() {
    return cartItems().reduce((sum, item) => sum + item.qty, 0);
  }

  function moodLabel(id) {
    return (VP.moods.find((m) => m.id === id) || {}).label || "";
  }
  function catLabel(id) {
    return (VP.categories.find((c) => c.id === id) || {}).label || "";
  }
  function matches(product, cat) {
    return product.category === cat || (product.also || []).includes(cat);
  }

  function card(product) {
    const mood = (product.moods || []).map(moodLabel).filter(Boolean).slice(0, 2).join(" · ");
    const meta = [product.format, product.volume].filter(Boolean).join(" · ");
    const options = product.option && product.group
      ? VP.products.filter((item) => item.group === product.group && item.option && priced(item))
      : [];
    const pills = options.length > 1
      ? `<div class="scents card-options" role="group" aria-label="Количество">${options.map((item) => `<button type="button" data-card-option="${item.id}" class="${item.id === product.id ? "is-on" : ""}" aria-pressed="${item.id === product.id}">${item.option}</button>`).join("")}</div>`
      : "";
    return `
      <article class="card">
        <a class="card-photo" href="product.html?id=${product.id}" data-card-link>
          <img src="${product.image}" alt="${product.imageAlt || product.name}">
          <span class="arrival">Самовывоз сегодня</span>
        </a>
        <div class="card-meta" data-card-meta>${meta}</div>
        <h3><a href="product.html?id=${product.id}" data-card-link>${product.name}</a></h3>
        <p class="card-line">${mood}</p>
        ${pills}
        <div class="card-price" data-card-price>${money(product.price)}</div>
        <p class="eta">${VP.eta}</p>
        <button class="solid" type="button" data-add="${product.id}">В корзину</button>
      </article>`;
  }

  function row(product) {
    const bits = [product.format, product.volume, product.burn].filter(Boolean).join(" · ");
    return `
      <div class="row">
        <div>
          <b><a href="product.html?id=${product.id}">${product.name}</a></b>
          <div><span>${bits}</span></div>
        </div>
        <span>${product.moods.map(moodLabel).join(" · ")}</span>
        <b>${money(product.price)}</b>
        <button class="solid" type="button" data-add="${product.id}">В корзину</button>
      </div>`;
  }

  function header() {
    const links = [
      ["catalog.html?cat=diffuser", "Диффузоры", "diffuser"],
      ["catalog.html?cat=candle", "Свечи", "candle"],
      ["catalog.html?cat=perfume", "Парфюм", "perfume"],
      ["catalog.html?cat=plaster", "Гипс", "plaster"],
      ["b2b.html", "B2B", "b2b"],
      ["delivery.html", "Доставка", "delivery"]
    ];
    return `
      <a class="skip" href="#main">К содержанию</a>
      <header class="site-header">
        <div class="topbar">
          <button class="city-btn" type="button" data-city-open aria-expanded="false" aria-controls="city-pop">
            <svg class="pin" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 2.5a7 7 0 0 0-7 7c0 5.1 6.1 11.3 6.4 11.6a.9.9 0 0 0 1.2 0C12.9 20.8 19 14.6 19 9.5a7 7 0 0 0-7-7Zm0 9.5a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5Z"/></svg>
            <span data-city-label>Москва</span>
          </button>
          <form class="top-search" action="catalog.html" method="get" role="search">
            <label class="sr" for="top-q">Поиск</label>
            <input id="top-q" name="q" type="search" placeholder="Диффузор, свеча, аромат" autocomplete="off" enterkeyhint="search">
            <button class="top-find" type="submit">Найти</button>
          </form>
          <div class="city-pop" id="city-pop" data-city-pop hidden role="dialog" aria-label="Город">
            <p class="city-ask" data-city-ask>Ваш город — <b data-city-guess>Москва</b>?</p>
            <p class="city-note">Самовывоз сегодня — Жукова, 51, если это Москва. В другой город отправим СДЭК.</p>
            <div class="city-actions" data-city-actions>
              <button class="solid" type="button" data-city-yes>Да, верно</button>
              <button class="ghost" type="button" data-city-other>Другой город</button>
            </div>
            <div class="city-list" data-city-list hidden>
              <input type="search" data-city-filter placeholder="Найти город" aria-label="Найти город">
              <div class="city-options" data-city-options></div>
            </div>
          </div>
        </div>
        <div class="header-inner">
          <a class="brand" href="index.html"><img src="images/logo.png" alt=""><span>V-PLANET</span></a>
          <nav class="nav" aria-label="Разделы">
            ${links.map(([href, label, key]) => `<a href="${href}" ${page === key ? 'aria-current="page"' : ""}>${label}</a>`).join("")}
          </nav>
          <div class="header-actions">
            <button class="menu-btn ghost" type="button" data-menu>Меню</button>
            <button class="ghost" type="button" data-write>Написать</button>
            <button class="solid" type="button" data-cart-open>Корзина <span data-count>0</span></button>
          </div>
        </div>
      </header>
      <div class="mobile-nav" data-mobile hidden>
        ${links.map(([href, label]) => `<a href="${href}">${label}</a>`).join("")}
        <a href="about.html">О мастерской</a>
        <a href="${VP.whatsapp}">WhatsApp</a>
        <a href="${VP.phoneHref}">${VP.phone}</a>
      </div>`;
  }

  function footer() {
    return `
      <footer class="site-footer">
        <div class="wrap footer-grid">
          <div>
            <img class="footer-logo" src="images/logo.png" alt="V-PLANET">
            <h3>V-PLANET</h3>
            <p>Мастерская Веры и Михаила Пятых. Свечи, диффузоры и гипс ручной работы. Москва.</p>
          </div>
          <div>
            <h3>Магазин</h3>
            <ul>
              <li><a href="catalog.html?cat=diffuser">Диффузоры</a></li>
              <li><a href="catalog.html?cat=candle">Свечи</a></li>
              <li><a href="catalog.html?cat=perfume">Парфюм и саше</a></li>
              <li><a href="catalog.html?cat=plaster">Гипс</a></li>
            </ul>
          </div>
          <div>
            <h3>Мастерская</h3>
            <ul>
              <li><a href="about.html">О нас</a></li>
              <li><a href="b2b.html">Корпоративным клиентам</a></li>
              <li><a href="delivery.html">Доставка и самовывоз</a></li>
              <li><a href="${VP.ozon}">Ozon</a></li>
              <li><a href="${VP.wb}">Wildberries</a></li>
            </ul>
          </div>
          <div>
            <h3>Контакты</h3>
            <ul>
              <li><a href="${VP.phoneHref}">${VP.phone}</a></li>
              <li><a href="${VP.phone2Href}">${VP.phone2}</a></li>
              <li><a href="mailto:${VP.email}">${VP.email}</a></li>
              <li>${VP.address}</li>
              <li>Пункт выдачи ${VP.hours}</li>
            </ul>
          </div>
        </div>
        <div class="wrap legal">© ${new Date().getFullYear()} V-PLANET · ИП Пятых Вера Сергеевна · ОГРНИП 321774600529103</div>
      </footer>`;
  }

  function cartDrawer() {
    const items = cartItems();
    const lines = items.length
      ? items.map((item) => {
          const product = byId[item.id];
          return `
            <div class="cart-item">
              <img src="${product.image || "images/logo.png"}" alt="">
              <div>
                <b>${product.name}</b>
                <div class="eta">${product.volume || ""}</div>
                <div class="qty">
                  <button type="button" data-qty="${product.id}" data-delta="-1">−</button>
                  <span>${item.qty}</span>
                  <button type="button" data-qty="${product.id}" data-delta="1">+</button>
                </div>
                <div>${money(product.price * item.qty)}</div>
              </div>
            </div>`;
        }).join("")
      : `<p class="empty">Корзина пустая. Выберите диффузор или свечу — цена уже на плитке.</p>`;
    const orderText = items.map((item) => {
      const p = byId[item.id];
      return `${p.name}${p.option ? ` (${p.option})` : ""} × ${item.qty} — ${money(p.price * item.qty)}`;
    }).join("\n");
    return `
      <aside class="drawer" data-drawer hidden>
        <header>
          <h2>Корзина</h2>
          <button class="ghost" type="button" data-cart-close>Закрыть</button>
        </header>
        <div class="cart-list">${lines}</div>
        <div class="cart-total"><span>Итого</span><span>${money(total())}</span></div>
        <p class="eta">${VP.eta}. ${VP.address}, ${VP.hours}.</p>
        <form class="form" data-order>
          <label>Имя<input name="name" required autocomplete="name"></label>
          <label>Телефон<input name="phone" required autocomplete="tel" placeholder="+7"></label>
          <label>Комментарий<textarea name="comment" placeholder="Адрес, дата праздника, аромат"></textarea></label>
          <button class="solid" type="submit" ${items.length ? "" : "disabled"}>Отправить заявку</button>
          <p class="note">Это заявка, не оплата. Мы перезвоним и подтвердим наличие, доставку и сумму.</p>
          <a class="ghost" href="${VP.whatsapp}?text=${encodeURIComponent("Здравствуйте! Хочу заказать:\n" + orderText + "\nИтого: " + money(total()))}">Написать в WhatsApp</a>
        </form>
        <div class="ok" data-order-ok hidden>
          <b>Заявка записана.</b>
          <p>Позвоните нам, если удобнее сразу: <a href="${VP.phoneHref}">${VP.phone}</a>.</p>
        </div>
      </aside>`;
  }

  const CITIES = ["Москва", "Санкт-Петербург", "Казань", "Новосибирск", "Екатеринбург", "Нижний Новгород", "Краснодар", "Ростов-на-Дону", "Самара", "Воронеж", "Уфа", "Красноярск", "Пермь", "Волгоград", "Тюмень", "Саратов", "Челябинск", "Омск", "Калининград", "Сочи", "Иркутск", "Владивосток", "Хабаровск", "Ярославль", "Тула", "Рязань"];
  const EN_CITY = {
    Moscow: "Москва",
    "Saint Petersburg": "Санкт-Петербург",
    "St Petersburg": "Санкт-Петербург",
    Kazan: "Казань",
    Novosibirsk: "Новосибирск",
    Yekaterinburg: "Екатеринбург",
    "Nizhny Novgorod": "Нижний Новгород",
    Krasnodar: "Краснодар",
    "Rostov-on-Don": "Ростов-на-Дону",
    Samara: "Самара",
    Voronezh: "Воронеж",
    Ufa: "Уфа",
    Krasnoyarsk: "Красноярск",
    Perm: "Пермь",
    Volgograd: "Волгоград",
    Tyumen: "Тюмень",
    Saratov: "Саратов",
    Chelyabinsk: "Челябинск",
    Omsk: "Омск",
    Kaliningrad: "Калининград",
    Sochi: "Сочи",
    Irkutsk: "Иркутск",
    Vladivostok: "Владивосток",
    Khabarovsk: "Хабаровск",
    Yaroslavl: "Ярославль",
    Tula: "Тула",
    Ryazan: "Рязань"
  };

  function esc(value) {
    return String(value).replace(/[&<>"']/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch]));
  }

  function ruCity(data) {
    const raw = (data && data.city) || "";
    if (/[а-яё]/i.test(raw)) return raw;
    return EN_CITY[raw] || "Москва";
  }

  function initCity() {
    const label = document.querySelector("[data-city-label]");
    const pop = document.querySelector("[data-city-pop]");
    const guessEl = document.querySelector("[data-city-guess]");
    const ask = document.querySelector("[data-city-ask]");
    const actions = document.querySelector("[data-city-actions]");
    const list = document.querySelector("[data-city-list]");
    const options = document.querySelector("[data-city-options]");
    const filter = document.querySelector("[data-city-filter]");
    const openBtn = document.querySelector("[data-city-open]");
    if (!label || !pop || !openBtn) return;

    const saved = localStorage.getItem("vp-city");
    if (saved) {
      label.textContent = saved;
      guessEl.textContent = saved;
    }

    function setCity(name, confirmed) {
      const next = (name || "").trim() || "Москва";
      localStorage.setItem("vp-city", next);
      if (confirmed) localStorage.setItem("vp-city-ok", "1");
      label.textContent = next;
      guessEl.textContent = next;
    }

    function renderOptions(query) {
      const q = query.trim().toLowerCase();
      const found = CITIES.filter((name) => name.toLowerCase().includes(q));
      const buttons = found.map((name) => `<button type="button" data-city-pick="${esc(name)}">${esc(name)}</button>`).join("");
      const typed = query.trim();
      const custom = typed && !CITIES.some((name) => name.toLowerCase() === typed.toLowerCase())
        ? `<button type="button" data-city-pick="${esc(typed)}">Доставить в «${esc(typed)}»</button>`
        : "";
      options.innerHTML = buttons + custom || `<p class="city-empty">Напишите город — отправим СДЭК.</p>`;
    }

    function showAsk() {
      ask.hidden = false;
      actions.hidden = false;
      list.hidden = true;
      pop.hidden = false;
      openBtn.setAttribute("aria-expanded", "true");
    }

    function showList() {
      ask.hidden = true;
      actions.hidden = true;
      list.hidden = false;
      pop.hidden = false;
      openBtn.setAttribute("aria-expanded", "true");
      renderOptions(filter.value || "");
      filter.focus();
    }

    function closePop(later) {
      pop.hidden = true;
      openBtn.setAttribute("aria-expanded", "false");
      if (later && localStorage.getItem("vp-city-ok") !== "1") sessionStorage.setItem("vp-city-later", "1");
    }

    openBtn.addEventListener("click", () => {
      if (!pop.hidden && list.hidden === false) closePop(false);
      else showList();
    });
    document.querySelector("[data-city-yes]").addEventListener("click", () => {
      setCity(guessEl.textContent, true);
      closePop(false);
    });
    document.querySelector("[data-city-other]").addEventListener("click", showList);
    filter.addEventListener("input", () => renderOptions(filter.value));
    options.addEventListener("click", (event) => {
      const pick = event.target.closest("[data-city-pick]");
      if (!pick) return;
      setCity(pick.dataset.cityPick, true);
      closePop(false);
    });
    document.addEventListener("click", (event) => {
      if (pop.hidden) return;
      if (event.target.closest("[data-city-pop]") || event.target.closest("[data-city-open]")) return;
      closePop(true);
    });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && !pop.hidden) closePop(true);
    });

    if (localStorage.getItem("vp-city-ok") === "1" || sessionStorage.getItem("vp-city-later") === "1") return;

    const ctrl = new AbortController();
    const timeout = setTimeout(() => ctrl.abort(), 2500);
    fetch("https://ipwho.is/", { signal: ctrl.signal })
      .then((res) => res.json())
      .then((data) => {
        if (localStorage.getItem("vp-city-ok") === "1") return;
        const next = ruCity(data);
        setCity(next, false);
        if (pop.hidden) showAsk();
      })
      .catch(() => {
        if (localStorage.getItem("vp-city-ok") === "1") return;
        showAsk();
      })
      .finally(() => clearTimeout(timeout));
  }

  function initVibe() {
    const stage = document.querySelector("[data-vibe]");
    if (!stage) return;
    const slides = [...stage.querySelectorAll("[data-vibe-slide]")];
    const bar = document.querySelector("[data-vibe-bar]");
    let index = 0;
    let timer = 0;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    function show(next) {
      index = (next + slides.length) % slides.length;
      slides.forEach((slide, i) => {
        const on = i === index;
        slide.classList.toggle("is-on", on);
        slide.setAttribute("aria-hidden", on ? "false" : "true");
      });
      if (!bar || reduce) return;
      bar.classList.remove("is-run");
      void bar.offsetWidth;
      bar.classList.add("is-run");
    }

    function stop() { clearInterval(timer); }
    function start() {
      stop();
      if (reduce) return;
      timer = setInterval(() => show(index + 1), 4400);
    }

    stage.addEventListener("mouseenter", stop);
    stage.addEventListener("mouseleave", start);
    stage.addEventListener("focusin", stop);
    stage.addEventListener("focusout", start);
    document.querySelector("[data-vibe-prev]")?.addEventListener("click", () => { show(index - 1); start(); });
    document.querySelector("[data-vibe-next]")?.addEventListener("click", () => { show(index + 1); start(); });
    show(0);
    start();
  }

  function mountChrome() {
    document.body.insertAdjacentHTML("afterbegin", header());
    document.body.insertAdjacentHTML("beforeend", footer() + `<div class="drawer-back" data-back hidden></div>` + cartDrawer());
    updateCount();
  }

  function updateCount() {
    document.querySelectorAll("[data-count]").forEach((node) => {
      node.textContent = String(count());
    });
  }

  function openCart() {
    document.querySelector("[data-drawer]").hidden = false;
    document.querySelector("[data-back]").hidden = false;
    document.body.style.overflow = "hidden";
  }
  function closeCart() {
    document.querySelector("[data-drawer]").hidden = true;
    document.querySelector("[data-back]").hidden = true;
    document.body.style.overflow = "";
  }
  function renderCart() {
    const fresh = cartDrawer();
    const current = document.querySelector("[data-drawer]");
    if (!current) return;
    const open = !current.hidden;
    current.outerHTML = fresh;
    if (open) document.querySelector("[data-drawer]").hidden = false;
  }

  function bind() {
    document.addEventListener("click", (event) => {
      const add = event.target.closest("[data-add]");
      if (add) {
        addToCart(add.dataset.add, 1);
        return;
      }
      const opt = event.target.closest("[data-card-option]");
      if (opt) {
        const chosen = byId[opt.dataset.cardOption];
        const cardEl = opt.closest(".card");
        if (!chosen || !cardEl) return;
        cardEl.querySelectorAll("[data-card-option]").forEach((btn) => {
          const on = btn === opt;
          btn.classList.toggle("is-on", on);
          btn.setAttribute("aria-pressed", String(on));
        });
        const metaEl = cardEl.querySelector("[data-card-meta]");
        if (metaEl) metaEl.textContent = [chosen.format, chosen.volume].filter(Boolean).join(" · ");
        const priceEl = cardEl.querySelector("[data-card-price]");
        if (priceEl) priceEl.textContent = money(chosen.price);
        const addBtn = cardEl.querySelector("[data-add]");
        if (addBtn) addBtn.dataset.add = chosen.id;
        cardEl.querySelectorAll("[data-card-link]").forEach((link) => {
          link.setAttribute("href", `product.html?id=${chosen.id}`);
        });
        rewritePreviewLinks(cardEl);
        return;
      }
      const qty = event.target.closest("[data-qty]");
      if (qty) {
        const item = cartItems().find((entry) => entry.id === qty.dataset.qty);
        setQty(qty.dataset.qty, (item ? item.qty : 1) + Number(qty.dataset.delta));
        return;
      }
      if (event.target.closest("[data-cart-open]")) openCart();
      if (event.target.closest("[data-cart-close]") || event.target.closest("[data-back]")) closeCart();
      if (event.target.closest("[data-menu]")) {
        const menu = document.querySelector("[data-mobile]");
        menu.hidden = !menu.hidden;
      }
      if (event.target.closest("[data-write]")) {
        let pop = document.querySelector("[data-write-pop]");
        if (pop) {
          pop.remove();
          return;
        }
        pop = document.createElement("div");
        pop.className = "write-pop";
        pop.dataset.writePop = "";
        pop.innerHTML = `
          <a href="${VP.whatsapp}">WhatsApp</a>
          <a href="${VP.vkWrite}">ВКонтакте</a>
          <a href="${VP.phoneHref}">${VP.phone}</a>
          <a href="mailto:${VP.email}">Почта</a>`;
        document.querySelector(".header-actions").appendChild(pop);
      } else if (!event.target.closest("[data-write-pop]")) {
        document.querySelector("[data-write-pop]")?.remove();
      }
    });

    document.addEventListener("submit", (event) => {
      const form = event.target.closest("[data-order]");
      if (!form) return;
      event.preventDefault();
      const data = Object.fromEntries(new FormData(form).entries());
      const order = {
        ...data,
        items: cartItems(),
        total: total(),
        at: new Date().toISOString()
      };
      const prev = JSON.parse(localStorage.getItem("vp-orders") || "[]");
      prev.push(order);
      localStorage.setItem("vp-orders", JSON.stringify(prev));
      saveCart([]);
      const nextForm = document.querySelector("[data-order]");
      const ok = document.querySelector("[data-order-ok]");
      if (nextForm) nextForm.hidden = true;
      if (ok) ok.hidden = false;
      openCart();
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") closeCart();
    });

    const topSearch = document.querySelector(".top-search");
    const qParam = pageParams().get("q");
    if (topSearch && qParam) topSearch.q.value = qParam;
    topSearch?.addEventListener("submit", (event) => {
      if (page === "catalog") {
        event.preventDefault();
        const field = document.querySelector("[data-search]");
        if (!field) return;
        field.value = topSearch.q.value;
        field.dispatchEvent(new Event("input", { bubbles: true }));
        return;
      }
      if (!/htmlpreview\.github\.io/i.test(location.hostname)) return;
      event.preventDefault();
      const base = document.querySelector("base")?.href || location.search.slice(1);
      const next = new URL("catalog.html", base);
      if (topSearch.q.value.trim()) next.searchParams.set("q", topSearch.q.value.trim());
      location.href = `${location.origin}${location.pathname}?${next.href}`;
    });

    const headerEl = document.querySelector(".site-header");
    const syncChrome = () => {
      document.documentElement.style.setProperty("--chrome", headerEl.offsetHeight + "px");
      headerEl.classList.toggle("is-stuck", window.scrollY > 4);
    };
    syncChrome();
    window.addEventListener("scroll", syncChrome, { passive: true });
    window.addEventListener("resize", syncChrome);
  }

  function impressionCard(item) {
    const product = byId[item.productId];
    if (!product) return "";
    const meta = [product.format, product.volume].filter(Boolean).join(" · ");
    return `
      <article class="impression">
        <p>${item.text}</p>
        <a href="product.html?id=${product.id}">${product.name}</a>
        <span>${meta} · ${money(product.price)}</span>
      </article>`;
  }

  function reviewCard(item) {
    const product = byId[item.productId];
    const name = product ? product.name : "";
    const href = product ? `product.html?id=${product.id}` : "catalog.html";
    return `
      <article class="impression">
        <p>«${item.text}»</p>
        <a href="${href}">${name}</a>
        <span>${item.date}</span>
      </article>`;
  }

  function seasonCard(product) {
    if (!priced(product)) {
      return `<article class="season-story is-soon"><p class="kicker">Диффузор</p><h3>Скоро</h3></article>`;
    }
    return `
      <a class="season-story" href="product.html?id=${product.id}">
        <p class="kicker">${[product.volume, money(product.price)].filter(Boolean).join(" · ")}</p>
        <h3>${product.name}</h3>
        <p>${product.seasonNote || ""}</p>
      </a>`;
  }

  function initHome() {
    const hits = VP.products.filter((p) => p.hit && priced(p));
    const root = document.querySelector("[data-hits]");
    if (root) root.innerHTML = hits.map(card).join("");
    const season = document.querySelector("[data-season]");
    if (season) {
      season.innerHTML = VP.products
        .filter((p) => p.hit && p.category === "diffuser")
        .map(seasonCard)
        .join("");
    }
    const reviews = document.querySelector("[data-reviews]");
    if (reviews) reviews.innerHTML = (VP.reviews || []).map(reviewCard).join("");
    const impressions = document.querySelector("[data-impressions]");
    if (impressions) impressions.innerHTML = (VP.impressions || []).map(impressionCard).join("");
    initVibe();
  }

  function initCatalog() {
    const root = document.querySelector("[data-catalog]");
    if (!root) return;
    const params = pageParams();
    const state = {
      cat: params.get("cat") || "all",
      mood: params.get("mood") || "all",
      q: (params.get("q") || "").trim().toLowerCase()
    };
    const title = document.querySelector("[data-catalog-title]");
    const intro = document.querySelector("[data-catalog-intro]");
    const intros = {
      all: "Готовые вещи мастерской: диффузоры, свечи, парфюм, гипс. Цена и срок получения стоят на каждой плитке.",
      diffuser: "Тёмный флакон, деревянная крышка, палочки из микрофибры. Объёмы линейки — 100, 200 и 500 мл. В витрине сейчас флаконы, у которых есть цена.",
      candle: "Ручная работа. Растительные воски: кокос, соя, пчелиный. Без парафина и стеарина. Коктейльная свеча на гелевом воске отмечена отдельно.",
      perfume: "Интерьерный парфюм для текстиля и флорентийское саше для шкафа. Сейчас они входят в бокс Wild Beauty.",
      plaster: "Свечи в гипсовых формах, техника «мрамор». Рисунок у каждой штуки свой. Форму можно оставить в интерьере.",
      set: "Наборы, которые уже можно дарить.",
      machine: "Аппарат для зала, офиса, ресторана или большого дома."
    };

    function matchesQuery(product, q) {
      const moodText = (product.moods || []).map(moodLabel).join(" ");
      const hay = `${product.name} ${product.lead || ""} ${product.description || ""} ${product.seasonNote || ""} ${product.format || ""} ${product.volume || ""} ${moodText}`.toLowerCase();
      if (hay.includes(q)) return true;
      if (q.length >= 4 && hay.includes(q.slice(0, -1))) return true;
      return false;
    }

    function apply() {
      const visual = [];
      const list = [];
      VP.products.forEach((product) => {
        if (!priced(product)) return;
        if (product.option && VP.products.find((item) => item.group === product.group && item.option)?.id !== product.id) return;
        if (product.collection === "spring" && !state.q) return;
        if (state.cat !== "all" && !matches(product, state.cat)) return;
        if (state.mood !== "all" && !product.moods.includes(state.mood)) return;
        if (state.q && !matchesQuery(product, state.q)) return;
        (product.listOnly || !product.image ? list : visual).push(product);
      });
      const groups = {};
      list.forEach((product) => {
        const key = product.format || "Другое";
        (groups[key] ||= []).push(product);
      });
      const listHtml = Object.entries(groups).map(([name, products]) => `
        <div class="list-block">
          <h3>${name}</h3>
          <p class="eta">${VP.eta}</p>
          ${products.map(row).join("")}
        </div>`).join("");
      root.innerHTML = `
        ${visual.length ? `<div class="grid">${visual.map(card).join("")}</div>` : ""}
        ${listHtml}
        ${!visual.length && !list.length ? `<p class="empty">${state.q ? "Ничего не нашлось. Попробуйте другое слово." : "В этом сочетании пока пусто. Снимите настроение или откройте весь каталог."}</p>` : ""}`;
      if (title) {
        const catName = state.cat === "all" ? "Каталог" : catLabel(state.cat);
        const moodName = state.mood === "all" ? "" : moodLabel(state.mood);
        title.textContent = moodName && state.cat !== "all" ? `${catName}: ${moodName.toLowerCase()}` : (moodName || catName);
      }
      if (intro) intro.textContent = intros[state.cat] || intros.all;
      document.querySelectorAll("[data-filter]").forEach((button) => {
        const on = button.dataset.filter === "cat"
          ? button.dataset.value === state.cat
          : button.dataset.value === state.mood;
        button.setAttribute("aria-pressed", on ? "true" : "false");
      });
      rewritePreviewLinks(root);
      if (/htmlpreview\.github\.io/i.test(location.hostname)) return;
      const url = new URL(location.href);
      url.searchParams.delete("cat");
      url.searchParams.delete("mood");
      url.searchParams.delete("q");
      if (state.cat !== "all") url.searchParams.set("cat", state.cat);
      if (state.mood !== "all") url.searchParams.set("mood", state.mood);
      if (state.q) url.searchParams.set("q", state.q);
      history.replaceState(null, "", url);
    }

    document.querySelector("[data-filters]").addEventListener("click", (event) => {
      const button = event.target.closest("[data-filter]");
      if (!button) return;
      state[button.dataset.filter] = button.dataset.value;
      apply();
    });
    const searchInput = document.querySelector("[data-search]");
    if (searchInput && params.get("q")) searchInput.value = params.get("q");
    searchInput.addEventListener("input", (event) => {
      state.q = event.target.value.trim().toLowerCase();
      const top = document.querySelector(".top-search input");
      if (top && top.value !== event.target.value) top.value = event.target.value;
      apply();
    });
    apply();
  }

  function initProduct() {
    const root = document.querySelector("[data-product]");
    if (!root) return;
    const id = pageParams().get("id");
    const product = byId[id];
    if (!product) {
      root.innerHTML = `<div class="page-intro"><h1>Такой позиции нет</h1><p><a href="catalog.html">Вернуться в каталог</a></p></div>`;
      return;
    }
    const specRows = [...(product.specs || [])];
    if (product.lifespan) specRows.push(["Срок жизни аромата", product.lifespan]);
    if (product.coverage) specRows.push(["Площадь", product.coverage]);
    const specs = specRows.map(([k, v]) => `<tr><th>${k}</th><td>${v}</td></tr>`).join("");
    const use = (product.use || []).map((line) => `<li>${line}</li>`).join("");
    const pair = byId[product.pair];
    const pairHtml = priced(pair)
      ? `<aside class="pair">
          <p class="kicker">Пара</p>
          <h2><a href="product.html?id=${pair.id}">${pair.name}</a></h2>
          <p>${[pair.format, pair.volume].filter(Boolean).join(" · ")}</p>
          <p class="card-price">${money(pair.price)}</p>
          <button class="solid" type="button" data-add="${pair.id}">В корзину</button>
        </aside>`
      : "";
    const quotes = [
      ...(VP.reviews || []).filter((item) => item.productId === product.id).map((item) => `<blockquote class="impression impression-single"><p>«${item.text}»</p><span>${item.date}</span></blockquote>`),
      ...(VP.impressions || []).filter((item) => item.productId === product.id).map((item) => `<blockquote class="impression impression-single"><p>${item.text}</p><span>Слух мастерской, не отзыв покупателя</span></blockquote>`)
    ].join("");
    const related = VP.products
      .filter((item) => item.id !== product.id && item.id !== product.pair && priced(item) && item.image && (item.moods || []).some((mood) => (product.moods || []).includes(mood)))
      .slice(0, 3);
    const canBuy = priced(product);
    const siblings = product.group
      ? VP.products.filter((item) => item.group === product.group && priced(item))
      : [];
    const scents = siblings.length > 1
      ? `<div class="scents" aria-label="${product.option ? "Размер" : "Аромат"}">${siblings.map((item) => `<a href="product.html?id=${item.id}"${item.id === product.id ? ' class="is-on" aria-current="true"' : ""}>${item.option || item.name}</a>`).join("")}</div>`
      : "";
    const groupTitle = {
      "diffuser-200": `Аромадиффузор с палочками ${product.name}, 200 мл — V-PLANET`,
      "glass-250": `Ароматическая свеча в стакане ${product.name}, 250 мл — V-PLANET`,
      "glass-350": `Ароматическая свеча в стакане ${product.name}, 350 мл — V-PLANET`,
      "jar-100": `Свеча в банке ${product.name}, 100 мл — V-PLANET`
    };
    document.title = groupTitle[product.group] || `${product.name} — V-PLANET`;
    root.innerHTML = `
      <article class="product wrap">
        <div>
          <div class="product-photo">${product.image ? `<img src="${product.image}" alt="${product.imageAlt || product.name}" data-main-photo>` : `<div class="page-intro"><p class="kicker">${product.format || ""}</p><h2>${product.name}</h2><p>Фото и цена этой позиции появятся, когда мастерская их назовёт.</p></div>`}</div>
          ${(product.gallery || []).length ? `<div class="product-gallery">${[product.image, ...product.gallery].filter(Boolean).map((src) => `<button type="button" data-photo="${src}"><img src="${src}" alt=""></button>`).join("")}</div>` : ""}
          ${product.imageCaption ? `<p class="caption">${product.imageCaption}</p>` : ""}
        </div>
        <div>
          <p class="kicker">${[catLabel(product.category), product.volume, (product.moods || []).map(moodLabel).filter(Boolean).join(" · ")].filter(Boolean).join(" · ")}</p>
          <h1>${product.name}</h1>
          ${scents}
          ${product.lead ? `<p class="lead">${product.lead}</p>` : ""}
          ${canBuy ? `<div class="price-lg">${money(product.price)}</div><p class="eta">${VP.eta}</p>
          <div style="margin-top:16px">
            <span class="qty">
              <button type="button" data-local-qty="-1">−</button>
              <span data-local>1</span>
              <button type="button" data-local-qty="1">+</button>
            </span>
            <button class="solid" type="button" data-add-qty>В корзину</button>
          </div>` : `<p class="price-lg">Скоро</p><button class="solid" type="button" disabled>Скоро</button>`}
          ${specs ? `<table class="specs">${specs}</table>` : ""}
          ${quotes}
          <div class="prose">
            ${product.description ? `<p>${product.description}</p>` : ""}
            ${use ? `<h2>Как пользоваться</h2><ul>${use}</ul>` : ""}
            ${pairHtml}
          </div>
        </div>
      </article>
      ${related.length ? `<section class="section wrap related">
        <div class="section-head"><h2>Рядом по настроению</h2></div>
        <div class="grid">${related.map(card).join("")}</div>
      </section>` : ""}`;
    let qty = 1;
    root.addEventListener("click", (event) => {
      const step = event.target.closest("[data-local-qty]");
      if (step) {
        qty = Math.max(1, qty + Number(step.dataset.localQty));
        root.querySelector("[data-local]").textContent = String(qty);
      }
      if (event.target.closest("[data-add-qty]")) addToCart(product.id, qty);
      const thumb = event.target.closest("[data-photo]");
      const main = root.querySelector("[data-main-photo]");
      if (thumb && main) main.src = thumb.dataset.photo;
    });
  }

  function initWorld() {
    const root = document.querySelector("[data-world]");
    if (!root) return;
    const id = pageParams().get("id");
    const world = (VP.worlds || []).find((item) => item.id === id);
    if (!world) {
      root.innerHTML = `<div class="page-intro"><h1>Такого мира нет</h1><p><a href="index.html">На главную</a></p></div>`;
      return;
    }
    document.title = world.seoTitle;
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute("content", world.seoDescription);
    const seenGroups = new Set();
    const products = VP.products.filter((product) => {
      if (product.world !== world.id || !priced(product)) return false;
      if (product.option && product.group) {
        if (seenGroups.has(product.group)) return false;
        seenGroups.add(product.group);
      }
      return true;
    });
    const visual = products.filter((product) => product.image && !product.listOnly);
    const list = products.filter((product) => !product.image || product.listOnly);
    const empty = {
      flower: "Бутоны и букеты поставим на полку, когда Вера подтвердит, что на снимках её изделия.",
      ar: "Свечи с QR-кодом ещё не выложены отдельными позициями. Обычные свечи этой пометки не получают."
    };
    root.innerHTML = `
      <div class="world-cover">
        <div>
          <p class="kicker">Мир</p>
          <h1>${world.h1}</h1>
          <p class="lead">${world.line}</p>
          <p class="eta">${VP.eta}</p>
        </div>
        <img src="${world.image}" alt="${world.imageAlt || ""}">
      </div>
      ${visual.length ? `<div class="grid">${visual.map(card).join("")}</div>` : ""}
      ${list.length ? `<div class="list-block"><h3>Ещё в этом мире</h3><p class="eta">${VP.eta}</p>${list.map(row).join("")}</div>` : ""}
      ${!products.length ? `<p class="empty">${empty[world.id] || "В этом мире пока нет позиций с ценой."}</p>` : ""}`;
  }

  function initB2B() {
    const form = document.querySelector("[data-b2b]");
    if (!form) return;
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const data = Object.fromEntries(new FormData(form).entries());
      const prev = JSON.parse(localStorage.getItem("vp-b2b") || "[]");
      prev.push({ ...data, at: new Date().toISOString() });
      localStorage.setItem("vp-b2b", JSON.stringify(prev));
      form.hidden = true;
      document.querySelector("[data-b2b-ok]").hidden = false;
    });
  }

  mountChrome();
  bind();
  initCity();
  initHome();
  initCatalog();
  initProduct();
  initWorld();
  initB2B();
  rewritePreviewLinks();
})();
