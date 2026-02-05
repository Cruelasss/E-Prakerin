const API_URL = '/api/admin';

export async function initPeserta() {
    try {
        const res = await fetch(`${API_URL}/stats`);
        const data = await res.json();
        // Logika render tabel kamu pindahkan ke sini
        renderTable(data.recentLogs); // Contoh menggunakan logs sementara
    } catch (err) {
        console.error("Gagal memuat peserta:", err);
    }
}

function renderTable(peserta) {
    const tableBody = document.getElementById('pesertaTableBody');
    if (!tableBody) return;
    tableBody.innerHTML = peserta.map(p => `
        <tr class="border-b">
            <td class="p-4">${p.nama}</td>
            <td class="p-4">${p.aksi}</td>
            <td class="p-4 text-center">
                <button onclick="alert('Detail ID: ${p.peserta_id}')" class="text-indigo-600 font-bold">Detail</button>
            </td>
        </tr>
    `).join('');
}