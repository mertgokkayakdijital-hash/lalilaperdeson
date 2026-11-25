import { auth } from "/js/firebase-config.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import {
  DEFAULT_SETTINGS,
  DEFAULT_PRODUCTS,
  loadSiteSettings,
  saveSiteSettings,
  loadProducts,
  addProductItem,
  updateProductItem,
  deleteProductItem
} from "/js/site-data.js";

let currentSettings = { ...DEFAULT_SETTINGS };
let currentProducts = [];

const showToast = (msg) => {
  const t = document.getElementById("adminToast");
  if (!t) return;
  t.textContent = msg;
  t.style.display = "block";
  clearTimeout(window._toastTimer);
  window._toastTimer = setTimeout(() => { t.style.display = "none"; }, 3500);
};

// Tabs
document.querySelectorAll(".admin-tab").forEach((tab) => {
  tab.addEventListener("click", () => {
    document.querySelectorAll(".admin-tab").forEach((b) => b.classList.remove("active"));
    document.querySelectorAll(".admin-panel").forEach((p) => p.classList.remove("active"));
    tab.classList.add("active");
    const target = document.getElementById(tab.getAttribute("data-tab"));
    if (target) target.classList.add("active");
  });
});

// Auth check
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    location.href = "/admin/";
    return;
  }
  document.getElementById("adminUser").textContent = "Yönetici: " + user.email;
  await initAdmin();
});

document.getElementById("logoutBtn").addEventListener("click", async () => {
  await signOut(auth);
  location.href = "/admin/";
});

async function initAdmin() {
  currentSettings = await loadSiteSettings();
  fillSettingsForms();
  renderCategoriesEditor();
  populateProductCategorySelect();
  await refreshProducts();
}

function populateProductCategorySelect() {
  const sel = document.getElementById("prodCategory");
  sel.innerHTML = "";
  (currentSettings.categories || DEFAULT_SETTINGS.categories).forEach((c) => {
    const opt = document.createElement("option");
    opt.value = c.id;
    opt.textContent = `${c.emoji || ""} ${c.name}`;
    sel.appendChild(opt);
  });
}

function fillSettingsForms() {
  document.getElementById("setHeroTitle").value = currentSettings.heroTitle || "";
  document.getElementById("setHeroSubtitle").value = currentSettings.heroSubtitle || "";
  document.getElementById("setHeroBtn1Text").value = currentSettings.heroBtn1Text || "";
  document.getElementById("setHeroBtn2Text").value = currentSettings.heroBtn2Text || "";
  document.getElementById("setStepsTitle").value = currentSettings.stepsTitle || "";
  document.getElementById("setStepsSubtitle").value = currentSettings.stepsSubtitle || "";
  document.getElementById("setCategoriesTitle").value = currentSettings.categoriesTitle || "";
  document.getElementById("setCategoriesSubtitle").value = currentSettings.categoriesSubtitle || "";

  document.getElementById("setLogoUrl").value = currentSettings.logoUrl || "/images/logo.png";
  document.getElementById("setBrandName").value = currentSettings.brandName || "Lalila";
  document.getElementById("setWhatsappNumber").value = currentSettings.whatsappNumber || "";
  document.getElementById("setWhatsappMessage").value = currentSettings.whatsappMessage || "";
  document.getElementById("setPhone").value = currentSettings.phone || "";
  document.getElementById("setAddress").value = currentSettings.address || "";
  document.getElementById("setFooterDesc").value = currentSettings.footerDesc || "";
  document.getElementById("setCopyright").value = currentSettings.copyright || "";

  document.getElementById("setSeoTitle").value = currentSettings.seoTitle || "";
  document.getElementById("setSeoDescription").value = currentSettings.seoDescription || "";
  document.getElementById("setSeoKeywords").value = currentSettings.seoKeywords || "";
  document.getElementById("setOgImage").value = currentSettings.ogImage || "/images/logo.png";

  // Slides
  const slidesList = document.getElementById("slidesEditorList");
  slidesList.innerHTML = "";
  (currentSettings.slides || DEFAULT_SETTINGS.slides).forEach((s, i) => {
    const div = document.createElement("div");
    div.className = "form-grid";
    div.style.marginBottom = "12px";
    div.style.padding = "12px";
    div.style.background = "var(--bg-primary)";
    div.style.borderRadius = "8px";
    div.innerHTML = `
      <div class="form-group" style="margin:0"><label>Slayt ${i + 1} Başlık</label><input type="text" data-slide-title="${i}" value="${escapeHtml(s.title)}"></div>
      <div class="form-group" style="margin:0"><label>Slayt ${i + 1} Alt Yazı</label><input type="text" data-slide-sub="${i}" value="${escapeHtml(s.subtitle)}"></div>
      <div class="form-group" style="margin:0"><label>Slayt ${i + 1} Görsel Yolu</label><input type="text" data-slide-img="${i}" value="${escapeHtml(s.image)}"></div>
    `;
    slidesList.appendChild(div);
  });

  // Steps
  const stepsList = document.getElementById("stepsEditorList");
  stepsList.innerHTML = "";
  (currentSettings.steps || DEFAULT_SETTINGS.steps).forEach((st, i) => {
    const div = document.createElement("div");
    div.style.padding = "12px";
    div.style.background = "var(--bg-primary)";
    div.style.borderRadius = "8px";
    div.innerHTML = `
      <div class="form-group"><label>Adım ${i + 1} Başlık</label><input type="text" data-step-title="${i}" value="${escapeHtml(st.title)}"></div>
      <div class="form-group" style="margin:0"><label>Adım ${i + 1} Açıklama</label><input type="text" data-step-desc="${i}" value="${escapeHtml(st.desc)}"></div>
    `;
    stepsList.appendChild(div);
  });
}

