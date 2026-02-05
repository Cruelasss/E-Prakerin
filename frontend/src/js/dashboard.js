const API_URL = '/api/admin'; 

// Tambahkan keyword 'export' di depan fungsi
export async function initDashboard() {
    try {
        const resStats = await fetch(`${API_URL}/stats`);
        const s = await resStats.json();
        
        // Pastikan ID ini ada di template dashboard yang kamu buat di main.js
        document.getElementById('statTotal').innerText = s.summary.total;
        document.getElementById('statAktif').innerText = s.summary.aktif;
        document.getElementById('statPending').innerText = s.summary.pending;
        document.getElementById('statAlumni').innerText = s.summary.total - (s.summary.aktif + s.summary.pending);

        const resAnlytic = await fetch(`${API_URL}/analytics`);
        const data = await resAnlytic.json();

        new Chart(document.getElementById('jurusanChart'), {
            type: 'doughnut',
            data: {
                labels: data.jurusan.map(x => x.jurusan),
                datasets: [{ 
                    data: data.jurusan.map(x => x.jumlah),
                    backgroundColor: ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#a855f7'] 
                }]
            }
        });

        new Chart(document.getElementById('trendChart'), {
            type: 'line',
            data: {
                labels: data.trend.map(x => x.bulan),
                datasets: [{
                    label: 'Pendaftar',
                    data: data.trend.map(x => x.jumlah),
                    borderColor: '#6366f1',
                    fill: true,
                    backgroundColor: 'rgba(99, 102, 241, 0.1)',
                    tension: 0.4
                }]
            }
        });
    } catch (err) {
        console.error("Dashboard Load Error:", err);
    }
}
// HAPUS: document.addEventListener('DOMContentLoaded', initDashboard);