// controllers/booking_klinik/pembayaranKlinikController.js
import { CheckoutBookingKlinik, BookingKlinik, PembayaranKlinik } from '../../models/bookingKlinikModels.js';
import { Klinik, LayananKlinik } from '../../models/klinikModels.js';
import { calculateCoin } from '../../utils/coinCalculatorUtils.js';
import { uploadBuktiTransfer, createBuktiTransferUrl } from '../../utils/uploadBuktiTransferUtils.js';
import { StatusHistory } from '../../models/historyModels.js';
import { ConfigPembayaran } from '../../models/configPembayaranModels.js'; 
import { CoinService } from '../../services/coin/coinServices.js';
import { HistoryLayanan } from '../../models/historyModels.js';
import sequelize from '../../config/db.js';
import { TotalCoinUser, CoinHistory } from '../../models/userCoinModels.js';

// Tambahkan utility function untuk cek expired
const isPaymentExpired = (createdAt) => {
  const now = new Date();
  const paymentDate = new Date(createdAt);
  const diffHours = (now - paymentDate) / (1000 * 60 * 60); 
  return diffHours > 24;
};

/**
 * Controller untuk membuat pembayaran
 */
export const createPembayaran = async (req, res) => {
  try {
    const { checkout_id, metode_pembayaran } = req.body;
    const user_id = req.user.id;

    // Validasi input
    if (!checkout_id || !metode_pembayaran) {
      return res.status(400).json({
        success: false,
        message: 'Checkout ID dan metode pembayaran harus diisi'
      });
    }

    // Dapatkan data checkout
    const checkout = await CheckoutBookingKlinik.findByPk(checkout_id, {
      include: [
        { model: BookingKlinik, as: 'booking', include: [{ model: Klinik, as: 'klinik' }] }
      ]
    });

    if (!checkout) {
      return res.status(404).json({
        success: false,
        message: 'Checkout tidak ditemukan'
      });
    }

    // Verifikasi checkout milik user yang sedang login
    if (checkout.booking.user_id !== user_id) {
      return res.status(403).json({
        success: false,
        message: 'Anda tidak berhak mengakses checkout ini'
      });
    }

    // Cek apakah sudah ada pembayaran
    const existingPembayaran = await PembayaranKlinik.findOne({
      where: { checkout_booking_klinik_id: checkout_id }
    });

    if (existingPembayaran) {
      return res.status(400).json({
        success: false,
        message: 'Pembayaran untuk checkout ini sudah ada'
      });
    }

    // Dapatkan status history default menggunakan slug
    const defaultStatusHistory = await StatusHistory.findOne({
      where: { slug: 'belum-bayar' }
    });

    if (!defaultStatusHistory) {
      return res.status(404).json({
        success: false,
        message: 'Status history default tidak ditemukan'
      });
    }

    // Dapatkan layanan untuk menghitung total biaya
    const layanan = await LayananKlinik.findByPk(checkout.booking.layanan_klinik_id);

    let totalBiaya = 0;
    let biayaBookingValue = 0;
    let persentaseCoinValue = 0; 

    // Ambil konfigurasi pembayaran untuk mendapatkan biaya booking dan persentase koin
    const configPembayaran = await ConfigPembayaran.findOne();

    if (configPembayaran) {
      biayaBookingValue = parseFloat(configPembayaran.biaya_booking || 0);
      persentaseCoinValue = parseFloat(configPembayaran.persentase_coin || 0); 
    }

    if (layanan) {
      totalBiaya = parseFloat(layanan.harga_layanan || 0) + biayaBookingValue;
    } else {
      totalBiaya = biayaBookingValue;
    }

    // Hitung koin yang akan didapat
    const koinDidapat = calculateCoin(totalBiaya, persentaseCoinValue); 

    // Buat pembayaran baru
    const pembayaran = await PembayaranKlinik.create({
      checkout_booking_klinik_id: checkout_id,
      payment_id: metode_pembayaran, // Ubah dari metode_pembayaran menjadi payment_id
      total_biaya: totalBiaya,
      status: 'tertunda', // Default status
      kategori_status_history_id: defaultStatusHistory.id, // Gunakan ID dari status history
      koin_didapat: koinDidapat
    });

    return res.status(201).json({
      success: true,
      message: 'Pembayaran berhasil dibuat',
      data: {
        id: pembayaran.id,
        checkout_id: pembayaran.checkout_booking_klinik_id,
        metode_pembayaran: pembayaran.payment_id, // Ubah dari metode_pembayaran menjadi payment_id
        total_biaya: pembayaran.total_biaya,
        status: pembayaran.status,
        koin_didapat: pembayaran.koin_didapat,
        no_rekening_klinik: checkout.booking.klinik.no_rekening_klinik,
        invoice: checkout.invoice,
        // Info untuk expired payment
        expired_at: new Date(new Date().getTime() + 24 * 60 * 60 * 1000) 
      }
    });
  } catch (error) {
    console.error('Error in createPembayaran:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat membuat pembayaran',
      error: error.message
    });
  }
};