// Perde Türleri & Emoji Editörü
const QUICK_EMOJIS = ["🪟", "🎭", "📜", "🦓", "🏛️", "⚡", "✨", "🌿", "🧵", "🏡", "☀️", "🌙", "💎", "🎀"];

function renderCategoriesEditor() {
  const container = document.getElementById("categoriesEditorList");
  container.innerHTML = "";
  const cats = currentSettings.categories || [];
  cats.forEach((cat, idx) => {
    const row = document.createElement("div");
    row.className = "cat-row-editor";
    row.innerHTML = `
      <div>
        <label style="font-size:0.75rem;display:block;margin-bottom:4px;">Emoji</label>
        <input type="text" class="cat-emoji-input" data-idx="${idx}" value="${escapeHtml(cat.emoji || "🪟")}" style="width:100%;text-align:center;font-size:1.3rem;padding:6px;border:1px solid rgba(128,128,128,0.3);border-radius:6px;">
      </div>
      <div>
        <label style="font-size:0.75rem;display:block;margin-bottom:4px;">Tür Kodu (İngilizce/küçük harf)</label>
        <input type="text" class="cat-id-input" data-idx="${idx}" value="${escapeHtml(cat.id)}" style="width:100%;padding:8px;border:1px solid rgba(128,128,128,0.3);border-radius:6px;">
      </div>
      <div>
        <label style="font-size:0.75rem;display:block;margin-bottom:4px;">Perde Türü Adı</label>
        <input type="text" class="cat-name-input" data-idx="${idx}" value="${escapeHtml(cat.name)}" style="width:100%;padding:8px;border:1px solid rgba(128,128,128,0.3);border-radius:6px;">
      </div>
      <div>
        <label style="font-size:0.75rem;display:block;margin-bottom:4px;">Arka Plan Görseli</label>
        <input type="text" class="cat-img-input" data-idx="${idx}" value="${escapeHtml(cat.image || "")}" style="width:100%;padding:8px;border:1px solid rgba(128,128,128,0.3);border-radius:6px;">
      </div>
      <div style="align-self:end;">
        <button type="button" class="btn-danger remove-cat-btn" data-idx="${idx}">Sil</button>
      </div>
      <div style="grid-column: 1 / -1;" class="emoji-picker-row">
        <span style="font-size:0.75rem;color:var(--text-secondary);align-self:center;margin-right:4px;">Hızlı Emoji Seç:</span>
        ${QUICK_EMOJIS.map((em) => `<button type="button" class="emoji-chip" data-target-idx="${idx}" data-emoji="${em}">${em}</button>`).join("")}
      </div>
    `;
    container.appendChild(row);
  });

  container.querySelectorAll(".emoji-chip").forEach((btn) => {
    btn.addEventListener("click", () => {
      const idx = Number(btn.getAttribute("data-target-idx"));
      const em = btn.getAttribute("data-emoji");
      currentSettings.categories[idx].emoji = em;
      renderCategoriesEditor();
    });
  });

  container.querySelectorAll(".remove-cat-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const idx = Number(btn.getAttribute("data-idx"));
      currentSettings.categories.splice(idx, 1);
      renderCategoriesEditor();
    });
  });
}

