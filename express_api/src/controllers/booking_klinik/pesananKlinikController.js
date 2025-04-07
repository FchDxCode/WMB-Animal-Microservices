// controllers/booking_klinik/PesananController.js
import { CheckoutBookingKlinik, BookingKlinik, PembayaranKlinik } from '../../models/bookingKlinikModels.js';
import { Klinik, LayananKlinik } from '../../models/klinikModels.js';
import { Keluhan } from '../../models/keluhanModels.js';
import { HewanPeliharaan } from '../../models/petModels.js';
import { ConfigPembayaran } from '../../models/configPembayaranModels.js';
import { calculateCoin } from '../../utils/coinCalculatorUtils.js';
import { config } from 'dotenv';
import { uploadFolders, createImageUrl } from '../../utils/uploadUtils.js';

/**
 * Controller untuk mendapatkan detail pesanan
 */
export const getDetailPesanan = async (req, res) => {
  try {
    const { id } = req.params; // ID checkout
    const user_id = req.user.id;

    // Dapatkan data checkout
    const checkout = await CheckoutBookingKlinik.findByPk(id, {
      include: [
        { model: BookingKlinik, as: 'booking', include: [{ model: Klinik, as: 'klinik' }] }
      ]
    });

    if (!checkout) {
      return res.status(404).json({
        success: false,
        message: 'Pesanan tidak ditemukan'
      });
    }

    // Verifikasi pesanan milik user yang sedang login
    if (checkout.booking.user_id !== user_id) {
      return res.status(403).json({
        success: false,
        message: 'Anda tidak berhak mengakses pesanan ini'
      });
    }

    // Dapatkan keluhan
    const keluhan = await Keluhan.findByPk(checkout.keluhan_id);
    if (!keluhan) {
      return res.status(404).json({
        success: false,
        message: 'Keluhan tidak ditemukan'
      });
    }

    // Dapatkan hewan peliharaan
    const hewan = await HewanPeliharaan.findByPk(keluhan.hewan_peliharaan_id, {
      include: [{ association: 'gambar' }]
    });

    if (!hewan) {
      return res.status(404).json({
        success: false,
        message: 'Hewan peliharaan tidak ditemukan'
      });
    }

    // Dapatkan layanan
    const layanan = await LayananKlinik.findByPk(checkout.booking.layanan_klinik_id);

    // Cek apakah sudah ada pembayaran
    let pembayaran = await PembayaranKlinik.findOne({
      where: { checkout_booking_klinik_id: checkout.id }
    });

    let totalBiaya = 0;
    let biayaBookingValue = 0;
    let persentaseCoinValue = 0; // Tambahkan variabel untuk persentase koin
    const configPembayaran = await ConfigPembayaran.findOne(); // Mengambil satu baris dari tabel ConfigPembayaran

    if (configPembayaran) {
      biayaBookingValue = parseFloat(configPembayaran.biaya_booking || 0);
      persentaseCoinValue = parseFloat(configPembayaran.persentase_coin || 0); // Ambil persentase koin
    }

    if (layanan) {
      totalBiaya = parseFloat(layanan.harga_layanan || 0) + biayaBookingValue;
    } else {
      totalBiaya = biayaBookingValue;
    }

    // Hitung koin yang akan didapat
    const koinDidapat = calculateCoin(totalBiaya, persentaseCoinValue); // Kirim persentase koin

    return res.status(200).json({
      success: true,
      data: {
        id: checkout.id,
        status_pesanan: pembayaran ? pembayaran.status : 'belum_dibayar',
        invoice: checkout.invoice,
        tanggal_pembelian: checkout.tanggal_checkout_booking_klinik,
        informasi_booking: {
          tipe_booking: checkout.booking.tipe_booking,
          nama_klinik: checkout.booking.klinik.nama_klinik,
          alamat_klinik: checkout.booking.klinik.alamat_klinik,
          tanggal_booking: checkout.booking.tanggal_booking,
          waktu_booking: checkout.booking.waktu_booking
        },
        informasi_hewan: {
          id: hewan.id,
          nama_hewan: hewan.nama_hewan,
          jenis_hewan_id: hewan.jenis_hewan_id,
          jenis_kelamin: hewan.jenis_kelamin,
          tanggal_lahir: hewan.tanggal_lahir_hewan,
          berat_badan: hewan.berat_badan,
          profile_hewan: hewan.gambar && hewan.gambar.length > 0 ? createImageUrl(hewan.gambar[0].profile_hewan, uploadFolders.petImages) : null,
          keluhan: keluhan.keluhan
        },
        metode_pembayaran: pembayaran ? pembayaran.metode_pembayaran : null,
        rincian_pesanan: {
          nama_layanan: layanan ? layanan.nama_layanan : 'Layanan Tidak Tersedia',
          harga_layanan: layanan ? layanan.harga_layanan : 0,
          biaya_booking: biayaBookingValue, // Gunakan nilai biaya booking dari config
          total_biaya: totalBiaya,
          koin_didapat: koinDidapat
        }
      }
    });
  } catch (error) {
    console.error('Error in getDetailPesanan:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat mengambil detail pesanan',
      error: error.message
    });
  }
};

