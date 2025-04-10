// controllers/booking_klinik/PesananController.js
import { CheckoutBookingKlinik, BookingKlinik, PembayaranKlinik } from '../../models/bookingKlinikModels.js';
import { Klinik, LayananKlinik } from '../../models/klinikModels.js';
import { Keluhan } from '../../models/keluhanModels.js';
import { HewanPeliharaan } from '../../models/petModels.js';
import { ConfigPembayaran } from '../../models/configPembayaranModels.js';
import { calculateCoin } from '../../utils/coinCalculatorUtils.js';
import { config } from 'dotenv';
import { uploadFolders, createImageUrl } from '../../utils/uploadUtils.js';
import { StatusHistory, HistoryLayanan } from '../../models/historyModels.js';
import sequelize from '../../config/db.js';

/**
 * Controller untuk mendapatkan detail pesanan
 */
export const getDetailPesanan = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { id } = req.params; // ID checkout
    const user_id = req.user.id;

    // Dapatkan data checkout
    const checkout = await CheckoutBookingKlinik.findByPk(id, {
      include: [
        { model: BookingKlinik, as: 'booking', include: [{ model: Klinik, as: 'klinik' }] }
      ],
      transaction
    });

    if (!checkout) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Pesanan tidak ditemukan'
      });
    }

    // Verifikasi pesanan milik user yang sedang login
    if (checkout.booking.user_id !== user_id) {
      await transaction.rollback();
      return res.status(403).json({
        success: false,
        message: 'Anda tidak berhak mengakses pesanan ini'
      });
    }

    // Dapatkan keluhan
    const keluhan = await Keluhan.findByPk(checkout.keluhan_id, { transaction });
    if (!keluhan) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Keluhan tidak ditemukan'
      });
    }

    // Dapatkan hewan peliharaan
    const hewan = await HewanPeliharaan.findByPk(keluhan.hewan_peliharaan_id, {
      include: [{ association: 'gambar' }],
      transaction
    });

    if (!hewan) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Hewan peliharaan tidak ditemukan'
      });
    }

    // Dapatkan layanan
    const layanan = await LayananKlinik.findByPk(checkout.booking.layanan_klinik_id, { transaction });

    // Cek apakah sudah ada pembayaran
    let pembayaran = await PembayaranKlinik.findOne({
      where: { checkout_booking_klinik_id: checkout.id },
      transaction
    });

    // Jika ada pembayaran, cek apakah sudah expired
    let isExpired = false;
    let status_pesanan = 'belum_dibayar';
    
    if (pembayaran) {
      // Fungsi untuk cek expired (> 24 jam)
      const isPaymentExpired = (createdAt) => {
        const now = new Date();
        const paymentDate = new Date(createdAt);
        const diffHours = (now - paymentDate) / (1000 * 60 * 60);
        return diffHours > 24;
      };
      
      isExpired = isPaymentExpired(pembayaran.created_at);
      status_pesanan = pembayaran.status;
      
      // Jika expired dan status masih tertunda, update ke dibatalkan
      if (isExpired && pembayaran.status === 'tertunda') {
        // Dapatkan status history untuk dibatalkan
        const cancelledStatus = await StatusHistory.findOne({
          where: { slug: 'dibatalkan' },
          transaction
        });
        
        if (cancelledStatus) {
          // Update status pembayaran
          await pembayaran.update({
            status: 'dibatalkan',
            kategori_status_history_id: cancelledStatus.id
          }, { transaction });
          
          // Update history layanan
          const historyLayanan = await HistoryLayanan.findOne({
            where: { pembayaran_klinik_id: pembayaran.id },
            transaction
          });
          
          if (historyLayanan) {
            await historyLayanan.update({
              status_history_id: cancelledStatus.id
            }, { transaction });
          } else {
            // Buat history baru jika belum ada
            await HistoryLayanan.create({
              pembayaran_klinik_id: pembayaran.id,
              status_history_id: cancelledStatus.id,
              user_id: user_id
            }, { transaction });
          }
          
          status_pesanan = 'dibatalkan';
        }
      }
    }

    // Hitung total biaya dan koin
    let totalBiaya = 0;
    let biayaBookingValue = 0;
    let persentaseCoinValue = 0;
    const configPembayaran = await ConfigPembayaran.findOne({ transaction });

    if (configPembayaran) {
      biayaBookingValue = parseFloat(configPembayaran.biaya_booking || 0);
      persentaseCoinValue = parseFloat(configPembayaran.persentase_coin || 0);
    }

    if (layanan) {
      totalBiaya = parseFloat(layanan.harga_layanan || 0) + biayaBookingValue;
    } else {
      totalBiaya = biayaBookingValue;
    }

    const koinDidapat = calculateCoin(totalBiaya, persentaseCoinValue);

    // Commit transaction karena semua operasi sudah berhasil
    await transaction.commit();

    // Informasi expired untuk UI
    const expiredAt = pembayaran ? 
      new Date(new Date(pembayaran.created_at).getTime() + 24 * 60 * 60 * 1000) : null;
    const remainingTime = pembayaran && !isExpired ? 
      Math.max(0, (expiredAt - new Date()) / 1000) : 0; // remaining time in seconds

    return res.status(200).json({
      success: true,
      data: {
        id: checkout.id,
        status_pesanan: status_pesanan,
        invoice: checkout.invoice,
        tanggal_pembelian: checkout.tanggal_checkout_booking_klinik,
        payment_info: pembayaran ? {
          payment_id: pembayaran.id,
          is_expired: isExpired,
          expired_at: expiredAt,
          remaining_time: remainingTime,
          can_upload: pembayaran.status === 'tertunda' && !isExpired,
          bukti_pembayaran: pembayaran.bukti_pembayaran
        } : null,
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
          biaya_booking: biayaBookingValue,
          total_biaya: totalBiaya,
          koin_didapat: koinDidapat
        }
      }
    });
  } catch (error) {
    // Rollback transaction jika terjadi error
    await transaction.rollback();
    console.error('Error in getDetailPesanan:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat mengambil detail pesanan',
      error: error.message
    });
  }
};

