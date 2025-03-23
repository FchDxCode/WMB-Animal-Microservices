// loginController.js
// src/controllers/loginController.js

import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { User } from '../models/userModels.js';

const JWT_SECRET = process.env.JWT_SECRET || 'ytta'; 

/**
 * LOGIN
 * - Validasi email & password
 * - Cek user terverifikasi OTP
 * - Generate JWT
 * - Simpan JWT ke kolom remember_token
 */
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. Validasi input
    if (!email || !password) {
      return res
        .status(400)
        .json({ success: false, message: 'Email dan password harus diisi.' });
    }

    // 2. Cari user by email
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res
        .status(401)
        .json({ success: false, message: 'Email atau password salah.' });
    }

    // 3. Cek password (bcrypt compare)
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res
        .status(401)
        .json({ success: false, message: 'Email atau password salah.' });
    }

    // 4. Cek apakah user sudah verifikasi OTP
    // Verifikasi OTP ditandai dengan otp_code null dan email_verified_at tidak null
    if (user.otp_code !== null || user.email_verified_at === null) {
      return res
        .status(403)
        .json({ 
          success: false, 
          message: 'Akun belum terverifikasi. Silakan verifikasi kode OTP terlebih dahulu.',
          needOtpVerification: true,
          userId: user.id
        });
    }

    // 5. Generate JWT (payload minimal: userId)
    const tokenPayload = {
      userId: user.id,
      email: user.email,
    };
    // Expired misal 1 hari, sesuaikan
    const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '1d' });

    // 6. Simpan token ke kolom remember_token dan update last_login
    user.remember_token = token;
    user.last_login = new Date();
    await user.save();

    // 7. Return token ke client
    return res.status(200).json({
      success: true,
      message: 'Login berhasil.',
      token,
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    console.error('Error (login):', error);
    return res
      .status(500)
      .json({ success: false, message: 'Terjadi kesalahan pada server.' });
  }
};

/**
 * VERIFY OTP
 * - Menerima kode OTP dari user
 * - Memverifikasi kode OTP dan waktunya masih valid
 */
export const verifyOtp = async (req, res) => {
  try {
    const { userId, otpCode } = req.body;

    // 1. Validasi input
    if (!userId || !otpCode) {
      return res
        .status(400)
        .json({ success: false, message: 'User ID dan kode OTP harus diisi.' });
    }

    // 2. Cari user berdasarkan ID
    const user = await User.findByPk(userId);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: 'User tidak ditemukan.' });
    }

    // 3. Cek apakah OTP masih valid
    if (!user.otp_code || !user.otp_expires_at) {
      return res
        .status(400)
        .json({ success: false, message: 'Kode OTP tidak tersedia. Silakan meminta kode OTP baru.' });
    }

    // 4. Cek apakah OTP sudah kadaluarsa
    const now = new Date();
    if (now > new Date(user.otp_expires_at)) {
      return res
        .status(400)
        .json({ success: false, message: 'Kode OTP sudah kadaluarsa. Silakan meminta kode OTP baru.' });
    }

    // 5. Cek apakah OTP benar
    if (user.otp_code !== otpCode) {
      return res
        .status(400)
        .json({ success: false, message: 'Kode OTP tidak valid.' });
    }

    // 6. Update user sebagai terverifikasi
    user.otp_code = null;
    user.otp_expires_at = null;
    user.email_verified_at = new Date();
    await user.save();

    // 7. Return sukses
    return res.status(200).json({
      success: true,
      message: 'Verifikasi OTP berhasil. Silakan login kembali.',
    });
  } catch (error) {
    console.error('Error (verifyOtp):', error);
    return res
      .status(500)
      .json({ success: false, message: 'Terjadi kesalahan pada server.' });
  }
};

/**
 * RESEND OTP
 * - Menerima user ID
 * - Generate OTP baru dan update waktu kadaluarsa
 */
export const resendOtp = async (req, res) => {
  try {
    const { userId } = req.body;

    // 1. Validasi input
    if (!userId) {
      return res
        .status(400)
        .json({ success: false, message: 'User ID harus diisi.' });
    }

    // 2. Cari user berdasarkan ID
    const user = await User.findByPk(userId);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: 'User tidak ditemukan.' });
    }

    // 3. Generate OTP baru (6 digit)
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    
    // 4. Set waktu kadaluarsa OTP (15 menit dari sekarang)
    const otpExpiresAt = new Date();
    otpExpiresAt.setMinutes(otpExpiresAt.getMinutes() + 15);

    // 5. Update user dengan OTP baru
    user.otp_code = otpCode;
    user.otp_expires_at = otpExpiresAt;
    await user.save();

    // 6. Di sini Anda bisa menambahkan kode untuk mengirim OTP via email atau SMS
    // sendOtpToUser(user.email, otpCode);

    // 7. Return sukses
    return res.status(200).json({
      success: true,
      message: 'Kode OTP baru telah dikirim. Silakan cek email atau SMS Anda.',
      // Dalam lingkungan pengembangan, kirim OTP dalam response
      otpCode: process.env.NODE_ENV === 'development' ? otpCode : undefined,
    });
  } catch (error) {
    console.error('Error (resendOtp):', error);
    return res
      .status(500)
      .json({ success: false, message: 'Terjadi kesalahan pada server.' });
  }
};

/**
 * LOGOUT
 * - Menerima token user
 * - Menghapus / menonaktifkan token di DB
 */
export const logout = async (req, res) => {
  try {
    // Ambil token dari header atau body
    // Misalnya kita ambil dari header "Authorization: Bearer <token>"
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ')
      ? authHeader.slice(7)
      : null;

    if (!token) {
      return res
        .status(400)
        .json({ success: false, message: 'Token tidak ditemukan.' });
    }

    // Verifikasi token untuk dapat userId
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      return res
        .status(401)
        .json({ success: false, message: 'Token tidak valid.' });
    }

    // Cari user di DB dan hapus token (set remember_token = null)
    const user = await User.findByPk(decoded.userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User tidak ditemukan.' });
    }

    // Pastikan token yang di DB sama dengan token yang dipakai
    // (Jika tidak sama, berarti user sudah logout / token beda)
    if (user.remember_token !== token) {
      return res
        .status(401)
        .json({ success: false, message: 'Token tidak valid atau sudah logout.' });
    }

    user.remember_token = null;
    await user.save();

    return res.status(200).json({ success: true, message: 'Logout berhasil.' });
  } catch (error) {
    console.error('Error (logout):', error);
    return res
      .status(500)
      .json({ success: false, message: 'Terjadi kesalahan pada server.' });
  }
};