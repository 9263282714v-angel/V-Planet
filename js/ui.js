(function () {
  const VP = window.VP;
  const byId = Object.fromEntries(VP.products.map((p) => [p.id, p]));

  const money = (n) => new Intl.NumberFormat("ru-RU").format(n) + " ₽";
  const page = document.body.dataset.page || "";

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
    return loadCart().filter((item) => byId[item.id]);
  }
  function addToCart(id, qty) {
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
    const mood = product.moods.map(moodLabel).slice(0, 2).join(" · ");
    const meta = [product.format, product.volume, product.burn].filter(Boolean).join(" · ");
    return `
      <article class="card">
        <a class="card-photo" href="product.html?id=${product.id}">
          <img src="${product.image}" alt="${product.imageAlt || product.name}">
        </a>
        <div class="card-meta">${meta}</div>
        <h3><a href="product.html?id=${product.id}">${product.name}</a></h3>
        <p class="card-line">${mood}</p>
        <div class="card-price">${money(product.price)}</div>
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
      </div>`;
  }

  function footer() {
    return `
      <footer class="site-footer">
        <div class="wrap footer-grid">
          <div>
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
    const orderText = items.map((item) => `${byId[item.id].name} × ${item.qty} — ${money(byId[item.id].price * item.qty)}`).join("\n");
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

    const headerEl = document.querySelector(".site-header");
    const onScroll = () => headerEl.classList.toggle("is-stuck", window.scrollY > 4);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  function initHome() {
    const hits = VP.products.filter((p) => p.hit);
    const root = document.querySelector("[data-hits]");
    if (root) root.innerHTML = hits.map(card).join("");
  }

  function initCatalog() {
    const root = document.querySelector("[data-catalog]");
    if (!root) return;
    const params = new URLSearchParams(location.search);
    const state = {
      cat: params.get("cat") || "all",
      mood: params.get("mood") || "all",
      q: ""
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

    function apply() {
      const visual = [];
      const list = [];
      VP.products.forEach((product) => {
        if (state.cat !== "all" && !matches(product, state.cat)) return;
        if (state.mood !== "all" && !product.moods.includes(state.mood)) return;
        if (state.q && !`${product.name} ${product.lead || ""} ${product.format || ""}`.toLowerCase().includes(state.q)) return;
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
        ${!visual.length && !list.length ? `<p class="empty">В этом сочетании пока пусто. Снимите настроение или откройте весь каталог.</p>` : ""}`;
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
      const url = new URL(location.href);
      url.searchParams.delete("cat");
      url.searchParams.delete("mood");
      if (state.cat !== "all") url.searchParams.set("cat", state.cat);
      if (state.mood !== "all") url.searchParams.set("mood", state.mood);
      history.replaceState(null, "", url);
    }

    document.querySelector("[data-filters]").addEventListener("click", (event) => {
      const button = event.target.closest("[data-filter]");
      if (!button) return;
      state[button.dataset.filter] = button.dataset.value;
      apply();
    });
    document.querySelector("[data-search]").addEventListener("input", (event) => {
      state.q = event.target.value.trim().toLowerCase();
      apply();
    });
    apply();
  }

  function initProduct() {
    const root = document.querySelector("[data-product]");
    if (!root) return;
    const id = new URLSearchParams(location.search).get("id");
    const product = byId[id];
    if (!product) {
      root.innerHTML = `<div class="page-intro"><h1>Такой позиции нет</h1><p><a href="catalog.html">Вернуться в каталог</a></p></div>`;
      return;
    }
    document.title = `${product.name} — V-PLANET`;
    const specs = (product.specs || []).map(([k, v]) => `<tr><th>${k}</th><td>${v}</td></tr>`).join("");
    const use = (product.use || []).map((line) => `<li>${line}</li>`).join("");
    const related = VP.products
      .filter((item) => item.id !== product.id && item.image && (item.id === product.pair || item.moods.some((mood) => product.moods.includes(mood))))
      .sort((a, b) => Number(b.id === product.pair) - Number(a.id === product.pair))
      .slice(0, 3);
    root.innerHTML = `
      <article class="product wrap">
        <div>
          <div class="product-photo">${product.image ? `<img src="${product.image}" alt="${product.imageAlt || product.name}">` : `<div class="page-intro"><p class="kicker">${product.format || ""}</p><h2>${product.name}</h2><p>Фото этой формы добавим следующим шагом. Цена и срок уже можно положить в корзину.</p></div>`}</div>
          ${product.imageCaption ? `<p class="caption">${product.imageCaption}</p>` : ""}
        </div>
        <div>
          <p class="kicker">${catLabel(product.category)} · ${product.moods.map(moodLabel).join(" · ")}</p>
          <h1>${product.name}</h1>
          <p class="lead">${product.lead || ""}</p>
          <div class="price-lg">${money(product.price)}</div>
          <p class="eta">${VP.eta}</p>
          <div style="margin-top:16px">
            <span class="qty">
              <button type="button" data-local-qty="-1">−</button>
              <span data-local>1</span>
              <button type="button" data-local-qty="1">+</button>
            </span>
            <button class="solid" type="button" data-add-qty>В корзину</button>
          </div>
          <table class="specs">${specs}</table>
          <div class="prose">
            <p>${product.description || ""}</p>
            ${use ? `<h2>Как пользоваться</h2><ul>${use}</ul>` : ""}
          </div>
        </div>
      </article>
      <section class="section wrap related">
        <div class="section-head"><h2>Рядом по настроению</h2></div>
        <div class="grid">${related.map(card).join("")}</div>
      </section>`;
    let qty = 1;
    root.addEventListener("click", (event) => {
      const step = event.target.closest("[data-local-qty]");
      if (step) {
        qty = Math.max(1, qty + Number(step.dataset.localQty));
        root.querySelector("[data-local]").textContent = String(qty);
      }
      if (event.target.closest("[data-add-qty]")) addToCart(product.id, qty);
    });
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
  initHome();
  initCatalog();
  initProduct();
  initB2B();
})();
