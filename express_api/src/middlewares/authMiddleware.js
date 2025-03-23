// src/middlewares/authMiddleware.js
import jwt from 'jsonwebtoken';
import { User } from '../models/userModels.js';

const JWT_SECRET = process.env.JWT_SECRET || 'yoursecretkey';

export const authMiddleware = async (req, res, next) => {
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

    // Cari user berdasarkan ID dari token
    const user = await User.findByPk(decoded.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }

    // Pastikan token yang tersimpan di DB (misalnya di field remember_token)
    // sama dengan token yang digunakan. Ini opsional, sesuai logika aplikasi.
    if (user.remember_token !== token) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token or user already logged out.',
      });
    }

    // Simpan data user ke req untuk digunakan di endpoint selanjutnya
    req.user = user;
    next();
  } catch (error) {
    console.error('Error in authMiddleware:', error);
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token.',
    });
  }
};
