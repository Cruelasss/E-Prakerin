const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const app = express();

// --- MIDDLEWARE ---
app.use(cors());
app.use(express.json());
// Membuat folder 'uploads' bisa diakses publik via URL
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// --- DATABASE CONNECTION ---
const db = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'db_magang_tekkomdik',
    waitForConnections: true,
    connectionLimit: 10
});

// --- FILE UPLOAD SETTING (MULTER) ---
if (!fs.existsSync('./uploads')) {
    fs.mkdirSync('./uploads');
}

const storage = multer.diskStorage({
    destination: './uploads/',
    filename: (req, file, cb) => {
        // Nama file: timestamp-namaasli.ext
        cb(null, Date.now() + '-' + file.originalname.replace(/\s/g, '_'));
    }
});

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 } // Batas 5MB
});

// --- ROUTES ---

// 1. TEST KONEKSI
app.get('/', (req, res) => {
    res.json({ message: "API Smart Magang Balai Tekkomdik Ready!" });
});

// 2. PENDAFTARAN PESERTA (USER)
app.post('/api/daftar', upload.single('berkas'), async (req, res) => {
    try {
        const { nama, email, whatsapp, instansi, jurusan, tglMulai, tglSelesai } = req.body;
        const berkas_url = req.file ? req.file.filename : null;

        const sql = `INSERT INTO peserta (nama, email, whatsapp, instansi, jurusan, tgl_mulai, tgl_selesai, berkas_url) 
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
        
        const [result] = await db.execute(sql, [nama, email, whatsapp, instansi, jurusan, tglMulai, tglSelesai, berkas_url]);

        res.status(201).json({ 
            success: true, 
            message: "Pendaftaran berhasil disimpan!",
            id: result.insertId 
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// 3. AMBIL SEMUA PESERTA (ADMIN)
app.get('/api/admin/peserta', async (req, res) => {
    try {
        const [rows] = await db.execute('SELECT * FROM peserta ORDER BY created_at DESC');
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 4. ONE-CLICK APPROVAL (ADMIN)
app.patch('/api/admin/approve/:id', async (req, res) => {
    const { id } = req.params;
    const { admin_nama } = req.body;

    try {
        // Update status peserta
        await db.execute('UPDATE peserta SET status = "AKTIF" WHERE id = ?', [id]);

        // Catat ke Audit Log
        await db.execute(
            'INSERT INTO audit_log (peserta_id, aksi, keterangan) VALUES (?, ?, ?)',
            [id, 'APPROVE', `Disetujui oleh ${admin_nama || 'Admin'}`]
        );

        res.json({ success: true, message: "Peserta disetujui!" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 5. PENOLAKAN PESERTA (ADMIN)
app.patch('/api/admin/reject/:id', async (req, res) => {
    const { id } = req.params;
    const { alasan, admin_nama } = req.body;

    try {
        await db.execute('UPDATE peserta SET status = "TOLAK" WHERE id = ?', [id]);
        
        await db.execute(
            'INSERT INTO audit_log (peserta_id, aksi, keterangan) VALUES (?, ?, ?)',
            [id, 'REJECT', `Ditolak oleh ${admin_nama || 'Admin'}. Alasan: ${alasan}`]
        );

        res.json({ success: true, message: "Peserta ditolak." });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 6. STATISTIK DASHBOARD (ADMIN)
app.get('/api/admin/stats', async (req, res) => {
    try {
        const [total] = await db.execute('SELECT COUNT(*) as jml FROM peserta');
        const [pending] = await db.execute('SELECT COUNT(*) as jml FROM peserta WHERE status = "PENDING"');
        const [aktif] = await db.execute('SELECT COUNT(*) as jml FROM peserta WHERE status = "AKTIF"');
        
        const [logs] = await db.execute(`
            SELECT audit_log.*, peserta.nama 
            FROM audit_log 
            JOIN peserta ON audit_log.peserta_id = peserta.id 
            ORDER BY waktu DESC LIMIT 10
        `);

        res.json({
            summary: { 
                total: total[0].jml, 
                pending: pending[0].jml, 
                aktif: aktif[0].jml 
            },
            recentLogs: logs
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// --- START SERVER ---
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`
    🚀 Server Jalan!
    📡 URL: http://localhost:${PORT}
    📁 Folder Upload: ${path.join(__dirname, 'uploads')}
    `);
});