document.getElementById("addCategoryBtn").addEventListener("click", () => {
  syncCategoriesFromInputs();
  currentSettings.categories.push({
    id: "yeni-tur-" + (currentSettings.categories.length + 1),
    name: "Yeni Perde Türü",
    emoji: "🪟",
    image: "/images/category-tul.jpg"
  });
  renderCategoriesEditor();
});

function syncCategoriesFromInputs() {
  const emojis = document.querySelectorAll(".cat-emoji-input");
  const ids = document.querySelectorAll(".cat-id-input");
  const names = document.querySelectorAll(".cat-name-input");
  const imgs = document.querySelectorAll(".cat-img-input");
  const updated = [];
  for (let i = 0; i < names.length; i++) {
    updated.push({
      emoji: emojis[i].value.trim() || "🪟",
      id: ids[i].value.trim().toLowerCase().replace(/\s+/g, "-") || "tur-" + i,
      name: names[i].value.trim() || "Perde",
      image: imgs[i].value.trim() || "/images/category-tul.jpg"
    });
  }
  currentSettings.categories = updated;
}

document.getElementById("saveCategoriesBtn").addEventListener("click", async () => {
  try {
    syncCategoriesFromInputs();
    await saveSiteSettings(currentSettings);
    populateProductCategorySelect();
    showToast("✅ Perde türleri ve emojiler kaydedildi!");
  } catch (e) {
    showToast("❌ Hata: " + e.message);
  }
});

// Save Homepage
document.getElementById("saveHomepageBtn").addEventListener("click", async () => {
  try {
    currentSettings.heroTitle = document.getElementById("setHeroTitle").value.trim();
    currentSettings.heroSubtitle = document.getElementById("setHeroSubtitle").value.trim();
    currentSettings.heroBtn1Text = document.getElementById("setHeroBtn1Text").value.trim();
    currentSettings.heroBtn2Text = document.getElementById("setHeroBtn2Text").value.trim();
    currentSettings.stepsTitle = document.getElementById("setStepsTitle").value.trim();
    currentSettings.stepsSubtitle = document.getElementById("setStepsSubtitle").value.trim();
    currentSettings.categoriesTitle = document.getElementById("setCategoriesTitle").value.trim();
    currentSettings.categoriesSubtitle = document.getElementById("setCategoriesSubtitle").value.trim();

    const slides = [];
    document.querySelectorAll("[data-slide-title]").forEach((el, i) => {
      slides.push({
        title: el.value.trim(),
        subtitle: document.querySelector(`[data-slide-sub="${i}"]`).value.trim(),
        image: document.querySelector(`[data-slide-img="${i}"]`).value.trim()
      });
    });
    currentSettings.slides = slides;

    const steps = [];
    document.querySelectorAll("[data-step-title]").forEach((el, i) => {
      steps.push({
        title: el.value.trim(),
        desc: document.querySelector(`[data-step-desc="${i}"]`).value.trim()
      });
    });
    currentSettings.steps = steps;

    await saveSiteSettings(currentSettings);
    showToast("✅ Ana sayfa içerikleri kaydedildi!");
  } catch (e) {
    showToast("❌ Kayıt hatası: " + e.message);
  }
});

// Save Contact & WhatsApp
document.getElementById("saveContactBtn").addEventListener("click", async () => {
  try {
    currentSettings.logoUrl = document.getElementById("setLogoUrl").value.trim() || "/images/logo.png";
    currentSettings.brandName = document.getElementById("setBrandName").value.trim() || "Lalila";
    currentSettings.whatsappNumber = document.getElementById("setWhatsappNumber").value.replace(/[^0-9]/g, "");
    currentSettings.whatsappMessage = document.getElementById("setWhatsappMessage").value.trim();
    currentSettings.phone = document.getElementById("setPhone").value.trim();
    currentSettings.address = document.getElementById("setAddress").value.trim();
    currentSettings.footerDesc = document.getElementById("setFooterDesc").value.trim();
    currentSettings.copyright = document.getElementById("setCopyright").value.trim();

    await saveSiteSettings(currentSettings);
    showToast("✅ WhatsApp, logo ve iletişim bilgileri kaydedildi!");
  } catch (e) {
    showToast("❌ Kayıt hatası: " + e.message);
  }
});

