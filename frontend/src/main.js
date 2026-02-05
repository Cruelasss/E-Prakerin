import './style.css';
// Import logika dari file yang sudah kita buat
import { initDashboard } from './js/dashboard.js';
import { initPeserta } from './js/peserta.js';
import { initForm } from './js/form.js';

const app = document.getElementById('app');

// Komponen Sidebar Reusable agar tidak duplikasi kode
const getSidebar = (activePage) => `
    <aside class="w-64 bg-indigo-900 text-white h-screen p-6 fixed">
        <div class="mb-10">
            <h1 class="text-2xl font-black italic tracking-tighter">INTERN-GATE</h1>
            <p class="text-indigo-400 text-[10px] uppercase font-bold tracking-widest">Balai Tekkomdik DIY</p>
        </div>
        <nav class="space-y-2">
            <button onclick="navigate('dashboard')" class="flex items-center gap-3 w-full text-left p-3 rounded-xl transition-all ${activePage === 'dashboard' ? 'bg-indigo-800 shadow-lg' : 'hover:bg-indigo-800/50 text-indigo-200'}">
                <span>📊</span> Dashboard
            </button>
            <button onclick="navigate('peserta')" class="flex items-center gap-3 w-full text-left p-3 rounded-xl transition-all ${activePage === 'peserta' ? 'bg-indigo-800 shadow-lg' : 'hover:bg-indigo-800/50 text-indigo-200'}">
                <span>👥</span> Data Peserta
            </button>
            <button onclick="navigate('form')" class="flex items-center gap-3 w-full text-left p-3 rounded-xl transition-all ${activePage === 'form' ? 'bg-indigo-800 shadow-lg' : 'hover:bg-indigo-800/50 text-indigo-200'}">
                <span>📝</span> Form Daftar
            </button>
        </nav>
        <div class="absolute bottom-6 left-6 right-6">
            <button onclick="navigate('login')" class="w-full p-3 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white transition-all text-sm font-bold">
                🚪 Keluar
            </button>
        </div>
    </aside>
`;