/**
 * Controller untuk upload bukti transfer
 */
export const uploadBuktiTransferHandler = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const { id } = req.params;
    const user_id = req.user.id;

    // Dapatkan data pembayaran
    const pembayaran = await PembayaranKlinik.findByPk(id, {
      include: [
        {
          model: CheckoutBookingKlinik,
          as: 'checkout',
          include: [{ model: BookingKlinik, as: 'booking' }]
        }
      ],
      transaction
    });

    if (!pembayaran) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Pembayaran tidak ditemukan'
      });
    }

    // Verifikasi pembayaran milik user yang sedang login
    if (pembayaran.checkout.booking.user_id !== user_id) {
      await transaction.rollback();
      return res.status(403).json({
        success: false,
        message: 'Anda tidak berhak mengakses pembayaran ini'
      });
    }

    // Cek apakah pembayaran sudah expired atau dibatalkan
    if (isPaymentExpired(pembayaran.created_at) || pembayaran.status === 'dibatalkan') {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Pembayaran sudah expired atau dibatalkan. Silahkan lakukan checkout ulang.'
      });
    }

    // Cek apakah file bukti transfer sudah diupload via middleware
    if (!req.file) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Bukti transfer harus diupload'
      });
    }

    // Buat URL bukti transfer
    const buktiTransferUrl = createBuktiTransferUrl(req.file.filename);

    // Update pembayaran dengan bukti transfer
    await pembayaran.update({
      bukti_pembayaran: buktiTransferUrl
    }, { transaction });

    // Commit transaction
    await transaction.commit();

    return res.status(200).json({
      success: true,
      message: 'Bukti transfer berhasil diupload',
      data: {
        id: pembayaran.id,
        bukti_pembayaran: buktiTransferUrl,
        status: pembayaran.status
      }
    });
  } catch (error) {
    await transaction.rollback();
    console.error('Error in uploadBuktiTransferHandler:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat upload bukti transfer',
      error: error.message
    });
  }
};

/**
 * Controller untuk mendapatkan detail pembayaran
 */
