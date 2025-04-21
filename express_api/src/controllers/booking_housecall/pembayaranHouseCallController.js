import { CheckoutHouseCall, PembayaranHouseCall } from '../../models/bookingHouseCallModels.js';
import { Klinik, GambarKlinik } from '../../models/klinikModels.js';
import { Payment } from '../../models/configPembayaranModels.js';
import { uploadBuktiTransfer, createBuktiTransferUrl } from '../../utils/uploadBuktiTransferUtils.js';
import sequelize from '../../config/db.js';
import { Op } from 'sequelize';
import { HistoryLayanan, StatusHistory } from '../../models/historyModels.js';
import { CoinHistory, TotalCoinUser } from '../../models/userCoinModels.js';
import { ConfigPembayaran } from '../../models/configPembayaranModels.js';
import { calculateCoin } from '../../utils/coinCalculatorUtils.js';
import { uploadFolders, createImageUrl } from '../../utils/uploadUtils.js';

// Controller untuk mendapatkan informasi pembayaran
export const getInformasiPembayaran = async (req, res) => {
  try {
    const userId = req.user.id;
    const { bookingId } = req.params;

    // Log untuk debugging
    console.log(`Fetching payment info for booking ID ${bookingId} by user ${userId}`);

    // Dapatkan data checkout
    const booking = await CheckoutHouseCall.findOne({
      where: { id: bookingId, user_id: userId },
      include: [
        { 
          model: Klinik, 
          as: 'klinik',
          attributes: ['nama_klinik', 'no_rekening_klinik'],
          include: [
            {
              model: GambarKlinik,
              as: 'gambar',
              attributes: ['logo_klinik', 'thumbnail_klinik']
            }
          ]
        },
        { 
          model: Payment, 
          as: 'payment',
          attributes: ['id', 'nama_metode', 'slug', 'gambar_payment']
        }
      ]
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking tidak ditemukan'
      });
    }

    // Cari data pembayaran terpisah (tidak menggunakan include)
    let paymentRecord = await PembayaranHouseCall.findOne({
      where: { house_call_checkout_id: bookingId },
      order: [['updated_at', 'DESC']] // Ambil yang paling baru diupdate
    });

    if (!paymentRecord) {
      console.log(`Creating new payment record for booking ID ${bookingId} in getInformasiPembayaran`);
      
      // Hitung koin yang didapat
      const configPembayaran = await ConfigPembayaran.findOne();
      const koinDidapat = configPembayaran ? 
        calculateCoin(booking.total_pesanan, configPembayaran.persentase_coin) : 0;
      
      // Set expired date (24 jam dari sekarang)
      const now = new Date();
      const expiredAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      
      // Buat record pembayaran
      paymentRecord = await PembayaranHouseCall.create({
        house_call_checkout_id: bookingId,
        status: 'belum-bayar',
        kategori_status_history_id: 1, // ID untuk status 'belum-bayar'
        koin_didapat: koinDidapat,
        expired_at: expiredAt
      });
      
      // Catat history
      await HistoryLayanan.create({
        pembayaran_house_call_id: paymentRecord.id,
        status_history_id: 1, // ID untuk status 'belum-bayar'
        user_id: userId,
        created_at: new Date()
      });
    }

    // Format response
    const infoPembayaran = {
      invoice: booking.invoice,
      status_pembayaran: paymentRecord.status,
      metode_pembayaran: booking.payment ? {
        id: booking.payment.id,
        nama: booking.payment.nama_metode,
        slug: booking.payment.slug,
        gambar: booking.payment.gambar_payment 
          ? createImageUrl(booking.payment.gambar_payment, uploadFolders.paymentImages)
          : null
      } : null,
      klinik: {
        nama: booking.klinik.nama_klinik,
        no_rekening: booking.klinik.no_rekening_klinik,
        logo: booking.klinik.gambar?.[0]?.logo_klinik 
          ? createImageUrl(booking.klinik.gambar[0].logo_klinik, uploadFolders.klinikImages)
          : null,
        thumbnail: booking.klinik.gambar?.[0]?.thumbnail_klinik 
          ? createImageUrl(booking.klinik.gambar[0].thumbnail_klinik, uploadFolders.klinikImages)
          : null
      },
      expired_at: paymentRecord.expired_at,
      bukti_pembayaran: paymentRecord.bukti_pembayaran 
        ? createBuktiTransferUrl(paymentRecord.bukti_pembayaran) 
        : null,
      total_pesanan: booking.total_pesanan,
      payment_id: paymentRecord.id,
      created_at: paymentRecord.created_at,
      updated_at: paymentRecord.updated_at,
      koin_didapat: paymentRecord.koin_didapat
    };

    return res.status(200).json({
      success: true,
      message: 'Informasi pembayaran berhasil diambil',
      data: infoPembayaran
    });
  } catch (error) {
    console.error('Error fetching payment information:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat mengambil informasi pembayaran',
      error: error.message
    });
  }
};

