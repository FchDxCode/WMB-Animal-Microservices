// src/controllers/userController.js
import bcrypt from 'bcrypt';
import { randomInt } from 'crypto';
import { User, GambarUser } from '../models/userModels.js';
import { sendOtpEmail } from '../utils/emailUtils.js';
import { uploadPaths, createImageUrl, uploadFolders } from '../utils/uploadUtils.js';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const BASE_STORAGE_PATH = process.env.STORAGE_PATH || 'public/storage';
const USER_IMAGES_FOLDER = 'profile-images'; 

const UPLOAD_DIR = uploadPaths.userImages;

if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const OTP_EXPIRATION_MS = 10 * 60 * 1000; // 10 menit

/**
 * Get profile user yang sedang login.
 */
export const getProfile = async (req, res) => {
  try {
    const user = req.user; // didapat dari authMiddleware
    // Ambil juga data profile image dari tabel GambarUser (jika ada)
    const userImage = await GambarUser.findOne({ where: { users_id: user.id } });
    return res.status(200).json({
      success: true,
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        email_verified_at: user.email_verified_at,
        profile_image: userImage ? createImageUrl(userImage.gambar, uploadFolders.userImages) : null,
      },
    });
  } catch (error) {
    console.error('Error getProfile:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada server.',
    });
  }
};

/**
 * Update profil user (name, email, password).
 * Jika email diubah, maka akan dikirimkan OTP baru ke email tersebut untuk verifikasi.
 * Hanya mengupdate record user yang sudah ada.
 */
export const updateProfile = async (req, res) => {
  try {
    const user = req.user; // didapat dari authMiddleware
    const { name, email, password } = req.body;

    let updateFields = {};
    let emailChanged = false;

    if (name) {
      updateFields.name = name;
    }

    // Jika email diberikan dan berbeda, maka update dan reset verifikasi
    if (email && email !== user.email) {
      emailChanged = true;
      updateFields.email = email;
      updateFields.email_verified_at = null; // reset verifikasi email

      // Generate OTP baru untuk email baru
      const otp = ('000000' + randomInt(0, 999999)).slice(-6);
      updateFields.otp_code = otp;
      updateFields.otp_expires_at = new Date(Date.now() + OTP_EXPIRATION_MS);

      // Kirim OTP ke email baru
      const emailResult = await sendOtpEmail(email, user.name, otp);
      if (!emailResult.success) {
        return res.status(500).json({
          success: false,
          message: 'Gagal mengirim email OTP untuk verifikasi email baru.',
        });
      }
    }

    // Jika password diberikan, hash password baru
    if (password) {
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(password, saltRounds);
      updateFields.password = hashedPassword;
    }

    // Update data pada record User
    await User.update(updateFields, { where: { id: user.id } });
    const updatedUser = await User.findByPk(user.id);

    let message = 'Profil berhasil diperbarui.';
    if (emailChanged) {
      message += ' Karena email diubah, silakan verifikasi email baru dengan OTP yang dikirim.';
    }

    return res.status(200).json({
      success: true,
      message,
      data: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        email_verified_at: updatedUser.email_verified_at,
      },
    });
  } catch (error) {
    console.error('Error updateProfile:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada server.',
    });
  }
};

/**
 * Fungsi untuk menghapus file dari local storage
 * @param {string} filename - Nama file yang akan dihapus
 * @returns {boolean} - True jika berhasil dihapus, false jika gagal
 */
const deleteFile = (filename) => {
  try {
    if (!filename) return true;
    
    const filePath = path.join(UPLOAD_DIR, filename);
    
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`File ${filename} berhasil dihapus`);
      return true;
    } else {
      console.log(`File ${filename} tidak ditemukan`);
      return false;
    }
  } catch (error) {
    console.error(`Error menghapus file ${filename}:`, error);
    return false;
  }
};

/**
 * Update profile image menggunakan PUT.
 * Menghapus file lama sebelum menyimpan file baru.
 * Jika record tidak ada, maka akan dibuat record baru.
 */
export const updateProfileImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'File gambar tidak ditemukan.',
      });
    }

    const profileImageFilename = req.file.filename;
    let userImage = await GambarUser.findOne({ 
      where: { users_id: req.user.id } 
    });
    
    let oldImageFilename = null;
    
    if (!userImage) {
      userImage = await GambarUser.create({
        users_id: req.user.id,
        gambar: profileImageFilename,
      });
      
      console.log(`Membuat record gambar profil baru untuk user ${req.user.id}`);
    } else {
      oldImageFilename = userImage.gambar;
      userImage.gambar = profileImageFilename;
      await userImage.save();
      
      console.log(`Mengupdate gambar profil user ${req.user.id} dari ${oldImageFilename} ke ${profileImageFilename}`);
    }
    
    // Hapus file lama jika ada
    if (oldImageFilename) {
      const deleteResult = deleteFile(oldImageFilename);
      if (deleteResult) {
        console.log(`Berhasil menghapus file gambar lama: ${oldImageFilename}`);
      } else {
        console.warn(`Gagal menghapus file gambar lama: ${oldImageFilename}`);
      }
    }

    return res.status(200).json({
      success: true,
      message: 'Profile image berhasil diperbarui.',
      data: { 
        profile_image: createImageUrl(userImage.gambar, uploadFolders.userImages)
      },
    });
  } catch (error) {
    console.error('Error updateProfileImage:', error);
    
    // Cleanup file baru jika terjadi error
    if (req.file?.filename) {
      try {
        deleteFile(req.file.filename);
        console.log(`File baru ${req.file.filename} dihapus karena proses update gagal`);
      } catch (cleanupError) {
        console.error('Error saat menghapus file upload:', cleanupError);
      }
    }
    
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada server.',
    });
  }
};

/**
 * Ganti password dengan validasi password lama.
 */
export const changePassword = async (req, res) => {
  try {
    const user = req.user;
    const { old_password, new_password } = req.body;

    if (!old_password || !new_password) {
      return res.status(400).json({
        success: false,
        message: 'Password lama dan password baru harus diisi.',
      });
    }

    const match = await bcrypt.compare(old_password, user.password);
    if (!match) {
      return res.status(401).json({
        success: false,
        message: 'Password lama tidak sesuai.',
      });
    }

    const saltRounds = 10;
    const hashedNewPassword = await bcrypt.hash(new_password, saltRounds);
    await User.update({ password: hashedNewPassword }, { where: { id: user.id } });

    return res.status(200).json({
      success: true,
      message: 'Password berhasil diubah.',
    });
  } catch (error) {
    console.error('Error changePassword:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada server.',
    });
  }
};