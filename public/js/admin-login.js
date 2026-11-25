import { auth } from "/js/firebase-config.js";
import { signInWithEmailAndPassword, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

onAuthStateChanged(auth, (user) => { if (user) location.href = "/admin/dashboard"; });

document.getElementById("loginForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const err = document.getElementById("loginError");
  err.textContent = "";
  const email = e.target.email.value.trim();
  const password = e.target.password.value;
  try {
    await signInWithEmailAndPassword(auth, email, password);
    location.href = "/admin/dashboard";
  } catch (ex) {
    err.textContent = "Giriş başarısız. E-posta veya şifre hatalı.";
  }
});
