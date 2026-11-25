import { loadSiteSettings, loadProducts, DEFAULT_SETTINGS } from "/js/site-data.js";

const escapeHtml = (str) =>
  String(str || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

// 1. Yüklenme Animasyonu Kapatma
const hideLoader = () => {
  const loader = document.getElementById("pageLoader");
  if (loader && !loader.classList.contains("loaded")) {
    loader.classList.add("loaded");
    setTimeout(() => loader.remove(), 600);
  }
};
window.addEventListener("load", () => setTimeout(hideLoader, 350));
setTimeout(hideLoader, 2500);

document.addEventListener("DOMContentLoaded", async () => {
  // Mobil Menü Aç/Kapa
  const menuToggle = document.querySelector(".menu-toggle");
  const navLinks = document.querySelector(".nav-links");
  if (menuToggle && navLinks) {
    menuToggle.addEventListener("click", () => {
      const isOpen = navLinks.classList.toggle("active");
      menuToggle.classList.toggle("open", isOpen);
      menuToggle.setAttribute("aria-expanded", String(isOpen));
    });
  }
  document.querySelectorAll(".nav-links a").forEach((a) => {
    a.addEventListener("click", () => {
      navLinks?.classList.remove("active");
      menuToggle?.classList.remove("open");
      menuToggle?.setAttribute("aria-expanded", "false");
    });
  });

  // Yumuşak kaydırma
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener("click", (e) => {
      const href = anchor.getAttribute("href");
      if (href && href.length > 1) {
        const target = document.querySelector(href);
        if (target) {
          e.preventDefault();
          target.scrollIntoView({ behavior: "smooth" });
        }
      }
    });
  });

  // Karanlık / Açık Tema Butonu
  const THEME_KEY = "lalila_theme";
  const root = document.documentElement;
  const applyTheme = (t) => {
    root.setAttribute("data-theme", t);
    const b = document.querySelector(".theme-toggle");
    if (b) {
      b.textContent = t === "dark" ? "☀️" : "🌙";
      b.setAttribute("aria-label", t === "dark" ? "Açık moda geç" : "Karanlık moda geç");
    }
  };
  const currentTheme = () => root.getAttribute("data-theme") || "light";
  const navbar = document.querySelector(".navbar");
  if (navbar && !navbar.querySelector(".theme-toggle")) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "theme-toggle";
    const anchor = navbar.querySelector(".menu-toggle");
    anchor ? navbar.insertBefore(btn, anchor) : navbar.appendChild(btn);
    btn.addEventListener("click", () => {
      const next = currentTheme() === "dark" ? "light" : "dark";
      try { localStorage.setItem(THEME_KEY, next); } catch {}
      applyTheme(next);
    });
  }
  applyTheme(currentTheme());

  // Favoriler
  const FAV_KEY = "lalila_favorites_v1";
  const getFavorites = () => {
    try { return JSON.parse(localStorage.getItem(FAV_KEY) || "[]"); } catch { return []; }
  };
  const saveFavorites = (list) => {
    localStorage.setItem(FAV_KEY, JSON.stringify(list));
    updateFavUI();
  };
  const updateFavUI = () => {
    const favs = getFavorites();
    document.querySelectorAll(".favorite-btn .badge, #favCount").forEach((el) => {
      el.textContent = String(favs.length);
    });
    document.querySelectorAll(".fav-toggle-btn").forEach((btn) => {
      const id = btn.getAttribute("data-fav-id");
      const active = favs.includes(id);
      btn.textContent = active ? "❤️ Favoride" : "🤍 Favori";
    });
  };
  document.addEventListener("click", (e) => {
    const btn = e.target.closest(".fav-toggle-btn");
    if (!btn) return;
    const id = btn.getAttribute("data-fav-id");
    if (!id) return;
    const favs = getFavorites();
    if (favs.includes(id)) {
      saveFavorites(favs.filter((item) => item !== id));
    } else {
      saveFavorites([...favs, id]);
    }
  });

  // Site Ayarlarını Yükle ve Uygula
  const settings = await loadSiteSettings();
  applySiteSettings(settings);

  // Katalog veya Ürün Detay Sayfasıysa Ürünleri Yükle
  const productsGrid = document.getElementById("productsGrid");
  const productTitleEl = document.getElementById("productTitle");
  if (productsGrid || productTitleEl) {
    const products = await loadProducts();
    if (productsGrid) {
      initCatalogPage(products, settings, getFavorites, updateFavUI);
    }
    if (productTitleEl) {
      initProductDetailPage(products, settings, updateFavUI);
    }
  }

  updateFavUI();
  hideLoader();
});

