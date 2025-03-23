// src/controllers/registerController.js

import bcrypt from 'bcrypt';
import { randomInt } from 'crypto';
import { User } from '../models/userModels.js';
import { sendOtpEmail } from '../utils/emailUtils.js';

const OTP_EXPIRATION_MS = 10 * 60 * 1000; // 10 menit
const saltRounds = 10;

export const register = async (req, res) => {
  try {
    const { name, email, password, confirm_password } = req.body;

    // 1. Validasi input
    if (!name || !email || !password || !confirm_password) {
      return res.status(400).json({ success: false, message: 'Semua field harus diisi.' });
    }
    if (password !== confirm_password) {
      return res.status(400).json({ success: false, message: 'Password dan konfirmasi tidak cocok.' });
    }

    // 2. Cek apakah email sudah terdaftar
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email sudah terdaftar.' });
    }

    // 3. Hash password
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // 4. Generate OTP 6 digit
    const otp = ('000000' + randomInt(0, 999999)).slice(-6);
    const otpExpires = new Date(Date.now() + OTP_EXPIRATION_MS);

    // 5. Simpan user ke DB (status belum terverifikasi)
    const newUser = await User.create({
      name,
      email,
      password: hashedPassword,
      otp_code: otp,
      otp_expires_at: otpExpires,
      email_verified_at: null,
    });

    // 6. Buat record di tabel GambarUser dengan nilai awal null untuk field gambar
    await GambarUser.create({
      users_id: newUser.id,
      gambar: null,
    });

    // 7. Kirim OTP via email
    const emailResult = await sendOtpEmail(email, name, otp);
    if (!emailResult.success) {
      // Jika gagal mengirim email, hapus user (dan secara otomatis record gambar jika relasi di-set cascade)
      await newUser.destroy();
      return res.status(500).json({
        success: false,
        message: 'Gagal mengirim email OTP. Silakan coba lagi.',
      });
    }

    // 8. Jadwalkan penghapusan user yang tidak terverifikasi setelah 10 menit
    setTimeout(async () => {
      try {
        const user = await User.findByPk(newUser.id);
        if (user && !user.email_verified_at) {
          // Hapus user karena belum diverifikasi
          await user.destroy();
          console.log(`User dengan id ${newUser.id} dihapus karena tidak melakukan verifikasi OTP.`);
        }
      } catch (err) {
        console.error('Error saat menghapus user tidak terverifikasi:', err);
      }
    }, OTP_EXPIRATION_MS);

    // 9. Response
    return res.status(201).json({
      success: true,
      message: 'Registrasi berhasil. Cek email untuk verifikasi OTP.',
      data: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
      },
    });
  } catch (error) {
    console.error('Error (register):', error);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server.' });
  }
};

// (B) VERIFY OTP
export const verifyOtp = async (req, res) => {
  try {
    const { email, otp_code } = req.body;

    // 1. Validasi
    if (!email || !otp_code) {
      return res.status(400).json({
        success: false,
        message: 'Email dan OTP harus diisi.',
      });
    }

    // 2. Cari user berdasarkan email
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User tidak ditemukan.' });
    }

    // 3. Cek apakah sudah diverifikasi
    if (user.email_verified_at) {
      return res
        .status(400)
        .json({ success: false, message: 'Akun sudah diverifikasi.' });
    }

    // 4. Cek OTP
    if (user.otp_code !== otp_code) {
      return res.status(400).json({ success: false, message: 'OTP salah.' });
    }

    // 5. Cek kadaluarsa
    const now = new Date();
    if (now > user.otp_expires_at) {
      return res.status(400).json({ success: false, message: 'OTP kadaluarsa.' });
    }

    // 6. Update user => verified
    user.email_verified_at = now;
    user.otp_code = null;
    user.otp_expires_at = null;
    await user.save();

    return res
      .status(200)
      .json({ success: true, message: 'Verifikasi berhasil. Silakan login.' });
  } catch (error) {
    console.error('Error (verifyOtp):', error);
    return res
      .status(500)
      .json({ success: false, message: 'Terjadi kesalahan pada server.' });
  }
};