// Controller untuk upload bukti pembayaran
export const uploadBuktiPembayaran = async (req, res) => {
  try {
    const upload = uploadBuktiTransfer.single('bukti_pembayaran');
    
    upload(req, res, async function(err) {
      if (err) {
        return res.status(400).json({
          success: false,
          message: err.message
        });
      }
      
      const userId = req.user.id;
      const { bookingId } = req.params;
      
      // Log untuk debugging
      console.log(`Uploading payment proof for booking ID ${bookingId} by user ${userId}`);
      
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'File bukti pembayaran tidak ditemukan'
        });
      }
      
      // Dapatkan data booking
      const booking = await CheckoutHouseCall.findByPk(bookingId);
      
      if (!booking) {
        return res.status(404).json({
          success: false,
          message: 'Booking tidak ditemukan'
        });
      }
      
      // Verifikasi user_id
      if (parseInt(booking.user_id) !== parseInt(userId)) {
        return res.status(403).json({
          success: false,
          message: 'Anda tidak berhak mengakses booking ini'
        });
      }
      
      // Cari data pembayaran terbaru (jika ada)
      let pembayaran = await PembayaranHouseCall.findOne({
        where: { house_call_checkout_id: bookingId },
        order: [['updated_at', 'DESC']] // Ambil yang paling baru diupdate
      });
      
      // Jalankan transaksi
      await sequelize.transaction(async (t) => {
        // Jika tidak ada data pembayaran, buat baru
        if (!pembayaran) {
          console.log(`Creating new payment record for booking ID ${bookingId}`);
          
          // Hitung koin
          const configPembayaran = await ConfigPembayaran.findOne();
          const koinDidapat = configPembayaran ? 
            calculateCoin(booking.total_pesanan, configPembayaran.persentase_coin) : 0;
          
          // Set expired date
          const now = new Date();
          const expiredAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);
          
          // Buat data pembayaran
          pembayaran = await PembayaranHouseCall.create({
            house_call_checkout_id: booking.id,
            bukti_pembayaran: req.file.filename,
            status: 'diproses',
            kategori_status_history_id: 2,
            koin_didapat: koinDidapat,
            expired_at: expiredAt
          }, { transaction: t });
        } else {
          // Update pembayaran yang sudah ada
          await pembayaran.update({
            bukti_pembayaran: req.file.filename,
            status: 'diproses',
            kategori_status_history_id: 2
          }, { transaction: t });
        }
        
        // Catat history
        await HistoryLayanan.create({
          pembayaran_house_call_id: pembayaran.id,
          status_history_id: 2, // ID untuk status 'diproses'
          user_id: userId,
          created_at: new Date()
        }, { transaction: t });
      });
      
      return res.status(200).json({
        success: true,
        message: 'Bukti pembayaran berhasil diupload',
        data: {
          bukti_pembayaran: createBuktiTransferUrl(req.file.filename),
          status: 'diproses'
        }
      });
    });
  } catch (error) {
    console.error('Error uploading payment proof:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat mengupload bukti pembayaran',
      error: error.message
    });
  }
};