export const getPembayaranDetail = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const { id } = req.params; 
    const user_id = req.user.id;

    // Dapatkan data pembayaran
    const pembayaran = await PembayaranKlinik.findByPk(id, {
      include: [
        {
          model: CheckoutBookingKlinik,
          as: 'checkout',
          include: [
            {
              model: BookingKlinik,
              as: 'booking',
              include: [
                { model: Klinik, as: 'klinik' }
              ]
            }
          ]
        }
      ],
      transaction
    });

    if (!pembayaran) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Pembayaran tidak ditemukan'
      });
    }

    // Verifikasi pembayaran milik user yang sedang login
    if (pembayaran.checkout.booking.user_id !== user_id) {
      await transaction.rollback();
      return res.status(403).json({
        success: false,
        message: 'Anda tidak berhak mengakses pembayaran ini'
      });
    }

    // Cek expired dan update status jika perlu
    const isExpired = isPaymentExpired(pembayaran.created_at);
    let statusUpdated = false;

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
        
        statusUpdated = true;
      }
    }

    // Dapatkan status history yang terkait dengan pembayaran
    // Jika status baru saja diupdate, gunakan cancelledStatus
    const statusHistory = statusUpdated ? 
      await StatusHistory.findOne({ where: { slug: 'dibatalkan' }, transaction }) : 
      await StatusHistory.findByPk(pembayaran.kategori_status_history_id, { transaction });

    if (!statusHistory) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Status history tidak ditemukan'
      });
    }

    // Dapatkan layanan secara terpisah
    const layanan = await LayananKlinik.findByPk(pembayaran.checkout.booking.layanan_klinik_id, { transaction });

    let totalBiaya = 0;
    let biayaBookingValue = 0;
    let persentaseCoinValue = 0;

    // Ambil konfigurasi pembayaran untuk mendapatkan biaya booking dan persentase koin
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

    // Hitung koin yang akan didapat
    const koinDidapat = calculateCoin(totalBiaya, persentaseCoinValue);

    // Informasi expired untuk UI
    const expiredAt = new Date(new Date(pembayaran.created_at).getTime() + 24 * 60 * 60 * 1000);
    const remainingTime = !isExpired ? Math.max(0, (expiredAt - new Date()) / 1000) : 0; // seconds

    // Commit transaction
    await transaction.commit();

    // Buat response
    // In the getPembayaranDetail method, update the response:
    return res.status(200).json({
      success: true,
      data: {
        id: pembayaran.id,
        metode_pembayaran: pembayaran.payment_id, // Changed from metode_pembayaran to payment_id
        total_biaya: pembayaran.total_biaya,
        status: statusUpdated ? 'dibatalkan' : pembayaran.status,
        status_history: statusHistory.slug,
        bukti_pembayaran: pembayaran.bukti_pembayaran,
        koin_didapat: koinDidapat,
        created_at: pembayaran.created_at,
        updated_at: pembayaran.updated_at,
        invoice: pembayaran.checkout.invoice,
        no_rekening_klinik: pembayaran.checkout.booking.klinik.no_rekening_klinik,
        // Info untuk expired payment
        payment_info: {
          is_expired: isExpired,
          expired_at: expiredAt,
          remaining_time: remainingTime,
          can_upload: pembayaran.status === 'tertunda' && !isExpired
        }
      }
    });
  } catch (error) {
    await transaction.rollback();
    console.error('Error in getPembayaranDetail:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat mengambil detail pembayaran',
      error: error.message
    });
  }
};

/**
 * Controller untuk update status pembayaran
 */
export const updateStatusPembayaran = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { id } = req.params;
    const { status, kategori_status_history_id } = req.body;
    
    // Dapatkan data pembayaran
    const pembayaran = await PembayaranKlinik.findByPk(id, {
      include: [
        {
          model: CheckoutBookingKlinik,
          as: 'checkout',
          include: [{ model: BookingKlinik, as: 'booking' }]
        }
      ],
      transaction
    });
    
    if (!pembayaran) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Pembayaran tidak ditemukan'
      });
    }
    
    // Dapatkan status history berdasarkan ID
    const statusHistory = await StatusHistory.findByPk(kategori_status_history_id, {
      transaction
    });
    
    if (!statusHistory) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Status history tidak ditemukan'
      });
    }

    // Cek status sebelumnya untuk menghindari pemberian koin duplikat
    const statusSebelumnya = pembayaran.status;
    
    // Update status pembayaran
    await pembayaran.update({
      status,
      kategori_status_history_id
    }, { transaction });
    
    // Jika status berubah menjadi 'selesai' dan sebelumnya bukan 'selesai'
    if (status === 'selesai' && statusSebelumnya !== 'selesai') {
      const userId = pembayaran.checkout.booking.user_id;
      const coinAmount = pembayaran.koin_didapat;
      
      try {
        // Tambahkan koin ke akun user menggunakan service
        await CoinService.addCoinsAfterPayment(userId, coinAmount, {
          id: pembayaran.id,
          type: 'klinik'
        }, transaction);
      } catch (coinError) {
        console.error('Error adding coins:', coinError);
        // Kita tidak ingin gagal update status jika penambahan koin gagal
        // Tapi tetap log error untuk investigasi lebih lanjut
      }
    }
    
    await transaction.commit();
    
    return res.status(200).json({
      success: true,
      message: 'Status pembayaran berhasil diupdate',
      data: {
        id: pembayaran.id,
        status: status,
        kategori_status_history_id: kategori_status_history_id,
        status_history_slug: statusHistory.slug // Tetap kirim slug untuk informasi
      }
    });
  } catch (error) {
    await transaction.rollback();
    console.error('Error in updateStatusPembayaran:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat update status pembayaran',
      error: error.message
    });
  }
};