function applySiteSettings(s) {
  // SEO & Favicon
  if (s.seoTitle && (location.pathname === "/" || location.pathname === "/index.html")) {
    document.title = s.seoTitle;
  }
  const setMeta = (selector, attr, val) => {
    if (!val) return;
    let el = document.querySelector(selector);
    if (!el) {
      el = document.createElement("meta");
      if (selector.includes("property=")) {
        el.setAttribute("property", selector.match(/property="([^"]+)"/)[1]);
      } else if (selector.includes("name=")) {
        el.setAttribute("name", selector.match(/name="([^"]+)"/)[1]);
      }
      document.head.appendChild(el);
    }
    el.setAttribute(attr, val);
  };
  setMeta('meta[name="description"]', "content", s.seoDescription);
  setMeta('meta[name="keywords"]', "content", s.seoKeywords);
  setMeta('meta[property="og:title"]', "content", s.seoTitle);
  setMeta('meta[property="og:description"]', "content", s.seoDescription);
  setMeta('meta[property="og:image"]', "content", s.ogImage || s.logoUrl);

  const iconUrl = s.logoUrl || "/images/logo.png";
  document.querySelectorAll('link[rel="icon"], link[rel="apple-touch-icon"]').forEach((link) => {
    link.href = iconUrl;
  });

  // Navbar & Footer Logo
  const navImg = document.getElementById("navbarLogoImg");
  const navFallback = document.getElementById("navbarLogoFallback");
  if (navFallback) navFallback.textContent = s.brandName || "Lalila";
  if (navImg) navImg.src = iconUrl;

  const footImg = document.getElementById("footerLogoImg");
  const footFallback = document.getElementById("footerLogoFallback");
  if (footFallback) footFallback.textContent = s.brandName || "Lalila";
  if (footImg) footImg.src = iconUrl;

  // Ana Sayfa Metinleri
  const setText = (id, val) => {
    const el = document.getElementById(id);
    if (el && val !== undefined && val !== "") el.textContent = val;
  };
  setText("heroTitle", s.heroTitle);
  setText("heroSubtitle", s.heroSubtitle);
  setText("heroBtn1", s.heroBtn1Text);
  setText("heroBtn2", s.heroBtn2Text);
  setText("stepsTitle", s.stepsTitle);
  setText("stepsSubtitle", s.stepsSubtitle);
  setText("categoriesTitle", s.categoriesTitle);
  setText("categoriesSubtitle", s.categoriesSubtitle);
  setText("footerDesc", s.footerDesc);
  setText("footerAddress", s.address);
  setText("footerPhone", s.phone);
  setText("footerCopyright", s.copyright);

  // Slider
  const sliderEl = document.getElementById("heroSlider");
  if (sliderEl && Array.isArray(s.slides) && s.slides.length) {
    sliderEl.innerHTML = s.slides
      .map(
        (sl, idx) => `
      <div class="slide ${idx === 0 ? "active" : ""}" style="background-image: url('${escapeHtml(sl.image)}');">
        <div class="slide-caption">
          <h3>${escapeHtml(sl.title)}</h3>
          <p>${escapeHtml(sl.subtitle)}</p>
        </div>
      </div>`
      )
      .join("");

    const slides = sliderEl.querySelectorAll(".slide");
    if (slides.length > 1) {
      let current = 0;
      setInterval(() => {
        slides[current].classList.remove("active");
        current = (current + 1) % slides.length;
        slides[current].classList.add("active");
      }, 4500);
    }
  }

  // 3 Adım
  const stepsGrid = document.getElementById("stepsGrid");
  if (stepsGrid && Array.isArray(s.steps) && s.steps.length) {
    stepsGrid.innerHTML = s.steps
      .map(
        (st, idx) => `
      <div class="step-item">
        <div class="step-number">${idx + 1}</div>
        <h3>${escapeHtml(st.title)}</h3>
        <p>${escapeHtml(st.desc)}</p>
      </div>`
      )
      .join("");
  }

  // Perde Türleri + Özel Emoji
  const categoriesGrid = document.getElementById("categoriesGrid");
  if (categoriesGrid && Array.isArray(s.categories) && s.categories.length) {
    categoriesGrid.innerHTML = s.categories
      .map(
        (cat) => `
      <a href="/catalog?cat=${encodeURIComponent(cat.id)}" class="category-card" style="background-image: url('${escapeHtml(cat.image)}'); display:block; text-decoration:none;">
        <div class="category-icon">${escapeHtml(cat.emoji || "🪟")}</div>
        <h3>${escapeHtml(cat.name)}</h3>
      </a>`
      )
      .join("");
  }

  // Sağ Alt WhatsApp Tuşu & Linkler
  const waNum = (s.whatsappNumber || DEFAULT_SETTINGS.whatsappNumber).replace(/[^0-9]/g, "");
  const waMsg = s.whatsappMessage || DEFAULT_SETTINGS.whatsappMessage;
  const waUrl = `https://wa.me/${waNum}?text=${encodeURIComponent(waMsg)}`;

  if (!document.querySelector(".whatsapp-float")) {
    const wa = document.createElement("a");
    wa.className = "whatsapp-float";
    wa.href = waUrl;
    wa.target = "_blank";
    wa.rel = "noopener";
    wa.setAttribute("aria-label", "WhatsApp ile yazın");
    wa.innerHTML =
      '<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M16.003 3C8.83 3 3 8.83 3 16c0 2.29.6 4.52 1.74 6.49L3 29l6.7-1.72A12.94 12.94 0 0 0 16 29c7.17 0 13-5.83 13-13S23.17 3 16.003 3zm0 23.7c-1.94 0-3.84-.52-5.5-1.5l-.4-.23-3.98 1.02 1.06-3.88-.26-.4A10.66 10.66 0 0 1 5.3 16c0-5.9 4.8-10.7 10.7-10.7S26.7 10.1 26.7 16 21.9 26.7 16 26.7zm5.86-8c-.32-.16-1.9-.94-2.2-1.04-.3-.1-.5-.16-.72.16-.22.32-.84 1.04-1.03 1.26-.19.22-.38.24-.7.08-.32-.16-1.36-.5-2.58-1.6-.95-.85-1.6-1.9-1.78-2.22-.19-.32-.02-.5.14-.66.14-.14.32-.38.48-.57.16-.19.22-.32.32-.54.1-.22.05-.4-.03-.57-.08-.16-.72-1.74-.99-2.38-.26-.62-.52-.54-.72-.55h-.6c-.22 0-.57.08-.87.4-.3.32-1.14 1.12-1.14 2.72s1.17 3.16 1.33 3.38c.16.22 2.3 3.5 5.56 4.92.78.34 1.38.54 1.86.7.78.25 1.5.21 2.06.13.63-.09 1.9-.78 2.17-1.53.27-.75.27-1.4.19-1.53-.08-.13-.3-.21-.62-.37z"/></svg>';
    document.body.appendChild(wa);
  }
  const footerWa = document.getElementById("footerWhatsapp");
  if (footerWa) {
    footerWa.href = waUrl;
    footerWa.textContent = "+" + waNum;
  }
}