// Cek dan update pembayaran yang expired (untuk scheduler)
export const checkExpiredHouseCallPayments = async () => {
  try {
    console.log('Running house call payment expiration checker...');
    
    const now = new Date();
    
    // Cari pembayaran yang expired (past expired_at date) dan masih 'belum-bayar'
    const expiredPayments = await PembayaranHouseCall.findAll({
      where: {
        status: 'belum-bayar',
        expired_at: {
          [Op.lt]: now
        }
      },
      include: [{ model: CheckoutHouseCall }]
    });
    
    console.log(`Found ${expiredPayments.length} expired house call payments`);
    
    // Update status menjadi 'tertunda'
    for (const payment of expiredPayments) {
      try {
        await sequelize.transaction(async (t) => {
          await payment.update({
            status: 'tertunda',
            kategori_status_history_id: 4 // ID untuk status 'tertunda'
          }, { transaction: t });
          
          // Catat history
          if (payment.CheckoutHouseCall && payment.CheckoutHouseCall.user_id) {
            await HistoryLayanan.create({
              pembayaran_house_call_id: payment.id,
              status_history_id: 4, // ID untuk status 'tertunda'
              user_id: payment.CheckoutHouseCall.user_id,
              created_at: new Date()
            }, { transaction: t });
          }
        });
        
        console.log(`Payment ID ${payment.id} marked as tertunda`);
      } catch (error) {
        console.error(`Error updating payment ID ${payment.id}:`, error);
      }
    }
    
    console.log('House call payment expiration check completed');
    return expiredPayments.length;
  } catch (error) {
    console.error('Error in checkExpiredHouseCallPayments:', error);
    throw error;
  }
};

// Controller untuk admin update status pembayaran
export const updateStatusPembayaran = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { status, kategori_status_history_id, keterangan } = req.body;
    const adminId = req.user.id;

    // Cek apakah admin memiliki hak akses
    // Ini bisa disesuaikan dengan middleware atau logika lain untuk validasi admin
    
    // Dapatkan data pembayaran dengan query eagerly-loaded
    const pembayaran = await PembayaranHouseCall.findOne({
      where: { house_call_checkout_id: bookingId },
      order: [['updated_at', 'DESC']]
    });

    if (!pembayaran) {
      return res.status(404).json({
        success: false,
        message: 'Pembayaran tidak ditemukan'
      });
    }

    // Dapatkan checkout terpisah agar lebih reliable
    const checkout = await CheckoutHouseCall.findByPk(bookingId, {
      include: [{ model: Klinik, as: 'klinik' }]
    });

    if (!checkout) {
      return res.status(404).json({
        success: false,
        message: 'Checkout tidak ditemukan'
      });
    }

    // Jalankan dalam transaksi
    await sequelize.transaction(async (t) => {
      // Update status pembayaran
      await pembayaran.update({
        status,
        kategori_status_history_id
      }, { transaction: t });

      // Buat history
      await HistoryLayanan.create({
        pembayaran_house_call_id: pembayaran.id,
        status_history_id: kategori_status_history_id,
        user_id: checkout.user_id, // Gunakan user_id dari checkout
        created_at: new Date()
      }, { transaction: t });

      // Jika status 'selesai', berikan coin ke user
      if (status === 'selesai') {
        const userId = checkout.user_id; // Gunakan user_id dari checkout
        const koinDidapat = pembayaran.koin_didapat;

        // Update total coin user
        const totalCoin = await TotalCoinUser.findOne({ 
          where: { user_id: userId },
          transaction: t
        });

        if (totalCoin) {
          await totalCoin.update({
            total_coin: totalCoin.total_coin + koinDidapat
          }, { transaction: t });
        } else {
          await TotalCoinUser.create({
            user_id: userId,
            total_coin: koinDidapat
          }, { transaction: t });
        }

        // Buat history coin
        await CoinHistory.create({
          user_id: userId,
          pembayaran_house_call_id: pembayaran.id,
          coin_di_dapat: koinDidapat,
          tanggal_dapat: new Date(),
          keterangan: `Coin dari booking house call ke ${checkout.klinik ? checkout.klinik.nama_klinik : 'Klinik'}`
        }, { transaction: t });
      }
    });

    return res.status(200).json({
      success: true,
      message: `Status pembayaran berhasil diubah menjadi ${status}`
    });
  } catch (error) {
    console.error('Error updating payment status:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat mengubah status pembayaran',
      error: error.message
    });
  }
};