/**
 * Controller untuk admin mengupdate status pembayaran
 */
export const adminUpdateStatusPembayaran = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const { id } = req.params;
    const { status, kategori_status_history_id } = req.body;
    
    // Dapatkan data pembayaran dengan relasi
    const pembayaran = await PembayaranKlinik.findByPk(id, {
      include: [
        {
          model: CheckoutBookingKlinik,
          as: 'checkout',
          include: [
            { 
              model: BookingKlinik, 
              as: 'booking',
              include: [{ model: Klinik, as: 'klinik' }]
            }
          ]
        }
      ],
      transaction
    });
    
    if (!pembayaran) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Pembayaran tidak ditemukan'
      });
    }

    // Cek apakah pembayaran sudah expired
    if (isPaymentExpired(pembayaran.created_at) && status !== 'dibatalkan') {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Pembayaran sudah expired dan hanya bisa dibatalkan'
      });
    }

    // Dapatkan status history berdasarkan ID
    const statusHistory = await StatusHistory.findByPk(kategori_status_history_id, {
      transaction
    });
    
    if (!statusHistory) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Status history tidak ditemukan'
      });
    }

    // Cek status sebelumnya untuk menghindari pemberian koin duplikat
    const statusSebelumnya = pembayaran.status;
    
    // Update status pembayaran
    await pembayaran.update({
      status,
      kategori_status_history_id
    }, { transaction });

    // Update status di history_layanan
    const historyLayanan = await HistoryLayanan.findOne({
      where: {
        pembayaran_klinik_id: id
      },
      transaction
    });

    if (historyLayanan) {
      await historyLayanan.update({
        status_history_id: kategori_status_history_id
      }, { transaction });
    } else {
      // Jika belum ada record di history_layanan, buat baru
      await HistoryLayanan.create({
        pembayaran_klinik_id: id,
        status_history_id: kategori_status_history_id,
        user_id: pembayaran.checkout.booking.user_id
      }, { transaction });
    }

    // Jika status berubah menjadi 'selesai' dan sebelumnya bukan 'selesai'
    if (status === 'selesai' && statusSebelumnya !== 'selesai') {
      const userId = pembayaran.checkout.booking.user_id;
      
      // Ambil config pembayaran untuk persentase coin
      const configPembayaran = await ConfigPembayaran.findOne({ transaction });
      
      if (!configPembayaran) {
        await transaction.rollback();
        return res.status(404).json({
          success: false,
          message: 'Konfigurasi pembayaran tidak ditemukan'
        });
      }

      // Hitung ulang coin berdasarkan total biaya dan persentase
      const totalBiaya = parseFloat(pembayaran.total_biaya);
      const persentaseCoin = parseFloat(configPembayaran.persentase_coin);
      const coinAmount = calculateCoin(totalBiaya, persentaseCoin);

      console.log('Debug Coin Calculation:', {
        totalBiaya,
        persentaseCoin,
        calculatedCoin: coinAmount,
        storedCoin: pembayaran.koin_didapat
      });

      // Pastikan user_id dan coinAmount valid
      if (userId && coinAmount && coinAmount > 0) {
        try {
          // Update atau buat total coin user
          let totalCoinUser = await TotalCoinUser.findOne({
            where: { user_id: userId },
            transaction
          });

          if (totalCoinUser) {
            await totalCoinUser.update({
              total_coin: sequelize.literal(`total_coin + ${coinAmount}`)
            }, { transaction });
          } else {
            await TotalCoinUser.create({
              user_id: userId,
              total_coin: coinAmount
            }, { transaction });
          }

          // Catat di coin history
          await CoinHistory.create({
            user_id: userId,
            pembayaran_klinik_id: pembayaran.id,
            coin_di_dapat: coinAmount,
            tanggal_diperoleh: new Date(),
            coin_di_gunakan: 0
          }, { transaction });

          // Update koin_didapat di pembayaran
          await pembayaran.update({
            koin_didapat: coinAmount
          }, { transaction });

          console.log('Coin berhasil ditambahkan:', {
            userId,
            coinAmount,
            pembayaranId: pembayaran.id
          });
        } catch (coinError) {
          console.error('Error saat menambahkan coin:', coinError);
          await transaction.rollback();
          return res.status(500).json({
            success: false,
            message: 'Terjadi kesalahan saat menambahkan coin',
            error: coinError.message
          });
        }
      } else {
        console.warn('Coin tidak ditambahkan karena data tidak valid:', {
          userId,
          coinAmount,
          pembayaranId: pembayaran.id
        });
      }
    }

    // Ambil data terbaru untuk response
    const updatedPembayaran = await PembayaranKlinik.findByPk(id, {
      include: [
        {
          model: CheckoutBookingKlinik,
          as: 'checkout',
          include: [
            { 
              model: BookingKlinik, 
              as: 'booking',
              include: [{ model: Klinik, as: 'klinik' }]
            }
          ]
        }
      ],
      transaction
    });

    await transaction.commit();
    
    return res.status(200).json({
      success: true,
      message: 'Status pembayaran dan history berhasil diupdate',
      data: {
        id: updatedPembayaran.id,
        metode_pembayaran: updatedPembayaran.payment_id,
        total_biaya: updatedPembayaran.total_biaya,
        status: updatedPembayaran.status,
        kategori_status_history_id: kategori_status_history_id,
        status_history_slug: statusHistory.slug,
        bukti_pembayaran: updatedPembayaran.bukti_pembayaran,
        koin_didapat: updatedPembayaran.koin_didapat,
        created_at: updatedPembayaran.created_at,
        updated_at: updatedPembayaran.updated_at,
        checkout: {
          invoice: updatedPembayaran.checkout.invoice,
          booking: {
            klinik: {
              no_rekening_klinik: updatedPembayaran.checkout.booking.klinik.no_rekening_klinik
            }
          }
        }
      }
    });
  } catch (error) {
    await transaction.rollback();
    console.error('Error in adminUpdateStatusPembayaran:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat update status pembayaran',
      error: error.message
    });
  }
};

