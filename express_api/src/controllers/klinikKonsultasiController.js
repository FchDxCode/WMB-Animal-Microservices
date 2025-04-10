import { Klinik, GambarKlinik, LayananKlinik, JadwalBukaKlinik } from '../models/klinikModels.js';
import { Dokter, GambarDokter } from '../models/dokterModels.js';

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
        status: false,
        message: "Data klinik konsultasi tidak ditemukan"
      });
    }

    // Format data untuk respons
    const formattedKlinik = klinik.map(item => {
      return {
        id: item.id,
        nama_klinik: item.nama_klinik,
        deskripsi_klinik: item.deskripsi_klinik,
        harga_konsultasi: item.harga_konsultasi,
        waktu_konsultasi: item.waktu_konsultasi,
        logo_klinik: item.gambar && item.gambar.length > 0 ? 
          item.gambar[0].logo_klinik : null
      };
    });

    return res.status(200).json({
      status: true,
      message: "Berhasil mendapatkan data klinik konsultasi",
      data: formattedKlinik
    });
  } catch (error) {
    console.error("Error getting klinik:", error);
    return res.status(500).json({
      status: false,
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
        status: false,
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
        status: false,
        message: "Tidak ada dokter yang tersedia di klinik ini"
      });
    }

    // Format data dokter untuk respons
    const formattedDokter = dokter.map(item => {
      return {
        id: item.id,
        nama_dokter: item.nama,
        universitas_dokter: item.universitas,
        gambar_dokter: item.gambar_dokter && item.gambar_dokter.length > 0 ? 
          item.gambar_dokter[0].gambar : null
      };
    });

    return res.status(200).json({
      status: true,
      message: "Berhasil mendapatkan data dokter",
      data: formattedDokter
    });
  } catch (error) {
    console.error("Error getting dokter by klinik:", error);
    return res.status(500).json({
      status: false,
      message: "Terjadi kesalahan pada server",
      error: error.message
    });
  }
};