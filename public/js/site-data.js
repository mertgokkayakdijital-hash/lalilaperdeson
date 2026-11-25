import { db } from "/js/firebase-config.js";
import {
  doc,
  getDoc,
  setDoc,
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

export const DEFAULT_SETTINGS = {
  seoTitle: "Lalila Perde Sistemleri | Keşif ve Ölçü Randevusu",
  seoDescription: "El işi yapılmış lüks tül, fon, stor, zebra, jaluzi ve motorlu perde sistemleri. Ücretsiz keşif ve ölçü randevusu.",
  seoKeywords: "perde, lüks perde, tül perde, fon perde, motorlu perde, stor perde, lalila",
  ogImage: "/images/logo.png",
  logoUrl: "/images/logo.png",
  brandName: "Lalila",
  whatsappNumber: "905551234567",
  whatsappMessage: "Merhaba, perde sistemleri hakkında bilgi ve ücretsiz keşif randevusu almak istiyorum.",
  heroTitle: "Ferah Yaşam, Sessiz Lüks",
  heroSubtitle: "El işi yapılmış premium perde sistemleriyle evinizi zenginleştirin. Kendi tarzını keşfedin.",
  heroBtn1Text: "Ücretsiz Keşif Randevu Al",
  heroBtn1Link: "#contact",
  heroBtn2Text: "Koleksiyonu Keşfet",
  heroBtn2Link: "/catalog",
  slides: [
    { image: "/images/hero-1.jpg", title: "Tül Perde Sistemleri", subtitle: "Hafif ve havalandırıcı" },
    { image: "/images/hero-2.jpg", title: "Motorlu Perde Sistemleri", subtitle: "Akıllı ve otomatik" },
    { image: "/images/hero-3.jpg", title: "Jaluzi ve Stor", subtitle: "Mimari ve işlevsel" }
  ],
  stepsTitle: "3 Adımda Muhteşem Eviniz",
  stepsSubtitle: "Model seçimi → Ücretsiz ölçü → Kusursuz montaj",
  steps: [
    { title: "Model Seçimi", desc: "Kategorilerden veya filtrelerden ideal sistemi bulun." },
    { title: "Ücretsiz Ölçü", desc: "Uzmanımız evinize gelerek hassas ölçüm yapar." },
    { title: "Montaj ve Dikim", desc: "Uzman takımımız sistemi kusursuz şekilde monte eder." }
  ],
  categoriesTitle: "Perde Türleri",
  categoriesSubtitle: "Her sistemde özgün bir ustalık",
  categories: [
    { id: "tul", name: "Tül Perde", emoji: "🪟", image: "/images/category-tul.jpg" },
    { id: "fon", name: "Fon Perde", emoji: "🎭", image: "/images/category-fon.jpg" },
    { id: "stor", name: "Stor Perde", emoji: "📜", image: "/images/category-stor.jpg" },
    { id: "zebra", name: "Zebra Perde", emoji: "🦓", image: "/images/category-zebra.jpg" },
    { id: "jaluzi", name: "Jaluzi Sistemler", emoji: " blinds", image: "/images/category-jaluzi.jpg" },
    { id: "motorlu", name: "Motorlu Perde", emoji: "⚡", image: "/images/category-motorlu.jpg" }
  ],
  footerDesc: "Premium perde sistemleriyle evinizi zenginleştiriyoruz. Ücretsiz ev ölçü randevusu için bize ulaşın.",
  address: "Büyükdere Cad. No:143, Şişli/İstanbul",
  phone: "+90 212 555 12 34",
  copyright: "© 2026 Lalila Perde Sistemleri. Tüm hakları saklıdır."
};
DEFAULT_SETTINGS.categories[4].emoji = "🏛️";

export const DEFAULT_PRODUCTS = [
  {
    id: "tul-keten-01",
    name: "Linen Breeze Keten Tül",
    category: "tul",
    categoryLabel: "Tül Perde",
    light: "sheer",
    lightLabel: "Yüksek ışık (şeffaf)",
    badge: "Yeni Ürün",
    badgeColor: "#B08D57",
    price: "",
    image: "/images/category-tul.jpg",
    desc: "Doğal keten dokulu, gün ışığını yumuşakça içeri alan zarif tül."
  },
  {
    id: "motorlu-somfy-02",
    name: "Sessiz Motorlu Karartma",
    category: "motorlu",
    categoryLabel: "Motorlu Sistem",
    light: "blackout",
    lightLabel: "Tam karartma",
    badge: "Fırsat Ürünü",
    badgeColor: "#D9534F",
    price: "",
    image: "/images/category-motorlu.jpg",
    desc: "Uzaktan kumanda ve zamanlayıcı uyumlu, sessiz ray mekanizması."
  },
  {
    id: "fon-kadife-03",
    name: "Velvet Aura Fon Perde",
    category: "fon",
    categoryLabel: "Fon Perde",
    light: "semi",
    lightLabel: "Yarı karartma",
    badge: "",
    badgeColor: "#B08D57",
    price: "",
    image: "/images/category-fon.jpg",
    desc: "Yarı karartma dokusu ve tok duruşuyla salonlara derinlik katar."
  }
];

const LS_SETTINGS = "lalila_site_settings_v2";
const LS_PRODUCTS = "lalila_products_v2";

export async function loadSiteSettings() {
  try {
    const snap = await getDoc(doc(db, "site", "settings"));
    if (snap.exists()) {
      const merged = { ...DEFAULT_SETTINGS, ...snap.data() };
      localStorage.setItem(LS_SETTINGS, JSON.stringify(merged));
      return merged;
    }
  } catch (e) {
    console.warn("Firestore settings okunamadı, yerel önbellek kullanılıyor:", e);
  }
  try {
    const cached = JSON.parse(localStorage.getItem(LS_SETTINGS) || "null");
    if (cached) return { ...DEFAULT_SETTINGS, ...cached };
  } catch {}
  return { ...DEFAULT_SETTINGS };
}

export async function saveSiteSettings(data) {
  const payload = { ...DEFAULT_SETTINGS, ...data, updatedAt: Date.now() };
  localStorage.setItem(LS_SETTINGS, JSON.stringify(payload));
  await setDoc(doc(db, "site", "settings"), payload, { merge: true });
  return payload;
}

export async function loadProducts() {
  try {
    const snap = await getDocs(collection(db, "products"));
    if (!snap.empty) {
      const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      items.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
      localStorage.setItem(LS_PRODUCTS, JSON.stringify(items));
      return items;
    }
  } catch (e) {
    console.warn("Firestore ürünleri okunamadı, yerel önbellek kullanılıyor:", e);
  }
  try {
    const cached = JSON.parse(localStorage.getItem(LS_PRODUCTS) || "null");
    if (Array.isArray(cached) && cached.length) return cached;
  } catch {}
  return [...DEFAULT_PRODUCTS];
}

export async function addProductItem(product) {
  const item = { ...product, createdAt: Date.now() };
  const ref = await addDoc(collection(db, "products"), item);
  return { id: ref.id, ...item };
}

export async function updateProductItem(id, product) {
  await setDoc(doc(db, "products", id), { ...product, updatedAt: Date.now() }, { merge: true });
}

export async function deleteProductItem(id) {
  await deleteDoc(doc(db, "products", id));
}