// Save SEO
document.getElementById("saveSeoBtn").addEventListener("click", async () => {
  try {
    currentSettings.seoTitle = document.getElementById("setSeoTitle").value.trim();
    currentSettings.seoDescription = document.getElementById("setSeoDescription").value.trim();
    currentSettings.seoKeywords = document.getElementById("setSeoKeywords").value.trim();
    currentSettings.ogImage = document.getElementById("setOgImage").value.trim() || "/images/logo.png";

    await saveSiteSettings(currentSettings);
    showToast("✅ SEO ayarları kaydedildi!");
  } catch (e) {
    showToast("❌ Kayıt hatası: " + e.message);
  }
});

// Ürün Formu & Etiket Seçici
const badgePreset = document.getElementById("prodBadgePreset");
const customBadgeGroup = document.getElementById("customBadgeGroup");
badgePreset.addEventListener("change", () => {
  customBadgeGroup.style.display = badgePreset.value === "custom" ? "flex" : "none";
  if (badgePreset.value === "Fırsat Ürünü" || badgePreset.value === "İndirimli") {
    document.getElementById("prodBadgeColor").value = "#D9534F";
  } else if (badgePreset.value === "Yeni Ürün") {
    document.getElementById("prodBadgeColor").value = "#B08D57";
  }
});

// Görsel dosyası seçilirse base64 olarak sıkıştırıp ekle (Firebase Storage gerektirmeden anında çalışır)
document.getElementById("prodImageFile").addEventListener("change", (e) => {
  const file = e.target.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (ev) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const maxW = 800;
      const scale = Math.min(1, maxW / img.width);
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      document.getElementById("prodImage").value = canvas.toDataURL("image/jpeg", 0.78);
      showToast("📷 Görsel hazırlandı!");
    };
    img.src = ev.target.result;
  };
  reader.readAsDataURL(file);
});

document.getElementById("productForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const editId = document.getElementById("editProductId").value;
  const catId = document.getElementById("prodCategory").value;
  const catObj = (currentSettings.categories || []).find((c) => c.id === catId);
  const lightVal = document.getElementById("prodLight").value;
  const lightMap = {
    sheer: "Yüksek ışık (şeffaf)",
    semi: "Yarı karartma",
    blackout: "Tam karartma"
  };

  let badgeText = badgePreset.value;
  if (badgeText === "custom") {
    badgeText = document.getElementById("prodBadgeCustom").value.trim();
  }

  const productData = {
    name: document.getElementById("prodName").value.trim(),
    category: catId,
    categoryLabel: catObj ? catObj.name : catId,
    light: lightVal,
    lightLabel: lightMap[lightVal] || "",
    badge: badgeText,
    badgeColor: document.getElementById("prodBadgeColor").value,
    price: document.getElementById("prodPrice").value.trim(),
    image: document.getElementById("prodImage").value.trim() || "/images/category-tul.jpg",
    desc: document.getElementById("prodDesc").value.trim()
  };

  try {
    if (editId) {
      await updateProductItem(editId, productData);
      showToast("✅ Ürün güncellendi!");
    } else {
      await addProductItem(productData);
      showToast("✅ Yeni ürün eklendi!");
    }
    resetProductForm();
    await refreshProducts();
  } catch (err) {
    showToast("❌ Ürün kaydedilemedi: " + err.message);
  }
});

function resetProductForm() {
  document.getElementById("productForm").reset();
  document.getElementById("editProductId").value = "";
  document.getElementById("productFormTitle").textContent = "Yeni Ürün Ekle";
  document.getElementById("prodSubmitBtn").textContent = "+ Ürünü Kaydet";
  document.getElementById("prodCancelEditBtn").style.display = "none";
  customBadgeGroup.style.display = "none";
}

document.getElementById("prodCancelEditBtn").addEventListener("click", resetProductForm);

