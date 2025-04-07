// src/controllers/petController.js
import fs from 'fs';
import path from 'path';
import { HewanPeliharaan, GambarHewan } from '../models/petModels.js';
import dotenv from 'dotenv';
import { uploadPaths, createImageUrl, uploadFolders } from '../utils/uploadUtils.js';

// Inisialisasi dotenv
dotenv.config();

// Gunakan path dari config
const UPLOAD_DIR = uploadPaths.petImages;

if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

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
 * Get semua hewan peliharaan milik user yang sedang login
 */
export const getAllPets = async (req, res) => {
  try {
    const userId = req.user.id; // didapat dari authMiddleware

    // Ambil semua hewan peliharaan milik user
    const pets = await HewanPeliharaan.findAll({
      where: { user_id: userId },
      order: [['created_at', 'DESC']], // Urutan dari yang terbaru
      include: [{
        model: GambarHewan,
        as: 'gambar',
        attributes: ['profile_hewan']
      }]
    });

    // Format response
    const formattedPets = pets.map(pet => {
      const petJson = pet.toJSON();
      
      // Ambil profile_hewan dari relasi gambar (jika ada)
      let profileImage = null;
      if (petJson.gambar && petJson.gambar.length > 0) {
        profileImage = createImageUrl(petJson.gambar[0].profile_hewan, uploadFolders.petImages);
      }
      
      return {
        id: petJson.id,
        nama_hewan: petJson.nama_hewan,
        jenis_hewan_id: petJson.jenis_hewan_id,
        jenis_kelamin: petJson.jenis_kelamin,
        jenis_ras: petJson.jenis_ras,
        tanggal_lahir_hewan: petJson.tanggal_lahir_hewan,
        berat_badan: petJson.berat_badan,
        profile_image: profileImage,
        created_at: petJson.created_at,
      };
    });

    return res.status(200).json({
      success: true,
      message: 'Berhasil mengambil data hewan peliharaan',
      data: formattedPets,
    });
  } catch (error) {
    console.error('Error getAllPets:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada server.',
    });
  }
};

/**
 * Get detail hewan peliharaan berdasarkan ID
 * Hanya mengembalikan hewan peliharaan milik user yang sedang login
 */
export const getPetById = async (req, res) => {
  try {
    const userId = req.user.id; // didapat dari authMiddleware
    const petId = req.params.id;

    // Validasi input
    if (!petId) {
      return res.status(400).json({
        success: false,
        message: 'ID hewan peliharaan tidak valid',
      });
    }

    // Ambil data hewan peliharaan
    const pet = await HewanPeliharaan.findOne({
      where: { 
        id: petId,
        user_id: userId // Memastikan hewan peliharaan milik user yang login
      },
      include: [{
        model: GambarHewan,
        as: 'gambar',
        attributes: ['profile_hewan']
      }]
    });

    // Jika hewan peliharaan tidak ditemukan
    if (!pet) {
      return res.status(404).json({
        success: false,
        message: 'Hewan peliharaan tidak ditemukan',
      });
    }

    // Format response
    const petJson = pet.toJSON();
    let profileImage = null;
    if (petJson.gambar && petJson.gambar.length > 0) {
      profileImage = createImageUrl(petJson.gambar[0].profile_hewan, uploadFolders.petImages);
    }

    return res.status(200).json({
      success: true,
      message: 'Berhasil mengambil detail hewan peliharaan',
      data: {
        id: petJson.id,
        nama_hewan: petJson.nama_hewan,
        jenis_hewan_id: petJson.jenis_hewan_id,
        jenis_kelamin: petJson.jenis_kelamin,
        jenis_ras: petJson.jenis_ras,
        tanggal_lahir_hewan: petJson.tanggal_lahir_hewan,
        berat_badan: petJson.berat_badan,
        profile_image: profileImage,
        created_at: petJson.created_at,
        updated_at: petJson.updated_at,
      },
    });
  } catch (error) {
    console.error('Error getPetById:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada server.',
    });
  }
};

/**
 * Tambah hewan peliharaan baru
 */
