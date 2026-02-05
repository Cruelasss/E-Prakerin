const db = require('../config/db');

// PROSES SUBMIT PENDAFTARAN
exports.submitPendaftaran = async (req, res) => {
    try {
        const { nama, email, whatsapp, instansi, jurusan, tglMulai, tglSelesai } = req.body;
        
        // Mengambil nama file yang sudah diproses oleh Multer di Routes
        const berkas_url = req.file ? req.file.filename : null;

        // Validasi sederhana: Pastikan file ada
        if (!berkas_url) {
            return res.status(400).json({ 
                success: false, 
                message: "Berkas pendaftaran (PDF) wajib diunggah." 
            });
        }

        const sql = `INSERT INTO peserta (nama, email, whatsapp, instansi, jurusan, tgl_mulai, tgl_selesai, berkas_url) 
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
        
        const [result] = await db.execute(sql, [
            nama, 
            email, 
            whatsapp, 
            instansi, 
            jurusan, 
            tglMulai, 
            tglSelesai, 
            berkas_url
        ]);

        res.status(201).json({ 
            success: true, 
            message: "Pendaftaran berhasil! Data Anda sedang dalam antrean validasi.", 
            id: result.insertId 
        });

    } catch (error) {
        console.error("Error Pendaftaran:", error);
        
        // Handle error jika email duplikat
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ 
                success: false, 
                message: "Email ini sudah terdaftar dalam sistem." 
            });
        }

        res.status(500).json({ 
            success: false, 
            error: "Gagal memproses pendaftaran: " + error.message 
        });
    }
};