document.getElementById("seedDefaultsBtn").addEventListener("click", async () => {
  try {
    for (const p of DEFAULT_PRODUCTS) {
      await addProductItem(p);
    }
    await refreshProducts();
    showToast("✅ Örnek ürünler eklendi!");
  } catch (e) {
    showToast("❌ Hata: " + e.message);
  }
});

async function refreshProducts() {
  currentProducts = await loadProducts();
  document.getElementById("adminProductCount").textContent = String(currentProducts.length);
  const list = document.getElementById("adminProductsList");
  list.innerHTML = "";

  if (!currentProducts.length) {
    list.innerHTML = "<p style='color:var(--text-secondary);'>Henüz ürün bulunmuyor.</p>";
    return;
  }

  currentProducts.forEach((p) => {
    const card = document.createElement("div");
    card.className = "product-admin-item";
    card.innerHTML = `
      <div style="position:relative;">
        <img src="${escapeHtml(p.image || "/images/category-tul.jpg")}" alt="${escapeHtml(p.name)}">
        ${p.badge ? `<span style="position:absolute;top:10px;left:10px;background:${escapeHtml(p.badgeColor || "#B08D57")};color:#fff;padding:4px 10px;border-radius:999px;font-size:0.75rem;font-weight:600;">${escapeHtml(p.badge)}</span>` : ""}
      </div>
      <div class="product-admin-body">
        <div>
          <span style="font-size:0.75rem;color:var(--accent);font-weight:600;text-transform:uppercase;">${escapeHtml(p.categoryLabel || p.category)}</span>
          <h3 style="font-size:1.1rem;margin:4px 0;">${escapeHtml(p.name)}</h3>
          ${p.price ? `<p style="font-weight:600;font-size:0.9rem;margin-bottom:4px;">${escapeHtml(p.price)}</p>` : ""}
          <p style="font-size:0.83rem;color:var(--text-secondary);margin-bottom:12px;">${escapeHtml(p.desc || "")}</p>
        </div>
        <div style="display:flex;gap:8px;">
          <button type="button" class="btn-edit edit-prod-btn" data-id="${escapeHtml(p.id)}" style="flex:1;">Düzenle</button>
          <button type="button" class="btn-danger del-prod-btn" data-id="${escapeHtml(p.id)}">Kaldır</button>
        </div>
      </div>
    `;
    list.appendChild(card);
  });

  list.querySelectorAll(".del-prod-btn").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const id = btn.getAttribute("data-id");
      if (!confirm("Bu ürünü katalogdan kaldırmak istediğinize emin misiniz?")) return;
      try {
        await deleteProductItem(id);
        await refreshProducts();
        showToast("🗑️ Ürün kaldırıldı.");
      } catch (e) {
        showToast("❌ Silinemedi: " + e.message);
      }
    });
  });

  list.querySelectorAll(".edit-prod-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-id");
      const p = currentProducts.find((item) => item.id === id);
      if (!p) return;
      document.getElementById("editProductId").value = p.id;
      document.getElementById("prodName").value = p.name || "";
      document.getElementById("prodCategory").value = p.category || "tul";
      document.getElementById("prodLight").value = p.light || "sheer";
      document.getElementById("prodPrice").value = p.price || "";
      document.getElementById("prodImage").value = p.image || "";
      document.getElementById("prodDesc").value = p.desc || "";
      document.getElementById("prodBadgeColor").value = p.badgeColor || "#B08D57";

      const presetValues = ["", "Yeni Ürün", "Fırsat Ürünü", "Çok Satan", "İndirimli", "Özel Tasarım"];
      if (presetValues.includes(p.badge || "")) {
        badgePreset.value = p.badge || "";
        customBadgeGroup.style.display = "none";
      } else {
        badgePreset.value = "custom";
        customBadgeGroup.style.display = "flex";
        document.getElementById("prodBadgeCustom").value = p.badge || "";
      }

      document.getElementById("productFormTitle").textContent = "Ürünü Düzenle: " + p.name;
      document.getElementById("prodSubmitBtn").textContent = "Değişiklikleri Kaydet";
      document.getElementById("prodCancelEditBtn").style.display = "inline-block";
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  });
}

function escapeHtml(str) {
  return String(str || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
