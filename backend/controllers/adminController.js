const db = require('../config/db');

// 1. MENGAMBIL SEMUA DATA PESERTA
exports.getAllPeserta = async (req, res) => {
    try {
        const [rows] = await db.execute('SELECT * FROM peserta ORDER BY created_at DESC');
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// 2. THE "SINGLE-CLICK" APPROVAL ENGINE
exports.singleClickApproval = async (req, res) => {
    const { id } = req.params;
    const { admin_nama } = req.body;
    
    const connection = await db.getConnection(); 

    try {
        await connection.beginTransaction(); 

        // A. Update Status Peserta
        await connection.execute('UPDATE peserta SET status = "AKTIF" WHERE id = ?', [id]);

        // B. Get Peserta Info
        const [peserta] = await connection.execute('SELECT nama, email FROM peserta WHERE id = ?', [id]);
        if (peserta.length === 0) throw new Error("Peserta tidak ditemukan");
        const p = peserta[0];

        // C. MENTOR ASSIGNMENT (Auto-assign ke pembimbing yang paling longgar)
        const [mentors] = await connection.execute('SELECT id FROM pembimbing ORDER BY beban_kerja ASC LIMIT 1');
        let mentorId = mentors.length > 0 ? mentors[0].id : null;

        if (mentorId) {
            await connection.execute('UPDATE peserta SET pembimbing_id = ? WHERE id = ?', [mentorId, id]);
            await connection.execute('UPDATE pembimbing SET beban_kerja = beban_kerja + 1 WHERE id = ?', [mentorId]);
        }

        // D. ACCOUNT CREATION (Password Random)
        const rawPassword = 'Magang' + Math.floor(1000 + Math.random() * 9000);
        await connection.execute(
            'INSERT INTO users (peserta_id, email, password, role) VALUES (?, ?, ?, "PESERTA")',
            [id, p.email, rawPassword]
        );

        // E. AUDIT LOGGING
        await connection.execute(
            'INSERT INTO audit_log (peserta_id, aksi, keterangan) VALUES (?, ?, ?)',
            [id, 'APPROVE_FULL', `Disetujui: ${admin_nama || 'Admin'}. Akun: ${p.email} | Pass: ${rawPassword}`]
        );

        await connection.commit(); 
        res.json({ 
            success: true, 
            message: "Engine Berhasil! Status Aktif, Akun Dibuat, Mentor Ditugaskan.", 
            credentials: { email: p.email, password: rawPassword } 
        });

    } catch (error) {
        await connection.rollback(); 
        res.status(500).json({ success: false, error: error.message });
    } finally {
        connection.release();
    }
};

// 3. EXECUTIVE ANALYTICS
exports.getAnalytics = async (req, res) => {
    try {
        const [jurusan] = await db.execute('SELECT jurusan, COUNT(*) as jumlah FROM peserta GROUP BY jurusan');
        const [trend] = await db.execute(`
            SELECT MONTHNAME(created_at) as bulan, COUNT(*) as jumlah 
            FROM peserta 
            WHERE YEAR(created_at) = YEAR(CURDATE())
            GROUP BY MONTH(created_at)
        `);
        const [kuota] = await db.execute('SELECT divisi, (max_kuota - beban_kerja) as sisa FROM pembimbing');

        res.json({ jurusan, trend, kuota });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// 4. STATISTIK RINGKASAN DASHBOARD
exports.getStats = async (req, res) => {
    try {
        const [[total]] = await db.execute('SELECT COUNT(*) as jml FROM peserta');
        const [[pending]] = await db.execute('SELECT COUNT(*) as jml FROM peserta WHERE status = "PENDING"');
        const [[aktif]] = await db.execute('SELECT COUNT(*) as jml FROM peserta WHERE status = "AKTIF"');
        
        const [logs] = await db.execute(`
            SELECT audit_log.*, peserta.nama FROM audit_log 
            JOIN peserta ON audit_log.peserta_id = peserta.id 
            ORDER BY waktu DESC LIMIT 5
        `);
        
        res.json({ 
            summary: { total: total.jml, pending: pending.jml, aktif: aktif.jml }, 
            recentLogs: logs 
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};