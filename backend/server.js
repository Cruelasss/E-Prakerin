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

// --- FILE UPLOAD SETTING ---
if (!fs.existsSync('./uploads')) fs.mkdirSync('./uploads');
const storage = multer.diskStorage({
    destination: './uploads/',
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname.replace(/\s/g, '_'));
    }
});
const upload = multer({ storage: storage, limits: { fileSize: 5 * 1024 * 1024 } });

// --- SMART ROUTES ---

// 1. PENDAFTARAN (Public Role)
app.post('/api/daftar', upload.single('berkas'), async (req, res) => {
    try {
        const { nama, email, whatsapp, instansi, jurusan, tglMulai, tglSelesai } = req.body;
        const berkas_url = req.file ? req.file.filename : null;

        const sql = `INSERT INTO peserta (nama, email, whatsapp, instansi, jurusan, tgl_mulai, tgl_selesai, berkas_url) 
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
        
        const [result] = await db.execute(sql, [nama, email, whatsapp, instansi, jurusan, tglMulai, tglSelesai, berkas_url]);
        res.status(201).json({ success: true, message: "Pendaftaran masuk ke antrean!", id: result.insertId });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// 2. THE "SINGLE-CLICK" APPROVAL ENGINE (Admin Role)
app.patch('/api/admin/approve/:id', async (req, res) => {
    const { id } = req.params;
    const { admin_nama } = req.body;
    const connection = await db.getConnection(); // Ambil koneksi manual untuk Transaksi

    try {
        await connection.beginTransaction(); // MULAI TRANSAKSI CERDAS

        // A. Update Status Peserta
        await connection.execute('UPDATE peserta SET status = "AKTIF" WHERE id = ?', [id]);

        // B. Get Peserta Info untuk Akun
        const [peserta] = await connection.execute('SELECT nama, email FROM peserta WHERE id = ?', [id]);
        const p = peserta[0];

        // C. MENTOR ASSIGNMENT (Cari pembimbing dengan beban kerja tersedikit)
        const [mentors] = await connection.execute('SELECT id FROM pembimbing ORDER BY beban_kerja ASC LIMIT 1');
        let mentorId = mentors.length > 0 ? mentors[0].id : null;

        if (mentorId) {
            await connection.execute('UPDATE peserta SET pembimbing_id = ? WHERE id = ?', [mentorId, id]);
            await connection.execute('UPDATE pembimbing SET beban_kerja = beban_kerja + 1 WHERE id = ?', [mentorId]);
        }

        // D. ACCOUNT CREATION (Password default: Magang + 4 angka acak)
        const rawPassword = 'Magang' + Math.floor(1000 + Math.random() * 9000);
        await connection.execute(
            'INSERT INTO users (peserta_id, email, password, role) VALUES (?, ?, ?, "PESERTA")',
            [id, p.email, rawPassword]
        );

        // E. AUDIT LOGGING
        await connection.execute(
            'INSERT INTO audit_log (peserta_id, aksi, keterangan) VALUES (?, ?, ?)',
            [id, 'APPROVE_FULL', `Disetujui: ${admin_nama}. Akun: ${p.email} | Pass: ${rawPassword}`]
        );

        await connection.commit(); // SIMPAN SEMUA PERUBAHAN
        res.json({ success: true, message: "Engine Berhasil: Status Aktif, Akun Dibuat, Mentor Ditugaskan!", credentials: { email: p.email, password: rawPassword } });

    } catch (error) {
        await connection.rollback(); // BATALKAN JIKA ADA ERROR
        res.status(500).json({ success: false, error: error.message });
    } finally {
        connection.release();
    }
});

// 3. EXECUTIVE ANALYTICS DASHBOARD (The "Wow" Factor)
app.get('/api/admin/analytics', async (req, res) => {
    try {
        // Data Heatmap Jurusan (Pie Chart)
        const [jurusan] = await db.execute('SELECT jurusan, COUNT(*) as jumlah FROM peserta GROUP BY jurusan');
        
        // Data Trend Pendaftar (Data 2024 vs 2025/2026)
        const [trend] = await db.execute(`
            SELECT MONTHNAME(created_at) as bulan, COUNT(*) as jumlah 
            FROM peserta 
            WHERE YEAR(created_at) = YEAR(CURDATE())
            GROUP BY MONTH(created_at)
        `);

        // Sisa Kuota Per Divisi
        const [kuota] = await db.execute('SELECT divisi, (max_kuota - beban_kerja) as sisa FROM pembimbing');

        res.json({ jurusan, trend, kuota });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 4. STATISTIK RINGKASAN
app.get('/api/admin/stats', async (req, res) => {
    try {
        const [[total]] = await db.execute('SELECT COUNT(*) as jml FROM peserta');
        const [[pending]] = await db.execute('SELECT COUNT(*) as jml FROM peserta WHERE status = "PENDING"');
        const [[aktif]] = await db.execute('SELECT COUNT(*) as jml FROM peserta WHERE status = "AKTIF"');
        const [logs] = await db.execute(`
            SELECT audit_log.*, peserta.nama FROM audit_log 
            JOIN peserta ON audit_log.peserta_id = peserta.id 
            ORDER BY waktu DESC LIMIT 5
        `);
        res.json({ summary: { total: total.jml, pending: pending.jml, aktif: aktif.jml }, recentLogs: logs });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// --- START SERVER ---
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Smart Engine Ready on Port ${PORT}`));