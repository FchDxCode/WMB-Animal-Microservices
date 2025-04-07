import { Klinik, LayananKlinik, JadwalBukaKlinik, GambarKlinik } from '../models/klinikModels.js';
import { Op } from 'sequelize';
import path from 'path';

/**
 * Menghitung jarak antara dua koordinat menggunakan rumus Haversine
 * @param {number} lat1 - Latitude titik 1
 * @param {number} lon1 - Longitude titik 1
 * @param {number} lat2 - Latitude titik 2
 * @param {number} lon2 - Longitude titik 2
 * @returns {number} Jarak dalam kilometer
 */
const hitungJarak = (lat1, lon1, lat2, lon2) => {
  // Konversi derajat ke radian
  const toRad = (nilai) => (nilai * Math.PI) / 180;
  
  // Radius bumi dalam kilometer
  const R = 6371;
  
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const jarak = R * c;
  
  // Kembalikan jarak dengan 1 angka desimal
  return parseFloat(jarak.toFixed(1));
};

/**
 * Mendapatkan daftar klinik dengan informasi jarak jika lokasi user tersedia
 * @route GET /api/klinik
 */
export const getKlinikList = async (req, res) => {
  try {
    // Parameter query
    const { 
      page = 1, 
      limit = 10, 
      search = '',
      lat, // Latitude user
      long // Longitude user
    } = req.query;
    
    const offset = (parseInt(page) - 1) * parseInt(limit);
    
    // Kondisi pencarian
    const whereCondition = {};
    if (search) {
      whereCondition.nama_klinik = {
        [Op.like]: `%${search}%`
      };
    }

    // Ambil data klinik
    const { count, rows: klinikList } = await Klinik.findAndCountAll({
      where: whereCondition,
      include: [
        {
          model: GambarKlinik,
          as: 'gambar',
          attributes: ['id', 'logo_klinik'],
          required: false
        },
        {
          model: JadwalBukaKlinik,
          as: 'jadwal_buka',
          attributes: ['hari', 'jam_mulai', 'jam_selesai'],
          required: false
        }
      ],
      order: [['nama_klinik', 'ASC']],
      limit: parseInt(limit),
      offset,
      distinct: true
    });

    // Jika tidak ada klinik ditemukan
    if (klinikList.length === 0) {
      return res.status(200).json({
        status: true,
        message: 'Belum ada data klinik tersedia',
        data: [],
        pagination: {
          total_data: 0,
          total_halaman: 0,
          halaman_aktif: parseInt(page),
          jumlah_per_halaman: parseInt(limit)
        }
      });
    }

    // Format data untuk response
    const formattedKlinik = klinikList.map(klinik => {
      // Proses logo klinik
      let logoUrl = null;
      if (klinik.gambar && klinik.gambar.length > 0) {
        for (const gambar of klinik.gambar) {
          if (gambar.logo_klinik) {
            const logoPath = gambar.logo_klinik;
            logoUrl = logoPath ? `/storage/klinik-images/${path.basename(logoPath)}` : null;
            break;
          }
        }
      }

      // Dapatkan jam operasional untuk hari ini
      const hariIni = new Date().toLocaleString('id-ID', { weekday: 'long' });
      let jamOperasional = 'Tutup';
      
      if (klinik.jadwal_buka && klinik.jadwal_buka.length > 0) {
        const jadwalHariIni = klinik.jadwal_buka.find(jadwal => 
          jadwal.hari.toLowerCase() === hariIni.toLowerCase()
        );
        
        if (jadwalHariIni) {
          const jamMulai = jadwalHariIni.jam_mulai;
          const jamSelesai = jadwalHariIni.jam_selesai;
          jamOperasional = `${jamMulai} - ${jamSelesai}`;
        }
      }

      // Hitung jarak jika koordinat user tersedia
      let jarak = null;
      if (lat && long && klinik.latitude && klinik.longitude) {
        jarak = hitungJarak(
          parseFloat(lat), 
          parseFloat(long), 
          parseFloat(klinik.latitude), 
          parseFloat(klinik.longitude)
        );
      }

      return {
        id: klinik.id,
        nama: klinik.nama_klinik,
        alamat: klinik.alamat_klinik,
        logo: logoUrl,
        jam_operasional: jamOperasional,
        jarak: jarak ? `${jarak} km` : 'Lokasi tidak tersedia'
      };
    });

    // Urutkan berdasarkan jarak jika koordinat user tersedia
    if (lat && long) {
      formattedKlinik.sort((a, b) => {
        const jarakA = parseFloat(a.jarak.split(' ')[0]);
        const jarakB = parseFloat(b.jarak.split(' ')[0]);
        return jarakA - jarakB;
      });
    }

    // Kirim response
    return res.status(200).json({
      status: true,
      message: 'Berhasil mengambil data klinik',
      data: formattedKlinik,
      pagination: {
        total_data: count,
        total_halaman: Math.ceil(count / parseInt(limit)),
        halaman_aktif: parseInt(page),
        jumlah_per_halaman: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error pada getKlinikList:', error);
    return res.status(500).json({
      status: false,
      message: 'Terjadi kesalahan saat mengambil data klinik',
      error: error.message
    });
  }
};

/**
 * Mendapatkan detail klinik berdasarkan ID
 * @route GET /api/klinik/:id
 */
export const getKlinikDetail = async (req, res) => {
  try {
    const { id } = req.params;
    const { lat, long } = req.query; // Koordinat user jika tersedia

    if (!id) {
      return res.status(400).json({
        status: false,
        message: 'ID klinik diperlukan',
      });
    }

    // Ambil data klinik dengan semua relasi
    const klinik = await Klinik.findOne({
      where: { id },
      include: [
        {
          model: GambarKlinik,
          as: 'gambar',
          attributes: ['id', 'thumbnail_klinik', 'logo_klinik'],
          required: false
        },
        {
          model: JadwalBukaKlinik,
          as: 'jadwal_buka',
          attributes: ['id', 'hari', 'jam_mulai', 'jam_selesai'],
          required: false
        },
        {
          model: LayananKlinik,
          as: 'layanan',
          attributes: ['id', 'nama_layanan', 'harga_layanan'],
          required: false
        }
      ]
    });

    if (!klinik) {
      return res.status(404).json({
        status: false,
        message: 'Klinik tidak ditemukan',
      });
    }

    // Proses gambar klinik
    let thumbnailUrl = null;
    let logoUrl = null;

    if (klinik.gambar && klinik.gambar.length > 0) {
      for (const gambar of klinik.gambar) {
        if (gambar.thumbnail_klinik) {
          const thumbnailPath = gambar.thumbnail_klinik;
          thumbnailUrl = thumbnailPath ? `/storage/klinik-images/${path.basename(thumbnailPath)}` : null;
        }
        if (gambar.logo_klinik) {
          const logoPath = gambar.logo_klinik;
          logoUrl = logoPath ? `/storage/klinik-images/${path.basename(logoPath)}` : null;
        }
      }
    }

    // Format jadwal buka
    const jadwalFormatted = [];
    const hariOrder = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];
    
    // Urutkan jadwal berdasarkan hari
    const jadwalSorted = [...klinik.jadwal_buka].sort((a, b) => {
      return hariOrder.indexOf(a.hari) - hariOrder.indexOf(b.hari);
    });

    // Format setiap jadwal
    jadwalSorted.forEach(jadwal => {
      jadwalFormatted.push({
        hari: jadwal.hari,
        jam: `${jadwal.jam_mulai} - ${jadwal.jam_selesai}`
      });
    });

    // Format layanan
    const layananFormatted = klinik.layanan.map(layanan => ({
      id: layanan.id,
      nama: layanan.nama_layanan,
      harga: layanan.harga_layanan ? `Rp ${parseFloat(layanan.harga_layanan).toLocaleString('id-ID')}` : 'Hubungi Klinik'
    }));

    // Hitung jarak jika koordinat user tersedia
    let jarak = null;
    if (lat && long && klinik.latitude && klinik.longitude) {
      jarak = hitungJarak(
        parseFloat(lat), 
        parseFloat(long), 
        parseFloat(klinik.latitude), 
        parseFloat(klinik.longitude)
      );
    }

    // Format data untuk response
    const klinikData = {
      id: klinik.id,
      nama: klinik.nama_klinik,
      deskripsi: klinik.deskripsi_klinik,
      alamat: klinik.alamat_klinik,
      no_telepon: klinik.no_tlpn_klinik,
      harga_konsultasi: klinik.harga_konsultasi ? `Rp ${parseFloat(klinik.harga_konsultasi).toLocaleString('id-ID')}` : 'Hubungi Klinik',
      thumbnail: thumbnailUrl,
      logo: logoUrl,
      jadwal_operasional: jadwalFormatted,
      layanan: layananFormatted,
      maps_embed: klinik.maps,
      jarak: jarak ? `${jarak} km` : 'Lokasi tidak tersedia',
      koordinat: {
        latitude: parseFloat(klinik.latitude),
        longitude: parseFloat(klinik.longitude)
      }
    };

    return res.status(200).json({
      status: true,
      message: 'Berhasil mengambil detail klinik',
      data: klinikData
    });
  } catch (error) {
    console.error('Error pada getKlinikDetail:', error);
    return res.status(500).json({
      status: false,
      message: 'Terjadi kesalahan saat mengambil detail klinik',
      error: error.message
    });
  }
};