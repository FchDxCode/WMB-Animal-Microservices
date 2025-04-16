import { Klinik, GambarKlinik, LayananKlinik, JadwalBukaKlinik } from '../models/klinikModels.js';
import { Dokter, GambarDokter } from '../models/dokterModels.js';
import { uploadFolders, createImageUrl } from '../utils/uploadUtils.js';

// Helper function untuk format data klinik
const formatKlinikData = (klinik) => {
  return {
    id: klinik.id,
    nama_klinik: klinik.nama_klinik,
    deskripsi_klinik: klinik.deskripsi_klinik,
    harga_konsultasi: klinik.harga_konsultasi,
    waktu_konsultasi: klinik.waktu_konsultasi,
    logo_klinik: klinik.gambar && klinik.gambar.length > 0 
      ? createImageUrl(klinik.gambar[0].logo_klinik, uploadFolders.klinikImages)
      : null
  };
};

// Helper function untuk format data dokter
const formatDokterData = (dokter) => {
  return {
    id: dokter.id,
    nama_dokter: dokter.nama,
    universitas_dokter: dokter.universitas,
    gambar_dokter: dokter.gambar_dokter && dokter.gambar_dokter.length > 0 
      ? createImageUrl(dokter.gambar_dokter[0].gambar, uploadFolders.dokterImages)
      : null
  };
};

// Mendapatkan daftar semua klinik konsultasi
export const getAllKlinik = async (req, res) => {
  try {
    const klinik = await Klinik.findAll({
      include: [
        {
          model: GambarKlinik,
          as: 'gambar',
          attributes: ['id', 'logo_klinik']
        }
      ],
      attributes: [
        'id',
        'nama_klinik',
        'deskripsi_klinik',
        'harga_konsultasi',
        'waktu_konsultasi'
      ]
    });

    if (!klinik || klinik.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Data klinik konsultasi tidak ditemukan"
      });
    }

    // Format data untuk respons dengan URL gambar lengkap
    const formattedKlinik = klinik.map(formatKlinikData);

    return res.status(200).json({
      success: true,
      message: "Berhasil mendapatkan data klinik konsultasi",
      data: formattedKlinik
    });
  } catch (error) {
    console.error("Error getting klinik:", error);
    return res.status(500).json({
      success: false,
      message: "Terjadi kesalahan pada server",
      error: error.message
    });
  }
};
    
// Mendapatkan daftar dokter berdasarkan ID klinik
export const getDokterByKlinikId = async (req, res) => {
  const { klinikId } = req.params;
  
  try {
    // Verifikasi klinik ada
    const klinik = await Klinik.findByPk(klinikId);
    
    if (!klinik) {
      return res.status(404).json({
        success: false,
        message: "Klinik tidak ditemukan"
      });
    }
    
    const dokter = await Dokter.findAll({
      where: { klinik_id: klinikId },
      include: [
        {
          model: GambarDokter,
          as: 'gambar_dokter',
          attributes: ['id', 'gambar']
        }
      ],
      attributes: [
        'id',
        'nama',
        'universitas'
      ]
    });

    if (!dokter || dokter.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Tidak ada dokter yang tersedia di klinik ini"
      });
    }

    // Format data dokter untuk respons dengan URL gambar lengkap
    const formattedDokter = dokter.map(formatDokterData);

    return res.status(200).json({
      success: true,
      message: "Berhasil mendapatkan data dokter",
      data: formattedDokter
    });
  } catch (error) {
    console.error("Error getting dokter by klinik:", error);
    return res.status(500).json({
      success: false,
      message: "Terjadi kesalahan pada server",
      error: error.message
    });
  }
};