const xlsx = require('xlsx');
const db = require('./config/db');

// Fungsi konversi Tanggal Excel (45544) -> MySQL (YYYY-MM-DD)
function formatExcelDate(serial) {
    if (!serial) return null;
    if (typeof serial === 'string' && serial.includes('-')) return serial; // Jika sudah format YYYY-MM-DD
    if (isNaN(serial)) return null;
    
    const date = new Date(Math.round((serial - 25569) * 86400 * 1000));
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
}

async function importExcel() {
    try {
        console.log("🧹 Membersihkan tabel peserta...");
        await db.execute('DELETE FROM peserta');
        await db.execute('ALTER TABLE peserta AUTO_INCREMENT = 1');
        const workbook = xlsx.readFile('./data_prakerin.xlsx'); 
        const sheetName = workbook.SheetNames[0];
        const data = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

        console.log(`🚀 Memproses ${data.length} baris data...`);

        // Variabel penampung untuk menangani Merged Cells
        let lastSchool = "";
        let lastMajor = "";
        let sukses = 0;

        for (let row of data) {
            const namaSiswa = row['Nama Siswa/Mahasiswa'];

            if (namaSiswa) {
                // 1. Logika Forward Fill (Jika kosong, ambil dari baris atasnya)
                if (row['Nama Sekolah']) lastSchool = row['Nama Sekolah'];
                if (row['Jurusan']) lastMajor = row['Jurusan'];

                // 2. Logika Penentuan Status
                let dbStatus = 'PENDING'; 
                const excelStatus = (row['Keterangan'] || row['Status'] || '').toString().toLowerCase();

                if (excelStatus.includes('selesai')) {
                    dbStatus = 'ALUMNI';
                } else if (excelStatus.includes('pencabutan') || excelStatus.includes('dibatalkan')) {
                    dbStatus = 'TOLAK';
                } else if (excelStatus === '' || excelStatus.includes('magang')) {
                    dbStatus = 'AKTIF';
                }

                // 3. Konversi Tanggal (Fix Error 45544)
                const tglMulai = formatExcelDate(row['Mulai Magang']);
                const tglSelesai = formatExcelDate(row['Selesai Magang']);

                const sql = `INSERT INTO peserta (nama, email, whatsapp, instansi, jurusan, tgl_mulai, tgl_selesai, status) 
                             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;

                await db.execute(sql, [
                    namaSiswa,
                    null, // Email NULL (sesuai update SQL kita)
                    row['WhatsApp'] || '-',
                    lastSchool || 'Balai Tekkomdik',
                    lastMajor || '-',
                    tglMulai,
                    tglSelesai,
                    dbStatus
                ]);
                sukses++;
            }
        }

        console.log(`✅ JOS! ${sukses} data berhasil masuk dengan Sekolah & Jurusan yang akurat.`);
        process.exit();
    } catch (error) {
        console.error("❌ Gagal total:", error);
        process.exit(1);
    }
}

importExcel();