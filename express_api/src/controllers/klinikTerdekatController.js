import { Klinik, JadwalBukaKlinik, GambarKlinik } from '../models/klinikModels.js';
import { Sequelize, Op } from 'sequelize';
import moment from 'moment';

// Fungsi untuk menghitung jarak antara dua titik koordinat menggunakan formula Haversine
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Radius bumi dalam km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c; // Jarak dalam km
  return distance;
};

export const getKlinikTerdekat = async (req, res) => {
  try {
    // Ambil parameter dari query string
    const { latitude, longitude, radius = 10, limit = 20 } = req.query;
    
    // Validasi parameter yang diperlukan
    if (!latitude || !longitude) {
      return res.status(400).json({
        status: false,
        message: 'Parameter latitude dan longitude diperlukan',
      });
    }

    // Konversi string ke float
    const userLat = parseFloat(latitude);
    const userLon = parseFloat(longitude);

    // Validasi nilai latitude dan longitude
    if (isNaN(userLat) || isNaN(userLon) || 
        userLat < -90 || userLat > 90 || 
        userLon < -180 || userLon > 180) {
      return res.status(400).json({
        status: false,
        message: 'Nilai latitude atau longitude tidak valid',
      });
    }

    // Ambil hari ini dalam bahasa Indonesia
    const today = moment().locale('id').format('dddd');
    
    // Ambil semua data klinik beserta relasi yang dibutuhkan
    const klinikList = await Klinik.findAll({
      include: [
        {
          model: GambarKlinik,
          as: 'gambar',
          attributes: ['logo_klinik']
        },
        {
          model: JadwalBukaKlinik,
          as: 'jadwal_buka',
          where: {
            hari: today
          },
          required: false // LEFT JOIN agar klinik tanpa jadwal hari ini tetap muncul
        }
      ]
    });

    // Hitung jarak dan filter klinik berdasarkan radius
    const klinikWithDistance = klinikList
      .map(klinik => {
        const klinikData = klinik.toJSON();
        const distance = calculateDistance(
          userLat, 
          userLon, 
          parseFloat(klinikData.latitude), 
          parseFloat(klinikData.longitude)
        );
        
        return {
          ...klinikData,
          jarak: parseFloat(distance.toFixed(1)), // Jarak dalam km dengan 1 desimal
          logo_klinik: klinikData.gambar && klinikData.gambar.length > 0 ? klinikData.gambar[0].logo_klinik : null,
          jam_operasional: klinikData.jadwal_buka && klinikData.jadwal_buka.length > 0 
            ? `${klinikData.jadwal_buka[0].jam_mulai} - ${klinikData.jadwal_buka[0].jam_selesai}`
            : 'Tutup hari ini'
        };
      })
      .filter(klinik => klinik.jarak <= parseFloat(radius))
      .sort((a, b) => a.jarak - b.jarak);

    // Hapus properti yang tidak diperlukan
    const formattedKlinik = klinikWithDistance
      .slice(0, parseInt(limit))
      .map(klinik => {
        return {
          id: klinik.id,
          nama_klinik: klinik.nama_klinik,
          alamat_klinik: klinik.alamat_klinik,
          logo_klinik: klinik.logo_klinik,
          jam_operasional: klinik.jam_operasional,
          jarak: klinik.jarak,
          latitude: parseFloat(klinik.latitude),
          longitude: parseFloat(klinik.longitude)
        };
      });

    return res.status(200).json({
      status: true,
      message: 'Berhasil mendapatkan daftar klinik terdekat',
      data: formattedKlinik,
      meta: {
        total: formattedKlinik.length,
        radius: parseFloat(radius),
        lokasi_pengguna: {
          latitude: userLat,
          longitude: userLon
        }
      }
    });

  } catch (error) {
    console.error('Error in getKlinikTerdekat:', error);
    return res.status(500).json({
      status: false,
      message: 'Terjadi kesalahan pada server',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};