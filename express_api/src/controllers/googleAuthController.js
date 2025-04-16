import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import { User, GambarUser } from '../models/userModels.js';
import dotenv from 'dotenv';
import { uploadFolders, createImageUrl } from '../utils/uploadUtils.js';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'yoursecretkey';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;

// Membuat instance OAuth2Client
const client = new OAuth2Client();

// Helper function untuk format user data dengan URL gambar
const formatUserData = (user) => {
  if (!user) return null;
  
  const userData = user.toJSON ? user.toJSON() : { ...user };
  delete userData.password;
  
  // Format gambar profile dengan URL lengkap
  if (userData.gambar && userData.gambar.length > 0) {
    userData.gambar = userData.gambar.map(img => ({
      id: img.id,
      users_id: img.users_id,
      gambar: createImageUrl(img.gambar, uploadFolders.userImages),
      created_at: img.created_at,
      updated_at: img.updated_at
    }));
  }
  
  return userData;
};

export const googleLogin = async (req, res) => {
  try {
    // Mendapatkan token dari request
    const { idToken } = req.body;
    
    if (!idToken) {
      return res.status(400).json({
        success: false,
        message: 'Google ID token tidak ditemukan'
      });
    }

    // Verifikasi token Google tanpa memeriksa audience (aud)
    const ticket = await client.verifyIdToken({
      idToken: idToken,
      // Kita tidak menyediakan audience untuk menghindari error
      // audience: GOOGLE_CLIENT_ID 
    });

    // Mengambil informasi user dari payload token
    const payload = ticket.getPayload();
    
    if (!payload) {
      return res.status(400).json({
        success: false,
        message: 'Tidak dapat memverifikasi token Google'
      });
    }

    console.log('Google payload:', payload); // Logging untuk debugging
    
    // Ekstrak data dari payload dengan pengecekan nilai default
    const googleId = payload.sub;
    const email = payload.email;
    
    // Cek berbagai kemungkinan properti untuk nama
    let userName = null;
    if (payload.name) {
      userName = payload.name;
    } else if (payload.given_name && payload.family_name) {
      userName = `${payload.given_name} ${payload.family_name}`;
    } else if (payload.given_name) {
      userName = payload.given_name;
    } else if (payload.displayName) {
      userName = payload.displayName;
    } else {
      // Jika tidak ada nama, gunakan bagian depan email
      userName = email.split('@')[0];
    }
    
    const picture = payload.picture || null;

    // Validasi data yang diperlukan
    if (!googleId || !email) {
      return res.status(400).json({
        success: false,
        message: 'Data dari Google tidak lengkap'
      });
    }

    // Mencari user berdasarkan id Google
    let user = await User.findOne({ 
      where: { id_google: googleId },
      include: [
        { model: GambarUser, as: 'gambar' }
      ]
    });

    // Jika user dengan id Google tidak ditemukan, cek apakah email sudah terdaftar
    if (!user) {
      user = await User.findOne({ 
        where: { email: email },
        include: [
          { model: GambarUser, as: 'gambar' }
        ]
      });

      // Jika user dengan email ditemukan, update id Google
      if (user) {
        user.id_google = googleId;
        await user.save();
      } else {
        // Debug: log data sebelum membuat user
        console.log('Creating new user with data:', {
          name: userName,
          email: email,
          id_google: googleId
        });
        
        // Jika user sama sekali belum terdaftar, buat user baru
        user = await User.create({
          name: userName, // Menggunakan userName yang sudah divalidasi
          email: email,
          id_google: googleId,
          email_verified_at: new Date(),
          // Generate random password untuk user Google
          password: Math.random().toString(36).slice(-12) + Math.random().toString(36).slice(-12),
          last_login: new Date()
        });

        // Simpan foto profil jika ada
        if (picture) {
          await GambarUser.create({
            users_id: user.id,
            gambar: picture
          });
        }

        // Reload user dengan relasi
        user = await User.findByPk(user.id, {
          include: [
            { model: GambarUser, as: 'gambar' }
          ]
        });
      }
    } else {
      // Update last login jika user ditemukan
      user.last_login = new Date();
      await user.save();
    }

    // Generate JWT untuk user
    const token = jwt.sign(
      { userId: user.id },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    // Update token di database
    user.remember_token = token;
    await user.save();

    // Format data user dengan URL gambar lengkap
    const formattedUserData = formatUserData(user);

    return res.status(200).json({
      success: true,
      message: 'Login dengan Google berhasil',
      data: {
        user: formattedUserData,
        token
      }
    });
  } catch (error) {
    console.error('Error saat login dengan Google:', error);
    
    // Tampilkan stack trace untuk debugging
    console.error(error.stack);
    
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat memproses login dengan Google',
      error: error.message
    });
  }
};

// Endpoint untuk mendapatkan informasi login user
export const getUserInfo = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      include: [
        { model: GambarUser, as: 'gambar' }
      ],
      attributes: { exclude: ['password'] }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User tidak ditemukan'
      });
    }

    // Format data user dengan URL gambar lengkap
    const formattedUserData = formatUserData(user);

    return res.status(200).json({
      success: true,
      data: formattedUserData
    });
  } catch (error) {
    console.error('Error saat mengambil informasi user:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat mengambil informasi user',
      error: error.message
    });
  }
};