export const addPet = async (req, res) => {
  try {
    const userId = req.user.id; // didapat dari authMiddleware
    const { 
      nama_hewan, 
      jenis_hewan_id, 
      jenis_kelamin, 
      jenis_ras, 
      tanggal_lahir_hewan, 
      berat_badan 
    } = req.body;

    // Validasi input
    if (!nama_hewan || !jenis_hewan_id || !jenis_kelamin) {
      return res.status(400).json({
        success: false,
        message: 'Nama hewan, jenis hewan, dan jenis kelamin wajib diisi',
      });
    }

    // Validasi jenis kelamin
    const validGenders = ['jantan', 'betina', 'nonbinary'];
    if (!validGenders.includes(jenis_kelamin)) {
      return res.status(400).json({
        success: false,
        message: 'Jenis kelamin tidak valid. Pilih jantan, betina, atau nonbinary',
      });
    }

    // Validasi dan parsing tanggal lahir jika ada
    let parsedDate = null;
    if (tanggal_lahir_hewan) {
      parsedDate = new Date(tanggal_lahir_hewan);
      if (isNaN(parsedDate.getTime())) {
        return res.status(400).json({
          success: false,
          message: 'Format tanggal lahir tidak valid. Gunakan format YYYY-MM-DD',
        });
      }
    }

    // Validasi berat badan (opsional, maksimum 999)
    const weight = parseInt(berat_badan, 10);
    if (berat_badan && (isNaN(weight) || weight < 0 || weight > 999)) {
      return res.status(400).json({
        success: false,
        message: 'Berat badan harus berupa angka positif (maksimum 999)',
      });
    }

    // Buat record hewan peliharaan baru
    const newPet = await HewanPeliharaan.create({
      user_id: userId,
      nama_hewan,
      jenis_hewan_id,
      jenis_kelamin,
      jenis_ras: jenis_ras || null,
      tanggal_lahir_hewan: parsedDate,
      berat_badan: weight || 0,
    });

    return res.status(201).json({
      success: true,
      message: 'Hewan peliharaan berhasil ditambahkan',
      data: {
        id: newPet.id,
        nama_hewan: newPet.nama_hewan,
        jenis_hewan_id: newPet.jenis_hewan_id,
        jenis_kelamin: newPet.jenis_kelamin,
        jenis_ras: newPet.jenis_ras,
        tanggal_lahir_hewan: newPet.tanggal_lahir_hewan,
        berat_badan: newPet.berat_badan,
      },
    });
  } catch (error) {
    console.error('Error addPet:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada server.',
    });
  }
};

/**
 * Update data hewan peliharaan
 * Hanya mengupdate hewan peliharaan milik user yang sedang login
 */
export const updatePet = async (req, res) => {
  try {
    const userId = req.user.id; // didapat dari authMiddleware
    const petId = req.params.id;
    const { 
      nama_hewan, 
      jenis_hewan_id, 
      jenis_kelamin, 
      jenis_ras, 
      tanggal_lahir_hewan, 
      berat_badan 
    } = req.body;

    // Validasi input
    if (!petId) {
      return res.status(400).json({
        success: false,
        message: 'ID hewan peliharaan tidak valid',
      });
    }

    // Cek apakah hewan peliharaan ada dan milik user yang login
    const pet = await HewanPeliharaan.findOne({
      where: { 
        id: petId,
        user_id: userId
      }
    });

    if (!pet) {
      return res.status(404).json({
        success: false,
        message: 'Hewan peliharaan tidak ditemukan',
      });
    }

    // Siapkan fields yang akan diupdate
    let updateFields = {};
    
    if (nama_hewan) updateFields.nama_hewan = nama_hewan;
    if (jenis_hewan_id) updateFields.jenis_hewan_id = jenis_hewan_id;
    
    // Validasi jenis kelamin jika ada
    if (jenis_kelamin) {
      const validGenders = ['jantan', 'betina', 'nonbinary'];
      if (!validGenders.includes(jenis_kelamin)) {
        return res.status(400).json({
          success: false,
          message: 'Jenis kelamin tidak valid. Pilih jantan, betina, atau nonbinary',
        });
      }
      updateFields.jenis_kelamin = jenis_kelamin;
    }
    
    // Set ras (bisa null)
    updateFields.jenis_ras = jenis_ras || null;
    
    // Validasi dan parsing tanggal lahir jika ada
    if (tanggal_lahir_hewan) {
      const parsedDate = new Date(tanggal_lahir_hewan);
      if (isNaN(parsedDate.getTime())) {
        return res.status(400).json({
          success: false,
          message: 'Format tanggal lahir tidak valid. Gunakan format YYYY-MM-DD',
        });
      }
      updateFields.tanggal_lahir_hewan = parsedDate;
    } else if (tanggal_lahir_hewan === null) {
      // Jika tanggal lahir dikirim sebagai null, hapus tanggal lahir
      updateFields.tanggal_lahir_hewan = null;
    }
    
    // Validasi berat badan jika ada
    if (berat_badan !== undefined) {
      const weight = parseInt(berat_badan, 10);
      if (isNaN(weight) || weight < 0 || weight > 999) {
        return res.status(400).json({
          success: false,
          message: 'Berat badan harus berupa angka positif (maksimum 999)',
        });
      }
      updateFields.berat_badan = weight;
    }
    
    // Update timestamp
    updateFields.updated_at = new Date();
    
    // Update hewan peliharaan
    await HewanPeliharaan.update(updateFields, {
      where: { id: petId, user_id: userId }
    });
    
    // Ambil data terbaru
    const updatedPet = await HewanPeliharaan.findByPk(petId, {
      include: [{
        model: GambarHewan,
        as: 'gambar',
        attributes: ['profile_hewan']
      }]
    });
    
    // Format response
    const petJson = updatedPet.toJSON();
    let profileImage = null;
    if (petJson.gambar && petJson.gambar.length > 0) {
      profileImage = createImageUrl(petJson.gambar[0].profile_hewan, uploadFolders.petImages);
    }

    return res.status(200).json({
      success: true,
      message: 'Data hewan peliharaan berhasil diperbarui',
      data: {
        id: petJson.id,
        nama_hewan: petJson.nama_hewan,
        jenis_hewan_id: petJson.jenis_hewan_id,
        jenis_kelamin: petJson.jenis_kelamin,
        jenis_ras: petJson.jenis_ras,
        tanggal_lahir_hewan: petJson.tanggal_lahir_hewan,
        berat_badan: petJson.berat_badan,
        profile_image: profileImage,
        updated_at: petJson.updated_at,
      },
    });
  } catch (error) {
    console.error('Error updatePet:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada server.',
    });
  }
};

