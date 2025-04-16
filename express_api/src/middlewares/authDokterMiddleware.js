// src/middlewares/authDokterMiddleware.js
import jwt from 'jsonwebtoken';
import { Dokter } from '../models/dokterModels.js';

const JWT_SECRET = process.env.JWT_SECRET || 'yoursecretkey';

export const authDokterMiddleware = async (req, res, next) => {
  try {
    // Ambil token dari header Authorization (format: "Bearer <token>")
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Authorization header missing or invalid.',
      });
    }

    const token = authHeader.split(' ')[1];

    // Verifikasi token
    const decoded = jwt.verify(token, JWT_SECRET);

    // Pastikan role adalah dokter
    if (decoded.role !== 'dokter') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only doctors can access this endpoint.',
      });
    }

    // Cari dokter berdasarkan ID dari token
    const dokter = await Dokter.findByPk(decoded.userId);
    if (!dokter) {
      return res.status(404).json({
        success: false,
        message: 'Dokter not found.',
      });
    }

    // Pastikan token yang tersimpan di DB (misalnya di field remember_token)
    // sama dengan token yang digunakan. Ini opsional, sesuai logika aplikasi.
    if (dokter.remember_token !== token) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token or doctor already logged out.',
      });
    }

    // Simpan data dokter ke req untuk digunakan di endpoint selanjutnya
    req.dokter = {
      id: dokter.id,
      nama: dokter.nama,
      email: dokter.email,
      klinik_id: dokter.klinik_id,
      role: 'dokter'
    };
    
    next();
  } catch (error) {
    console.error('Error in authDokterMiddleware:', error);
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token.',
    });
  }
};