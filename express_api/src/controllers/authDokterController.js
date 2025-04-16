// controllers/auth/authDokterController.js
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { Dokter } from '../models/dokterModels.js';

const JWT_SECRET = process.env.JWT_SECRET || 'yoursecretkey';
const TOKEN_EXPIRES_IN = '24h';

/**
 * Login dokter
 * @param {object} req - Request Express
 * @param {object} res - Response Express
 */
export const loginDokter = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validasi input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email dan password harus diisi',
      });
    }

    // Cari dokter berdasarkan email
    const dokter = await Dokter.findOne({ 
      where: { email },
      include: [
        {
          association: 'gambar_dokter',
          attributes: ['gambar'],
          limit: 1
        }
      ]
    });

    if (!dokter) {
      return res.status(401).json({
        success: false,
        message: 'Email atau password salah',
      });
    }

    // Verifikasi password
    const isPasswordValid = await bcrypt.compare(password, dokter.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Email atau password salah',
      });
    }

    // Generate JWT
    const token = jwt.sign(
      { 
        userId: dokter.id, 
        role: 'dokter'
      },
      JWT_SECRET,
      { expiresIn: TOKEN_EXPIRES_IN }
    );

    // Update remember_token di dokter (jika perlu)
    await dokter.update({
      remember_token: token,
      last_login: new Date()
    });

    const dokterData = {
      id: dokter.id,
      nama: dokter.nama,
      email: dokter.email,
      universitas: dokter.universitas,
      klinik_id: dokter.klinik_id,
      profile_image: dokter.gambar_dokter && dokter.gambar_dokter.length > 0 ? 
        dokter.gambar_dokter[0].gambar : null
    };

    return res.status(200).json({
      success: true,
      message: 'Login berhasil',
      data: {
        token,
        dokter: dokterData
      },
    });
  } catch (error) {
    console.error('Error in loginDokter:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat login',
      error: error.message,
    });
  }
};

/**
 * Logout dokter
 * @param {object} req - Request Express
 * @param {object} res - Response Express
 */
export const logoutDokter = async (req, res) => {
  try {
    const { dokterId } = req.dokter;

    // Hapus remember_token
    await Dokter.update(
      { remember_token: null },
      { where: { id: dokterId } }
    );

    return res.status(200).json({
      success: true,
      message: 'Logout berhasil',
    });
  } catch (error) {
    console.error('Error in logoutDokter:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat logout',
      error: error.message,
    });
  }
};

/**
 * Mengambil profil dokter
 * @param {object} req - Request Express
 * @param {object} res - Response Express
 */
export const getProfile = async (req, res) => {
  try {
    const { id } = req.dokter;

    // Ambil data dokter
    const dokter = await Dokter.findByPk(id, {
      include: [
        {
          association: 'gambar_dokter',
          attributes: ['gambar'],
        }
      ],
      attributes: { exclude: ['password', 'remember_token'] },
    });

    if (!dokter) {
      return res.status(404).json({
        success: false,
        message: 'Dokter tidak ditemukan',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Profil dokter berhasil diambil',
      data: dokter,
    });
  } catch (error) {
    console.error('Error in getProfile:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat mengambil profil',
      error: error.message,
    });
  }
};

// Register dokter (untuk admin)
export const registerDokter = async (req, res) => {
  try {
    const { 
      nama, email, password, universitas, klinik_id
    } = req.body;

    // Validasi input
    if (!nama || !email || !password || !universitas || !klinik_id) {
      return res.status(400).json({
        success: false,
        message: 'Semua field harus diisi',
      });
    }

    // Cek apakah email sudah terdaftar
    const existingDokter = await Dokter.findOne({ where: { email } });
    if (existingDokter) {
      return res.status(400).json({
        success: false,
        message: 'Email sudah terdaftar',
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Buat dokter baru
    const newDokter = await Dokter.create({
      nama,
      email,
      password: hashedPassword,
      universitas,
      klinik_id,
      role_id: 4, // Role dokter
    });

    return res.status(201).json({
      success: true,
      message: 'Dokter berhasil didaftarkan',
      data: {
        id: newDokter.id,
        nama: newDokter.nama,
        email: newDokter.email,
        universitas: newDokter.universitas,
        klinik_id: newDokter.klinik_id,
      },
    });
  } catch (error) {
    console.error('Error in registerDokter:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat mendaftarkan dokter',
      error: error.message,
    });
  }
};