/**
 * Delete hewan peliharaan
 * Hanya menghapus hewan peliharaan milik user yang sedang login
 */
export const deletePet = async (req, res) => {
  try {
    const userId = req.user.id; // didapat dari authMiddleware
    const petId = req.params.id;

    // Validasi input
    if (!petId) {
      return res.status(400).json({
        success: false,
        message: 'ID hewan peliharaan tidak valid',
      });
    }

    // Cek apakah hewan peliharaan ada dan milik user yang login
    const pet = await HewanPeliharaan.findOne({
      where: { 
        id: petId,
        user_id: userId
      },
      include: [{
        model: GambarHewan,
        as: 'gambar'
      }]
    });

    if (!pet) {
      return res.status(404).json({
        success: false,
        message: 'Hewan peliharaan tidak ditemukan',
      });
    }

    // Hapus file gambar profil jika ada
    if (pet.gambar && pet.gambar.length > 0) {
      for (const gambar of pet.gambar) {
        if (gambar.profile_hewan) {
          deleteFile(gambar.profile_hewan);
        }
        // Hapus record gambar dari database
        await GambarHewan.destroy({
          where: { id: gambar.id }
        });
      }
    }

    // Hapus record hewan peliharaan
    await HewanPeliharaan.destroy({
      where: { id: petId, user_id: userId }
    });

    return res.status(200).json({
      success: true,
      message: 'Hewan peliharaan berhasil dihapus',
    });
  } catch (error) {
    console.error('Error deletePet:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada server.',
    });
  }
};

/**
 * Upload/update gambar profil hewan
 */
export const updatePetProfileImage = async (req, res) => {
  try {
    const userId = req.user.id; // didapat dari authMiddleware
    const petId = req.params.id;

    // Validasi input
    if (!petId) {
      return res.status(400).json({
        success: false,
        message: 'ID hewan peliharaan tidak valid',
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'File gambar tidak ditemukan',
      });
    }

    // Cek apakah hewan peliharaan ada dan milik user yang login
    const pet = await HewanPeliharaan.findOne({
      where: { 
        id: petId,
        user_id: userId
      }
    });

    if (!pet) {
      // Hapus file yang sudah diupload
      if (req.file && req.file.filename) {
        deleteFile(req.file.filename);
      }
      
      return res.status(404).json({
        success: false,
        message: 'Hewan peliharaan tidak ditemukan',
      });
    }

    // Ambil nama file hasil upload
    const profileImageFilename = req.file.filename;

    // Cari record GambarHewan yang sudah ada
    let petImage = await GambarHewan.findOne({
      where: { hewan_peliharaan_id: petId }
    });
    
    // Variabel untuk menyimpan nama file gambar lama
    let oldImageFilename = null;
    
    if (!petImage) {
      // Jika tidak ditemukan, buat record baru
      petImage = await GambarHewan.create({
        hewan_peliharaan_id: petId,
        profile_hewan: profileImageFilename,
      });
      
      console.log(`Membuat record gambar profil baru untuk hewan ${petId}`);
    } else {
      // Simpan nama file gambar lama sebelum diupdate
      oldImageFilename = petImage.profile_hewan;
      
      // Update field gambar
      petImage.profile_hewan = profileImageFilename;
      await petImage.save();
      
      console.log(`Mengupdate gambar profil hewan ${petId} dari ${oldImageFilename} ke ${profileImageFilename}`);
    }
    
    // Hapus file gambar lama jika ada
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
      message: 'Gambar profil hewan berhasil diperbarui',
      data: { 
        profile_image: createImageUrl(petImage.profile_hewan, uploadFolders.petImages)
      },
    });
  } catch (error) {
    console.error('Error updatePetProfileImage:', error);
    
    // Jika terjadi error, hapus file yang baru diupload (cleanup)
    if (req.file && req.file.filename) {
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