const PASS = "212004";
const getStore = (k, d) => JSON.parse(localStorage.getItem(k)) || d;
const setStore = (k, v) => localStorage.setItem(k, JSON.stringify(v));

let items = getStore('m4t_items', [
    {id:1, n:"ນ້ຳດື່ມ", p:5000, c:"ເຄື່ອງດື່ມ", img:"https://images.unsplash.com/photo-1548919973-5dea5846f669?w=300"},
    {id:2, n:"ກາເຟເຢັນ", p:25000, c:"ເຄື່ອງດື່ມ", img:"https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=300"}
]);
let shop = getStore('m4t_shop', { n: "M4T POS SHOP", t: "020 1234 5678", q: "" });
let sales = getStore('m4t_v3', []);
let cart = [], curCat = 'all';

const el = id => document.getElementById(id);
const openM = id => el(id).classList.remove('hidden');
const closeM = id => el(id).classList.add('hidden');

function render() {
    const q = el('search').value.toLowerCase();
    const filtered = items.filter(i => (curCat === 'all' || i.c === curCat) && i.n.toLowerCase().includes(q));
    el('prod-grid').innerHTML = filtered.map(i => `
        <div onclick="add(${i.id})" class="product-card bg-white rounded-3xl overflow-hidden cursor-pointer">
            <div class="h-32 bg-slate-100"><img src="${i.img || ''}" class="w-full h-full object-cover" onerror="this.style.display='none'"></div>
            <div class="p-3">
                <h3 class="text-[11px] font-bold text-gray-700 truncate">${i.n}</h3>
                <p class="text-indigo-600 font-black text-sm mt-1">${i.p.toLocaleString()} ₭</p>
            </div>
        </div>`).join('');
    
    const cats = ['all', ...new Set(items.map(i => i.c))];
    el('cats').innerHTML = cats.map(c => `
        <button onclick="setCat('${c}')" class="${curCat===c ? 'bg-indigo-600 text-white shadow-lg' : 'bg-white text-gray-400'} px-5 py-2 rounded-2xl text-[11px] font-bold border transition-all">
            ${c === 'all' ? '🛍️ ທັງໝົດ' : c}
        </button>`).join('');
    el('head-title').innerText = shop.n;
}

function setCat(c) { curCat = c; render(); }
function add(id) { 
    const x = cart.find(i => i.id === id); 
    x ? x.q++ : cart.push({...items.find(i => i.id === id), q:1}); 
    updCart(); 
}
function qty(id, d) { 
    const i = cart.find(x => x.id === id); 
    if(i) i.q += d; 
    cart = cart.filter(x => x.q > 0); 
    updCart(); 
}
function clearCart() { cart = []; updCart(); }

function updCart() {
    let t = 0;
    el('cart-list').innerHTML = cart.length ? cart.map(i => { 
        t += i.p * i.q; 
        return `<div class="flex justify-between items-center bg-gray-50 p-3 rounded-2xl border border-gray-100">
            <div class="flex-1 truncate"><b class="text-gray-800 text-xs">${i.n}</b><div class="text-[10px] text-indigo-500">${i.p.toLocaleString()} ₭</div></div>
            <div class="flex items-center gap-2 bg-white p-1 rounded-xl border">
                <button onclick="qty(${i.id},-1)" class="w-7 h-7 text-red-500 font-bold">-</button>
                <b class="w-5 text-center text-xs">${i.q}</b>
                <button onclick="qty(${i.id},1)" class="w-7 h-7 text-green-600 font-bold">+</button>
            </div>
        </div>` }).join('') : `<div class="h-full flex flex-col items-center justify-center opacity-20"><p>🛒 ຕະກ້າຫວ່າງ</p></div>`;
    el('g-total').innerText = t.toLocaleString() + ' ₭';
}

async function printProcess(s) {
    el('rcp-shop').innerText = shop.n; el('rcp-tel').innerText = shop.t; el('rcp-id').innerText = s.id;
    el('rcp-date').innerText = new Date(s.time).toLocaleString('lo-LA'); el('rcp-cus').innerText = s.cus;
    el('rcp-total').innerText = s.total.toLocaleString() + ' ₭';
    let details = `ຊຳລະ: ${s.pm}`;
    if(s.pm === 'ເງິນສົດ') details += ` | ຮັບ: ${s.rec.toLocaleString()} | ທອນ: ${s.chg.toLocaleString()}`;
    el('rcp-details').innerHTML = details;
    el('rcp-items').innerHTML = JSON.parse(s.items).map(i => `<tr><td style="padding:5px 0;">${i.n} x ${i.q}</td><td align="right">${(i.p*i.q).toLocaleString()}</td></tr>`).join('');
    el('wm-body').innerHTML = Array(40).fill(`<span class="wm-text">${shop.n}</span>`).join('');
    setTimeout(async () => {
        const canvas = await html2canvas(el('rcp-wrap'), { scale: 2 });
        const link = document.createElement('a');
        link.download = `Receipt-${s.id}.png`;
        link.href = canvas.toDataURL();
        link.click();
        msg("🧾 ບັນທຶກໃບບິນແລ້ວ");
    }, 500);
}

