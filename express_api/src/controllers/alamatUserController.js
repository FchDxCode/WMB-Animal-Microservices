// src/controllers/alamatUserController.js
import { AlamatUser, Provinsi, KabupatenKota, Kecamatan } from '../models/alamatUserModels.js';
import { Op } from 'sequelize';

/**
 * Get semua alamat milik user yang sedang login
 */
export const getAllAlamat = async (req, res) => {
  try {
    const userId = req.user.id; // didapat dari authMiddleware

    // Ambil semua alamat milik user
    const alamatList = await AlamatUser.findAll({
      where: { user_id: userId },
      order: [['created_at', 'DESC']], // Urutan dari yang terbaru
      include: [
        { model: Provinsi, as: 'provinsi', attributes: ['id', 'provinsi'] },
        { model: KabupatenKota, as: 'kabupatenKota', attributes: ['id', 'nama_kabupaten_kota'] },
        { model: Kecamatan, as: 'kecamatan', attributes: ['id', 'nama_kecamatan'] }
      ]
    });

    // Format response
    const formattedAlamat = alamatList.map(alamat => {
      const alamatJson = alamat.toJSON();
      
      return {
        id: alamatJson.id,
        nama_lengkap: alamatJson.nama_lengkap,
        no_tlpn: alamatJson.no_tlpn,
        provinsi: alamatJson.provinsi ? alamatJson.provinsi.provinsi : null,
        provinsi_id: alamatJson.provinsi_id,
        kabupaten_kota: alamatJson.kabupatenKota ? alamatJson.kabupatenKota.nama_kabupaten_kota : null,
        kabupaten_kota_id: alamatJson.kabupaten_kota_id,
        kecamatan: alamatJson.kecamatan ? alamatJson.kecamatan.nama_kecamatan : null,
        kecamatan_id: alamatJson.kecamatan_id,
        kode_pos: alamatJson.kode_pos,
        detail_alamat: alamatJson.detail_alamat,
        maps: alamatJson.maps,
        latitude: alamatJson.latitude,
        longitude: alamatJson.longitude,
        created_at: alamatJson.created_at
      };
    });

    return res.status(200).json({
      success: true,
      message: 'Berhasil mengambil data alamat',
      data: formattedAlamat,
    });
  } catch (error) {
    console.error('Error getAllAlamat:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada server.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Get detail alamat berdasarkan ID
 * Hanya mengembalikan alamat milik user yang sedang login
 */
export const getAlamatById = async (req, res) => {
  try {
    const userId = req.user.id; // didapat dari authMiddleware
    const alamatId = req.params.id;

    // Validasi input
    if (!alamatId) {
      return res.status(400).json({
        success: false,
        message: 'ID alamat tidak valid',
      });
    }

    // Ambil data alamat
    const alamat = await AlamatUser.findOne({
      where: { 
        id: alamatId,
        user_id: userId // Memastikan alamat milik user yang login
      },
      include: [
        { model: Provinsi, as: 'provinsi', attributes: ['id', 'provinsi'] },
        { model: KabupatenKota, as: 'kabupatenKota', attributes: ['id', 'nama_kabupaten_kota'] },
        { model: Kecamatan, as: 'kecamatan', attributes: ['id', 'nama_kecamatan'] }
      ]
    });

    // Jika alamat tidak ditemukan
    if (!alamat) {
      return res.status(404).json({
        success: false,
        message: 'Alamat tidak ditemukan',
      });
    }

    // Format response
    const alamatJson = alamat.toJSON();
    
    const formattedAlamat = {
      id: alamatJson.id,
      nama_lengkap: alamatJson.nama_lengkap,
      no_tlpn: alamatJson.no_tlpn,
      provinsi: alamatJson.provinsi ? alamatJson.provinsi.provinsi : null,
      provinsi_id: alamatJson.provinsi_id,
      kabupaten_kota: alamatJson.kabupatenKota ? alamatJson.kabupatenKota.nama_kabupaten_kota : null,
      kabupaten_kota_id: alamatJson.kabupaten_kota_id,
      kecamatan: alamatJson.kecamatan ? alamatJson.kecamatan.nama_kecamatan : null,
      kecamatan_id: alamatJson.kecamatan_id,
      kode_pos: alamatJson.kode_pos,
      detail_alamat: alamatJson.detail_alamat,
      maps: alamatJson.maps,
      latitude: alamatJson.latitude,
      longitude: alamatJson.longitude,
      created_at: alamatJson.created_at,
      updated_at: alamatJson.updated_at
    };

    return res.status(200).json({
      success: true,
      message: 'Berhasil mengambil detail alamat',
      data: formattedAlamat,
    });
  } catch (error) {
    console.error('Error getAlamatById:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada server.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Tambah alamat baru
 */
export const addAlamat = async (req, res) => {
  try {
    const userId = req.user.id; // didapat dari authMiddleware
    const { 
      nama_lengkap, 
      no_tlpn, 
      provinsi_id, 
      kabupaten_kota_id, 
      kecamatan_id, 
      kode_pos, 
      maps, 
      detail_alamat,
      latitude,
      longitude
    } = req.body;

    // Validasi input
    if (!nama_lengkap || !no_tlpn || !provinsi_id || !kabupaten_kota_id || 
        !kecamatan_id || !kode_pos || !detail_alamat) {
      return res.status(400).json({
        success: false,
        message: 'Semua field wajib diisi kecuali latitude dan longitude',
      });
    }

    // Validasi nomor telepon (format Indonesia: +62 atau 08)
    const phoneRegex = /^(\+62|62|0)8[1-9][0-9]{6,10}$/;
    if (!phoneRegex.test(no_tlpn)) {
      return res.status(400).json({
        success: false,
        message: 'Format nomor telepon tidak valid. Gunakan format +62/62/08',
      });
    }

    // Validasi kode pos (5 digit)
    const postalCodeRegex = /^\d{5}$/;
    if (!postalCodeRegex.test(kode_pos)) {
      return res.status(400).json({
        success: false,
        message: 'Format kode pos tidak valid. Gunakan 5 digit angka',
      });
    }

    // Validasi foreign key (cek apakah provinsi, kabupaten, dan kecamatan ada)
    const provinsi = await Provinsi.findByPk(provinsi_id);
    if (!provinsi) {
      return res.status(400).json({
        success: false,
        message: 'Provinsi tidak ditemukan',
      });
    }

    const kabupatenKota = await KabupatenKota.findByPk(kabupaten_kota_id);
    if (!kabupatenKota) {
      return res.status(400).json({
        success: false,
        message: 'Kabupaten/Kota tidak ditemukan',
      });
    }

    // Pastikan kabupaten/kota berada dalam provinsi yang dipilih
    if (kabupatenKota.provinsi_id !== parseInt(provinsi_id)) {
      return res.status(400).json({
        success: false,
        message: 'Kabupaten/Kota tidak berada dalam provinsi yang dipilih',
      });
    }

    const kecamatan = await Kecamatan.findByPk(kecamatan_id);
    if (!kecamatan) {
      return res.status(400).json({
        success: false,
        message: 'Kecamatan tidak ditemukan',
      });
    }

    // Pastikan kecamatan berada dalam kabupaten/kota yang dipilih
    if (kecamatan.kabupaten_id !== parseInt(kabupaten_kota_id)) {
      return res.status(400).json({
        success: false,
        message: 'Kecamatan tidak berada dalam kabupaten/kota yang dipilih',
      });
    }

    // Validasi latitude dan longitude jika ada
    if (latitude && (isNaN(parseFloat(latitude)) || parseFloat(latitude) < -90 || parseFloat(latitude) > 90)) {
      return res.status(400).json({
        success: false,
        message: 'Nilai latitude tidak valid. Harus di antara -90 dan 90',
      });
    }

    if (longitude && (isNaN(parseFloat(longitude)) || parseFloat(longitude) < -180 || parseFloat(longitude) > 180)) {
      return res.status(400).json({
        success: false,
        message: 'Nilai longitude tidak valid. Harus di antara -180 dan 180',
      });
    }

    // Buat record alamat baru
    const newAlamat = await AlamatUser.create({
      user_id: userId,
      nama_lengkap,
      no_tlpn,
      provinsi_id,
      kabupaten_kota_id,
      kecamatan_id,
      kode_pos,
      maps: maps || '',
      detail_alamat,
      latitude: latitude || null,
      longitude: longitude || null,
    });

    // Ambil data alamat lengkap dengan relasi
    const alamatWithRelations = await AlamatUser.findByPk(newAlamat.id, {
      include: [
        { model: Provinsi, as: 'provinsi', attributes: ['id', 'provinsi'] },
        { model: KabupatenKota, as: 'kabupatenKota', attributes: ['id', 'nama_kabupaten_kota'] },
        { model: Kecamatan, as: 'kecamatan', attributes: ['id', 'nama_kecamatan'] }
      ]
    });

    const alamatJson = alamatWithRelations.toJSON();
    
    return res.status(201).json({
      success: true,
      message: 'Alamat berhasil ditambahkan',
      data: {
        id: alamatJson.id,
        nama_lengkap: alamatJson.nama_lengkap,
        no_tlpn: alamatJson.no_tlpn,
        provinsi: alamatJson.provinsi ? alamatJson.provinsi.provinsi : null,
        provinsi_id: alamatJson.provinsi_id,
        kabupaten_kota: alamatJson.kabupatenKota ? alamatJson.kabupatenKota.nama_kabupaten_kota : null,
        kabupaten_kota_id: alamatJson.kabupaten_kota_id,
        kecamatan: alamatJson.kecamatan ? alamatJson.kecamatan.nama_kecamatan : null,
        kecamatan_id: alamatJson.kecamatan_id,
        kode_pos: alamatJson.kode_pos,
        detail_alamat: alamatJson.detail_alamat,
        maps: alamatJson.maps,
        latitude: alamatJson.latitude,
        longitude: alamatJson.longitude,
        created_at: alamatJson.created_at
      },
    });
  } catch (error) {
    console.error('Error addAlamat:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada server.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Update alamat
 * Hanya mengupdate alamat milik user yang sedang login
 */
export const updateAlamat = async (req, res) => {
  try {
    const userId = req.user.id; // didapat dari authMiddleware
    const alamatId = req.params.id;
    const { 
      nama_lengkap, 
      no_tlpn, 
      provinsi_id, 
      kabupaten_kota_id, 
      kecamatan_id, 
      kode_pos, 
      maps, 
      detail_alamat,
      latitude,
      longitude
    } = req.body;

    // Validasi input
    if (!alamatId) {
      return res.status(400).json({
        success: false,
        message: 'ID alamat tidak valid',
      });
    }

    // Cek apakah alamat ada dan milik user yang login
    const alamat = await AlamatUser.findOne({
      where: { 
        id: alamatId,
        user_id: userId
      }
    });

    if (!alamat) {
      return res.status(404).json({
        success: false,
        message: 'Alamat tidak ditemukan',
      });
    }

    // Siapkan fields yang akan diupdate
    let updateFields = {};
    
    if (nama_lengkap) updateFields.nama_lengkap = nama_lengkap;
    
    // Validasi nomor telepon jika ada
    if (no_tlpn) {
      const phoneRegex = /^(\+62|62|0)8[1-9][0-9]{6,10}$/;
      if (!phoneRegex.test(no_tlpn)) {
        return res.status(400).json({
          success: false,
          message: 'Format nomor telepon tidak valid. Gunakan format +62/62/08',
        });
      }
      updateFields.no_tlpn = no_tlpn;
    }
    
    // Validasi dan set provinsi_id jika ada
    if (provinsi_id) {
      const provinsi = await Provinsi.findByPk(provinsi_id);
      if (!provinsi) {
        return res.status(400).json({
          success: false,
          message: 'Provinsi tidak ditemukan',
        });
      }
      updateFields.provinsi_id = provinsi_id;
    }
    
    // Validasi dan set kabupaten_kota_id jika ada
    if (kabupaten_kota_id) {
      const kabupatenKota = await KabupatenKota.findByPk(kabupaten_kota_id);
      if (!kabupatenKota) {
        return res.status(400).json({
          success: false,
          message: 'Kabupaten/Kota tidak ditemukan',
        });
      }
      
      // Pastikan kabupaten/kota berada dalam provinsi yang dipilih
      const provinsiToCheck = provinsi_id || alamat.provinsi_id;
      if (kabupatenKota.provinsi_id !== parseInt(provinsiToCheck)) {
        return res.status(400).json({
          success: false,
          message: 'Kabupaten/Kota tidak berada dalam provinsi yang dipilih',
        });
      }
      
      updateFields.kabupaten_kota_id = kabupaten_kota_id;
    }
    
    // Validasi dan set kecamatan_id jika ada
    if (kecamatan_id) {
      const kecamatan = await Kecamatan.findByPk(kecamatan_id);
      if (!kecamatan) {
        return res.status(400).json({
          success: false,
          message: 'Kecamatan tidak ditemukan',
        });
      }
      
      // Pastikan kecamatan berada dalam kabupaten/kota yang dipilih
      const kabupatenToCheck = kabupaten_kota_id || alamat.kabupaten_kota_id;
      if (kecamatan.kabupaten_id !== parseInt(kabupatenToCheck)) {
        return res.status(400).json({
          success: false,
          message: 'Kecamatan tidak berada dalam kabupaten/kota yang dipilih',
        });
      }
      
      updateFields.kecamatan_id = kecamatan_id;
    }
    
    // Validasi dan set kode pos jika ada
    if (kode_pos) {
      const postalCodeRegex = /^\d{5}$/;
      if (!postalCodeRegex.test(kode_pos)) {
        return res.status(400).json({
          success: false,
          message: 'Format kode pos tidak valid. Gunakan 5 digit angka',
        });
      }
      updateFields.kode_pos = kode_pos;
    }
    
    // Set maps jika ada
    if (maps !== undefined) {
      updateFields.maps = maps || '';
    }
    
    // Set detail alamat jika ada
    if (detail_alamat) {
      updateFields.detail_alamat = detail_alamat;
    }
    
    // Validasi dan set latitude jika ada
    if (latitude !== undefined) {
      if (latitude === null) {
        updateFields.latitude = null;
      } else if (isNaN(parseFloat(latitude)) || parseFloat(latitude) < -90 || parseFloat(latitude) > 90) {
        return res.status(400).json({
          success: false,
          message: 'Nilai latitude tidak valid. Harus di antara -90 dan 90',
        });
      } else {
        updateFields.latitude = latitude;
      }
    }
    
    // Validasi dan set longitude jika ada
    if (longitude !== undefined) {
      if (longitude === null) {
        updateFields.longitude = null;
      } else if (isNaN(parseFloat(longitude)) || parseFloat(longitude) < -180 || parseFloat(longitude) > 180) {
        return res.status(400).json({
          success: false,
          message: 'Nilai longitude tidak valid. Harus di antara -180 dan 180',
        });
      } else {
        updateFields.longitude = longitude;
      }
    }
    
    // Update timestamp
    updateFields.updated_at = new Date();
    
    // Update alamat
    await AlamatUser.update(updateFields, {
      where: { id: alamatId, user_id: userId }
    });
    
    // Ambil data terbaru
    const updatedAlamat = await AlamatUser.findByPk(alamatId, {
      include: [
        { model: Provinsi, as: 'provinsi', attributes: ['id', 'provinsi'] },
        { model: KabupatenKota, as: 'kabupatenKota', attributes: ['id', 'nama_kabupaten_kota'] },
        { model: Kecamatan, as: 'kecamatan', attributes: ['id', 'nama_kecamatan'] }
      ]
    });
    
    // Format response
    const alamatJson = updatedAlamat.toJSON();
    
    return res.status(200).json({
      success: true,
      message: 'Alamat berhasil diperbarui',
      data: {
        id: alamatJson.id,
        nama_lengkap: alamatJson.nama_lengkap,
        no_tlpn: alamatJson.no_tlpn,
        provinsi: alamatJson.provinsi ? alamatJson.provinsi.provinsi : null,
        provinsi_id: alamatJson.provinsi_id,
        kabupaten_kota: alamatJson.kabupatenKota ? alamatJson.kabupatenKota.nama_kabupaten_kota : null,
        kabupaten_kota_id: alamatJson.kabupaten_kota_id,
        kecamatan: alamatJson.kecamatan ? alamatJson.kecamatan.nama_kecamatan : null,
        kecamatan_id: alamatJson.kecamatan_id,
        kode_pos: alamatJson.kode_pos,
        detail_alamat: alamatJson.detail_alamat,
        maps: alamatJson.maps,
        latitude: alamatJson.latitude,
        longitude: alamatJson.longitude,
        updated_at: alamatJson.updated_at
      },
    });
  } catch (error) {
    console.error('Error updateAlamat:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada server.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Delete alamat
 * Hanya menghapus alamat milik user yang sedang login
 */
export const deleteAlamat = async (req, res) => {
  try {
    const userId = req.user.id; // didapat dari authMiddleware
    const alamatId = req.params.id;

    // Validasi input
    if (!alamatId) {
      return res.status(400).json({
        success: false,
        message: 'ID alamat tidak valid',
      });
    }

    // Cek apakah alamat ada dan milik user yang login
    const alamat = await AlamatUser.findOne({
      where: { 
        id: alamatId,
        user_id: userId
      }
    });

    if (!alamat) {
      return res.status(404).json({
        success: false,
        message: 'Alamat tidak ditemukan',
      });
    }

    // Hapus record alamat
    await AlamatUser.destroy({
      where: { id: alamatId, user_id: userId }
    });

    return res.status(200).json({
      success: true,
      message: 'Alamat berhasil dihapus',
    });
  } catch (error) {
    console.error('Error deleteAlamat:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada server.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Get semua provinsi untuk dropdown
 */
export const getAllProvinsi = async (req, res) => {
  try {
    const provinsiList = await Provinsi.findAll({
      order: [['provinsi', 'ASC']]
    });
    
    return res.status(200).json({
      success: true,
      message: 'Berhasil mengambil data provinsi',
      data: provinsiList.map(p => ({
        id: p.id,
        provinsi: p.provinsi
      }))
    });
  } catch (error) {
    console.error('Error getAllProvinsi:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada server.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Get kabupaten/kota berdasarkan provinsi_id untuk dropdown
 */
export const getKabupatenByProvinsi = async (req, res) => {
  try {
    const { provinsiId } = req.params;
    
    if (!provinsiId) {
      return res.status(400).json({
        success: false,
        message: 'ID provinsi tidak valid',
      });
    }
    
    const kabupatenList = await KabupatenKota.findAll({
      where: { provinsi_id: provinsiId },
      order: [['nama_kabupaten_kota', 'ASC']]
    });
    
    return res.status(200).json({
      success: true,
      message: 'Berhasil mengambil data kabupaten/kota',
      data: kabupatenList.map(k => ({
        id: k.id,
        nama_kabupaten_kota: k.nama_kabupaten_kota
      }))
    });
  } catch (error) {
    console.error('Error getKabupatenByProvinsi:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada server.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Get kecamatan berdasarkan kabupaten_id untuk dropdown
 */
export const getKecamatanByKabupaten = async (req, res) => {
  try {
    const { kabupatenId } = req.params;
    
    if (!kabupatenId) {
      return res.status(400).json({
        success: false,
        message: 'ID kabupaten/kota tidak valid',
      });
    }
    
    const kecamatanList = await Kecamatan.findAll({
      where: { kabupaten_id: kabupatenId },
      order: [['nama_kecamatan', 'ASC']]
    });
    
    return res.status(200).json({
      success: true,
      message: 'Berhasil mengambil data kecamatan',
      data: kecamatanList.map(k => ({
        id: k.id,
        nama_kecamatan: k.nama_kecamatan
      }))
    });
  } catch (error) {
    console.error('Error getKecamatanByKabupaten:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada server.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};