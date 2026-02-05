const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();
const { apiLogger } = require('./middleware/logger');

// IMPORT ROUTES
const adminRoutes = require('./routes/adminroutes');
const publicRoutes = require('./routes/publicroutes');

const app = express();

app.use(apiLogger);
// --- MIDDLEWARE ---
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// --- PENGGUNAAN ROUTES ---
// Semua API admin akan diawali dengan /api/admin
app.use('/api/admin', adminRoutes);

// Semua API publik (seperti pendaftaran) akan diawali dengan /api
app.use('/api', publicRoutes);

// --- START SERVER ---
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Smart Engine TEKKOMDIK Running on Port ${PORT}`);
});