async function pay() {
    const total = cart.reduce((a,b)=>a+(b.p*b.q),0), rVal = +el('rec').value || 0, pm = document.querySelector('input[name="pm"]:checked').value;
    if(!cart.length) return msg('⚠️ ເລືອກສິນຄ້າກ່ອນ!','bg-orange-500');
    const s = { id: 'M4T: ' + Date.now().toString().slice(-6), items: JSON.stringify(cart), total, pm, st: el('st').value, dd: el('dd').value, cus: el('cus').value || 'ລູກຄ້າທົ່ວໄປ', rec: rVal || total, chg: (rVal > total ? rVal - total : 0), time: new Date() };
    sales.push(s); setStore('m4t_v3', sales);
    await printProcess(s);
    cart = []; updCart(); el('rec').value = el('cus').value = ''; setQR(0);
}

function askPass() { if(prompt("🔐 ລະຫັດຜ່ານ:") === PASS) openM('adminM'); else msg("❌ ລະຫັດຜິດ!","bg-red-600"); }
function saveShop() { shop = { n: el('s-n').value, t: el('s-t').value, q: el('s-q').value }; setStore('m4t_shop', shop); msg("✅ ບັນທຶກແລ້ວ"); render(); closeM('shopM'); }
function saveProd() {
    items.push({ id: Date.now(), n: el('p-n').value, p: +el('p-p').value, c: el('p-c').value || 'ອື່ນໆ', img: el('p-i').value });
    setStore('m4t_items', items); render(); updPList(); msg("📦 ເພີ່ມແລ້ວ");
}
function updPList() { el('p-list').innerHTML = items.map(i => `<div class="flex justify-between items-center p-3 bg-white rounded-2xl border"><span>${i.n} (${i.p.toLocaleString()} ₭)</span><button onclick="delP(${i.id})" class="text-red-400">✕</button></div>`).join(''); }
function delP(id) { items = items.filter(i=>i.id!==id); setStore('m4t_items', items); render(); updPList(); }
function showHist() {
    openM('histM');
    el('h-list').innerHTML = sales.sort((a,b)=>new Date(b.time)-new Date(a.time)).map(s => `
        <div class="bg-white p-4 rounded-2xl border flex justify-between items-center mb-2">
            <div><b class="text-indigo-700">${s.cus}</b><div class="text-[10px] opacity-40">${new Date(s.time).toLocaleString()}</div></div>
            <div class="text-right"><b>${s.total.toLocaleString()} ₭</b><br><button onclick="reP('${s.id}')" class="text-indigo-600 text-[10px]">ພິມຄືນ</button></div>
        </div>`).join('');
}
function reP(id) { const s = sales.find(x => x.id === id); if(s) printProcess(s); }
function exportData() { const blob = new Blob([JSON.stringify({ items, shop, sales })], {type: 'application/json'}); const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `M4T-Backup.json`; a.click(); }
function msg(m, c='bg-green-600') { const t = el('toast'); t.innerText = m; t.className = `fixed bottom-10 left-1/2 -translate-x-1/2 px-8 py-4 rounded-3xl text-white z-[1000] text-sm font-bold shadow-2xl ${c}`; t.classList.remove('hidden'); setTimeout(()=>t.classList.add('hidden'), 3000); }
function debtTog() { el('dd').classList.toggle('hidden', el('st').value !== 'ຕິດໜີ້'); }
function setQR(sw) { if(sw && !shop.q) return msg("⚠️ ຍັງບໍ່ມີ QR", "bg-orange-500"); el('qr-img').src=shop.q; el('qrM').classList.toggle('hidden', !sw); }

// Globalize for firebase script access
window.msg = msg;
window.render = render;

window.onload = () => { 
    if(localStorage.getItem('m4t_user')) render(); 
    updPList(); el('s-n').value = shop.n; el('s-t').value = shop.t; el('s-q').value = shop.q; 
};