// (C) RESEND OTP
export const resendOtp = async (req, res) => {
  try {
    const { email } = req.body;

    // 1. Validasi
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email harus diisi.',
      });
    }

    // 2. Cari user
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User tidak ditemukan.' });
    }

    // 3. Cek apakah user sudah diverifikasi
    if (user.email_verified_at) {
      return res
        .status(400)
        .json({ success: false, message: 'Akun sudah diverifikasi.' });
    }

    // 4. Generate OTP baru
    const otp = ('000000' + randomInt(0, 999999)).slice(-6);
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000);

    user.otp_code = otp;
    user.otp_expires_at = otpExpires;
    await user.save();

    // 5. Kirim OTP via email
    const emailResult = await sendOtpEmail(email, user.name, otp);
    if (!emailResult.success) {
      return res.status(500).json({
        success: false,
        message: 'Gagal mengirim email OTP. Silakan coba lagi.',
      });
    }

    return res
      .status(200)
      .json({ success: true, message: 'OTP baru telah dikirim ke email Anda.' });
  } catch (error) {
    console.error('Error (resendOtp):', error);
    return res
      .status(500)
      .json({ success: false, message: 'Terjadi kesalahan pada server.' });
  }
};

/**
 * (D) FORGOT PASSWORD
 * Mengirimkan OTP untuk reset password ke email user.
 */
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    // 1. Validasi input
    if (!email) {
      return res
        .status(400)
        .json({ success: false, message: 'Email harus diisi.' });
    }

    // 2. Cari user
    const user = await User.findOne({ where: { email } });
    if (!user) {
      // Opsional: Anda bisa return 200 agar tidak "bocorkan" keberadaan user
      return res
        .status(404)
        .json({ success: false, message: 'User tidak ditemukan.' });
    }

    // 3. Generate OTP baru
    const otp = ('000000' + randomInt(0, 999999)).slice(-6);
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // kadaluarsa 10 menit

    // 4. Update user di DB
    user.otp_code = otp;
    user.otp_expires_at = otpExpires;
    await user.save();

    // 5. Kirim email berisi OTP
    const emailResult = await sendOtpEmail(user.email, user.name, otp);
    if (!emailResult.success) {
      return res
        .status(500)
        .json({ success: false, message: 'Gagal mengirim email OTP.' });
    }

    return res.status(200).json({
      success: true,
      message: 'OTP untuk reset password telah dikirim ke email.',
    });
  } catch (error) {
    console.error('Error (forgotPassword):', error);
    return res
      .status(500)
      .json({ success: false, message: 'Terjadi kesalahan pada server.' });
  }
};

/**
 * (E) VERIFY OTP FORGOT PASSWORD
 * Memverifikasi OTP reset password, lalu mengganti password user.
 */
export const verifyOtpForgotPassword = async (req, res) => {
  try {
    const { email, otp_code, new_password, confirm_password } = req.body;

    // 1. Validasi input
    if (!email || !otp_code || !new_password || !confirm_password) {
      return res.status(400).json({
        success: false,
        message: 'Email, OTP, dan password baru harus diisi.',
      });
    }
    if (new_password !== confirm_password) {
      return res.status(400).json({
        success: false,
        message: 'New password dan confirm password tidak cocok.',
      });
    }

    // 2. Cari user
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: 'User tidak ditemukan.' });
    }

    // 3. Cek OTP
    if (user.otp_code !== otp_code) {
      return res.status(400).json({ success: false, message: 'OTP salah.' });
    }

    // 4. Cek kadaluarsa
    const now = new Date();
    if (now > user.otp_expires_at) {
      return res.status(400).json({ success: false, message: 'OTP kadaluarsa.' });
    }

    // 5. Hash password baru
    const saltRounds = 10;
    const hashedNewPassword = await bcrypt.hash(new_password, saltRounds);

    // 6. Update user => set password baru & reset OTP
    user.password = hashedNewPassword;
    user.otp_code = null;
    user.otp_expires_at = null;
    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Password berhasil direset. Silakan login dengan password baru.',
    });
  } catch (error) {
    console.error('Error (verifyOtpForgotPassword):', error);
    return res
      .status(500)
      .json({ success: false, message: 'Terjadi kesalahan pada server.' });
  }
};