function initCatalogPage(products, settings, getFavorites, updateFavUI) {
  const grid = document.getElementById("productsGrid");
  const filterGroup = document.getElementById("categoryFilters");
  const searchInput = document.getElementById("catalogSearch");
  const lightFilter = document.getElementById("lightFilter");
  const statusEl = document.getElementById("catalogStatus");

  const urlCat = new URLSearchParams(location.search).get("cat");
  let selectedCategory = urlCat || "all";
  let onlyFavorites = false;

  // Dinamik kategori filtre butonları
  if (filterGroup) {
    const cats = settings.categories || DEFAULT_SETTINGS.categories;
    filterGroup.innerHTML =
      `<button type="button" class="filter-btn ${selectedCategory === "all" ? "active" : ""}" data-category="all">Tümü</button>` +
      cats
        .map(
          (c) =>
            `<button type="button" class="filter-btn ${selectedCategory === c.id ? "active" : ""}" data-category="${escapeHtml(c.id)}">${escapeHtml(c.emoji || "")} ${escapeHtml(c.name)}</button>`
        )
        .join("");

    filterGroup.querySelectorAll(".filter-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        onlyFavorites = false;
        filterGroup.querySelectorAll(".filter-btn").forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        selectedCategory = btn.getAttribute("data-category") || "all";
        renderCards();
      });
    });
  }

  const renderCards = () => {
    const query = (searchInput?.value || "").trim().toLowerCase();
    const light = lightFilter?.value || "all";
    const favs = getFavorites();

    const filtered = products.filter((p) => {
      const matchCat = selectedCategory === "all" || p.category === selectedCategory;
      const matchLight = light === "all" || p.light === light;
      const hay = `${p.name} ${p.desc} ${p.badge || ""} ${p.categoryLabel || ""}`.toLowerCase();
      const matchQuery = !query || hay.includes(query);
      const matchFav = !onlyFavorites || favs.includes(p.id);
      return matchCat && matchLight && matchQuery && matchFav;
    });

    grid.innerHTML = filtered
      .map(
        (p) => `
      <article class="product-card" data-id="${escapeHtml(p.id)}" style="background: var(--bg-secondary); border-radius: 10px; overflow: hidden; border: 1px solid rgba(28, 28, 28, 0.08); position: relative;">
        <div class="product-media" style="aspect-ratio: 4/3; background: url('${escapeHtml(p.image || "/images/category-tul.jpg")}') center/cover; position: relative;">
          ${p.badge ? `<span class="product-badge" style="background: ${escapeHtml(p.badgeColor || "#B08D57")};">${escapeHtml(p.badge)}</span>` : ""}
        </div>
        <div class="product-body" style="padding: 20px;">
          <span style="font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.06em; color: var(--accent); font-weight: 600;">${escapeHtml(p.categoryLabel || p.category)}</span>
          <h3 style="font-family: var(--font-serif); font-size: 1.25rem; margin: 6px 0 8px;">${escapeHtml(p.name)}</h3>
          ${p.price ? `<p style="font-weight: 600; font-size: 0.95rem; color: var(--accent); margin-bottom: 6px;">${escapeHtml(p.price)}</p>` : ""}
          <p style="font-size: 0.875rem; color: var(--text-secondary); margin-bottom: 16px;">${escapeHtml(p.desc || "")}</p>
          <div style="display: flex; justify-content: space-between; align-items: center; gap: 10px;">
            <a href="/product/${encodeURIComponent(p.id)}" style="padding: 8px 14px; font-size: 0.8rem; text-decoration: none; border: 1px solid var(--text-secondary); border-radius: 4px; color: var(--text-primary);">İncele</a>
            <button type="button" class="fav-toggle-btn" data-fav-id="${escapeHtml(p.id)}" style="background: none; border: 1px solid rgba(28,28,28,0.15); padding: 8px 12px; border-radius: 4px; cursor: pointer;">🤍 Favori</button>
          </div>
        </div>
      </article>`
      )
      .join("");

    if (statusEl) {
      statusEl.textContent = `${filtered.length} ürün listeleniyor${onlyFavorites ? " (Favoriler filtresi aktif)" : ""}.`;
    }
    updateFavUI();
  };

  searchInput?.addEventListener("input", renderCards);
  lightFilter?.addEventListener("change", renderCards);

  const favBtn = document.getElementById("catalogFavoritesBtn");
  favBtn?.addEventListener("click", (e) => {
    e.preventDefault();
    onlyFavorites = !onlyFavorites;
    renderCards();
  });

  renderCards();
}

function initProductDetailPage(products, settings, updateFavUI) {
  const id = decodeURIComponent(location.pathname.split("/").filter(Boolean).pop() || "");
  const p = products.find((item) => item.id === id);

  const titleEl = document.getElementById("productTitle");
  const descEl = document.getElementById("productDesc");
  const metaEl = document.getElementById("productMeta");
  const catEl = document.getElementById("productCat");
  const priceEl = document.getElementById("productPrice");
  const imgEl = document.getElementById("productImg");
  const badgeEl = document.getElementById("productBadge");
  const favBtn = document.getElementById("productFav");
  const waBtn = document.getElementById("productWaBtn");

  if (!p) {
    titleEl.textContent = "Ürün bulunamadı";
    descEl.textContent = "Bu ürün kataloğumuzda yer almıyor veya kaldırılmış olabilir.";
    if (favBtn) favBtn.style.display = "none";
    return;
  }

  document.title = `${p.name} | ${settings.brandName || "Lalila"}`;
  titleEl.textContent = p.name;
  descEl.textContent = p.desc || "";
  catEl.textContent = p.categoryLabel || p.category || "";
  if (p.price) priceEl.textContent = p.price;
  metaEl.textContent = `${p.lightLabel || ""} • Ürün kodu: ${p.id}`;

  if (imgEl && p.image) {
    imgEl.src = p.image;
    imgEl.alt = p.name;
    imgEl.style.display = "block";
  }
  if (badgeEl && p.badge) {
    badgeEl.textContent = p.badge;
    badgeEl.style.background = p.badgeColor || "#B08D57";
    badgeEl.style.display = "inline-block";
  }
  if (favBtn) {
    favBtn.setAttribute("data-fav-id", p.id);
    updateFavUI();
  }
  if (waBtn) {
    const waNum = (settings.whatsappNumber || DEFAULT_SETTINGS.whatsappNumber).replace(/[^0-9]/g, "");
    const text = `Merhaba, "${p.name}" ürünü hakkında bilgi ve ölçü randevusu almak istiyorum.`;
    waBtn.href = `https://wa.me/${waNum}?text=${encodeURIComponent(text)}`;
  }
}