// Tambahkan endpoint untuk mengecek status expired
export const checkPaymentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const user_id = req.user.id;

    const pembayaran = await PembayaranKlinik.findByPk(id, {
      include: [
        {
          model: CheckoutBookingKlinik,
          as: 'checkout',
          include: [{ model: BookingKlinik, as: 'booking' }]
        }
      ]
    });

    if (!pembayaran) {
      return res.status(404).json({
        success: false,
        message: 'Pembayaran tidak ditemukan'
      });
    }

    // Verifikasi pembayaran milik user yang sedang login
    if (pembayaran.checkout.booking.user_id !== user_id) {
      return res.status(403).json({
        success: false,
        message: 'Anda tidak berhak mengakses pembayaran ini'
      });
    }

    const isExpired = isPaymentExpired(pembayaran.created_at);
    const expiredAt = new Date(new Date(pembayaran.created_at).getTime() + 24 * 60 * 60 * 1000);

    return res.status(200).json({
      success: true,
      data: {
        payment_id: pembayaran.id,
        status: pembayaran.status,
        is_expired: isExpired,
        expired_at: expiredAt,
        remaining_time: isExpired ? 0 : (expiredAt - new Date()) / 1000 // remaining time in seconds
      }
    });

  } catch (error) {
    console.error('Error in checkPaymentStatus:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat cek status pembayaran',
      error: error.message
    });
  }
};