// Kamus Halaman (Templates)
const routes = {
    'login': `
        <div class="flex flex-col items-center justify-center h-screen bg-slate-100">
            <div class="bg-white p-10 rounded-[2.5rem] shadow-2xl shadow-indigo-100 text-center max-w-sm w-full">
                <h1 class="text-3xl font-black italic text-indigo-900 mb-2">INTERN-GATE</h1>
                <p class="text-slate-400 text-sm mb-8 font-medium">Monitoring System Login</p>
                <button onclick="navigate('dashboard')" class="w-full bg-indigo-600 text-white p-4 rounded-2xl font-bold shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all transform hover:-translate-y-1">
                    Masuk ke Dashboard
                </button>
            </div>
        </div>`,
    
    'dashboard': `
        <div class="flex">
            ${getSidebar('dashboard')}
            <main class="ml-64 p-8 w-full min-h-screen">
                <header class="mb-10">
                    <h2 class="text-3xl font-extrabold text-slate-800 tracking-tight">Executive Analytics</h2>
                    <p class="text-slate-500 font-medium">Data rekapitulasi otomatis dari database.</p>
                </header>
                
                <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
                    <div class="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                        <p class="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Total Database</p>
                        <h3 id="statTotal" class="text-4xl font-black text-slate-800 mt-1">0</h3>
                    </div>
                    <div class="bg-white p-6 rounded-3xl shadow-sm border-l-4 border-indigo-500">
                        <p class="text-indigo-500 text-[10px] font-bold uppercase tracking-widest">Aktif Magang</p>
                        <h3 id="statAktif" class="text-4xl font-black text-indigo-600 mt-1">0</h3>
                    </div>
                    <div class="bg-white p-6 rounded-3xl shadow-sm border-l-4 border-emerald-500">
                        <p class="text-emerald-500 text-[10px] font-bold uppercase tracking-widest">Alumni</p>
                        <h3 id="statAlumni" class="text-4xl font-black text-emerald-600 mt-1">0</h3>
                    </div>
                    <div class="bg-white p-6 rounded-3xl shadow-sm border-l-4 border-orange-500">
                        <p class="text-orange-500 text-[10px] font-bold uppercase tracking-widest">Pending</p>
                        <h3 id="statPending" class="text-4xl font-black text-orange-600 mt-1">0</h3>
                    </div>
                </div>

                <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div class="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100">
                        <h4 class="font-bold text-slate-700 mb-6 uppercase text-xs tracking-widest">Sebaran Jurusan</h4>
                        <div class="h-[300px]"><canvas id="jurusanChart"></canvas></div>
                    </div>
                    <div class="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100">
                        <h4 class="font-bold text-slate-700 mb-6 uppercase text-xs tracking-widest">Trend Bulanan</h4>
                        <div class="h-[300px]"><canvas id="trendChart"></canvas></div>
                    </div>
                </div>
            </main>
        </div>`,

    'peserta': `
        <div class="flex">
            ${getSidebar('peserta')}
            <main class="ml-64 p-8 w-full min-h-screen">
                <header class="mb-10">
                    <h2 class="text-3xl font-extrabold text-slate-800 tracking-tight">Daftar Pendaftar</h2>
                    <p class="text-slate-500 font-medium">Kelola persetujuan pendaftar magang baru.</p>
                </header>
                <div class="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
                    <table class="w-full text-left border-collapse">
                        <thead class="bg-slate-50 text-slate-400 text-[10px] uppercase font-bold tracking-widest">
                            <tr>
                                <th class="p-5">Informasi Peserta</th>
                                <th class="p-5">Status</th>
                                <th class="p-5 text-center">Aksi</th>
                            </tr>
                        </thead>
                        <tbody id="pesertaTableBody" class="divide-y divide-slate-100">
                            <tr><td colspan="3" class="p-10 text-center text-slate-400 italic">Memuat data...</td></tr>
                        </tbody>
                    </table>
                </div>
            </main>
        </div>`,

    'form': `
        <div class="min-h-screen bg-slate-50 py-12 px-4">
            <div class="max-w-xl mx-auto">
                <button onclick="navigate('dashboard')" class="group flex items-center gap-2 text-indigo-600 mb-6 font-bold hover:gap-3 transition-all">
                    <span>←</span> Kembali ke Dashboard
                </button>
                <div class="bg-white p-10 rounded-[2.5rem] shadow-xl shadow-slate-200">
                    <h2 class="text-3xl font-black text-slate-800 mb-2">Pendaftaran Baru</h2>
                    <p class="text-slate-400 mb-8 font-medium text-sm">Silakan isi data diri lengkap untuk antrean magang.</p>
                    <form id="formDaftar" class="space-y-5">
                        <div class="space-y-1">
                            <label class="text-[10px] font-black uppercase text-slate-400 ml-2">Data Personal</label>
                            <input type="text" name="nama" placeholder="Nama Lengkap" class="w-full p-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 transition-all outline-none" required>
                        </div>
                        <div class="space-y-1">
                            <label class="text-[10px] font-black uppercase text-slate-400 ml-2">Dokumen (PDF)</label>
                            <input type="file" name="berkas" class="w-full p-4 bg-slate-50 border-none rounded-2xl file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-indigo-600 file:text-white" required>
                        </div>
                        <button type="submit" class="w-full bg-indigo-600 text-white py-5 rounded-2xl font-black shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all">
                            Kirim Pendaftaran
                        </button>
                    </form>
                </div>
            </div>
        </div>`
};

// Fungsi Navigasi Utama
window.navigate = (page) => {
    // Memberikan efek fade out singkat (opsional)
    app.style.opacity = '0';
    
    setTimeout(() => {
        app.innerHTML = routes[page] || '<div class="h-screen flex items-center justify-center font-bold">404 - Page Not Found</div>';
        app.style.opacity = '1';
        
        // Inisialisasi JS masing-masing halaman
        if (page === 'dashboard') initDashboard();
        if (page === 'peserta') initPeserta();
        if (page === 'form') initForm();

        // Scroll ke atas setiap pindah halaman
        window.scrollTo(0, 0);
    }, 150);
};

// CSS Transisi Sederhana
app.style.transition = 'opacity 0.2s ease-in-out';

// Mulai dari halaman Login
navigate('login');