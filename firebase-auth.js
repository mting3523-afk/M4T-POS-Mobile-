import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyAKqyFHcl-Zft2eT-F4K5DUXfBLoYNPLMs",
    authDomain: "products-df129.firebaseapp.com",
    projectId: "products-df129",
    storageBucket: "products-df129.firebasestorage.app",
    messagingSenderId: "923116967217",
    appId: "1:923116967217:web:8e3699a5be6b45bda98c10"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Handle Login Function
async function handleLogin() {
    const name = document.getElementById('user-name').value.trim();
    const tel = document.getElementById('user-tel').value.trim();
    const btn = document.getElementById('login-btn');

    if (!name || !tel) {
        window.msg("⚠️ ກະລຸນາປ້ອນຂໍ້ມູນໃຫ້ຄົບ!", "bg-orange-500");
        return;
    }

    btn.innerText = "⏳ ກຳລັງໂຫລດ...";
    btn.disabled = true;

    try {
        await addDoc(collection(db, "user_logs"), {
            username: name,
            telephone: tel,
            loginAt: serverTimestamp(),
            device: navigator.userAgent
        });

        localStorage.setItem('m4t_user', JSON.stringify({ name, tel }));
        
        document.getElementById('login-screen').classList.add('hidden');
        document.getElementById('main-app').classList.remove('hidden');
        window.msg("👋 ສະບາຍດີ, " + name);
        window.render();
    } catch (e) {
        console.error(e);
        window.msg("❌ ເກີດຂໍ້ຜິດພາດໃນການເຊື່ອມຕໍ່", "bg-red-500");
    } finally {
        btn.innerText = "ເຂົ້າໃຊ້ງານ";
        btn.disabled = false;
    }
}

function handleLogout() {
    localStorage.removeItem('m4t_user');
    location.reload();
}

// Bind to window to access from global scope
window.handleLogin = handleLogin;
window.handleLogout = handleLogout;

// Initial Checks
document.addEventListener('DOMContentLoaded', () => {
    const loginBtn = document.getElementById('login-btn');
    if(loginBtn) loginBtn.onclick = handleLogin;
    
    const logoutBtn = document.getElementById('logout-btn');
    if(logoutBtn) logoutBtn.onclick = handleLogout;

    const savedUser = localStorage.getItem('m4t_user');
    if (savedUser) {
        document.getElementById('login-screen').classList.add('hidden');
        document.getElementById('main-app').classList.remove('hidden');
        window.render();
    }
});
