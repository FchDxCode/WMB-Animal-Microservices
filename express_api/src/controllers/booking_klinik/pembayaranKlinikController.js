// controllers/booking_klinik/pembayaranKlinikController.js
import { CheckoutBookingKlinik, BookingKlinik, PembayaranKlinik } from '../../models/bookingKlinikModels.js';
import { Klinik, LayananKlinik } from '../../models/klinikModels.js';
import { calculateCoin } from '../../utils/coinCalculatorUtils.js';
import { uploadBuktiTransfer, createBuktiTransferUrl } from '../../utils/uploadBuktiTransferUtils.js';
import { StatusHistory } from '../../models/historyModels.js';
import { ConfigPembayaran } from '../../models/configPembayaranModels.js'; // Import model ConfigPembayaran
import { CoinService } from '../../services/coin/coinServices.js';

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

    // Tambahan validasi metode pembayaran
    const metodePembayaranValid = ['whatsapp', 'transfer'];
    if (!metodePembayaranValid.includes(metode_pembayaran)) {
      return res.status(400).json({
        success: false,
        message: 'Metode pembayaran tidak valid. Gunakan "whatsapp" atau "transfer".'
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
    let persentaseCoinValue = 0; // Tambahkan variabel untuk persentase koin

    // Ambil konfigurasi pembayaran untuk mendapatkan biaya booking dan persentase koin
    const configPembayaran = await ConfigPembayaran.findOne();

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

    // Buat pembayaran baru
    const pembayaran = await PembayaranKlinik.create({
      checkout_booking_klinik_id: checkout_id,
      metode_pembayaran,
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
        metode_pembayaran: pembayaran.metode_pembayaran,
        total_biaya: pembayaran.total_biaya,
        status: pembayaran.status,
        koin_didapat: pembayaran.koin_didapat,
        no_rekening_klinik: checkout.booking.klinik.no_rekening_klinik,
        invoice: checkout.invoice,
        // Info untuk expired payment
        expired_at: new Date(new Date().getTime() + 24 * 60 * 60 * 1000) // 24 jam dari sekarang
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
  // Gunakan middleware uploadBuktiTransfer.single('bukti_transfer') pada route
  try {
    const { id } = req.params; // ID pembayaran
    const user_id = req.user.id;

    // Dapatkan data pembayaran
    const pembayaran = await PembayaranKlinik.findByPk(id, {
      include: [
        {
          model: CheckoutBookingKlinik,
          as: 'checkout',
          include: [
            { model: BookingKlinik, as: 'booking' }
          ]
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

    // Cek apakah file bukti transfer sudah diupload via middleware
    if (!req.file) {
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
    });

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
  try {
    const { id } = req.params; // ID pembayaran
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

    // Dapatkan status history yang terkait dengan pembayaran
    const statusHistory = await StatusHistory.findByPk(pembayaran.kategori_status_history_id);

    if (!statusHistory) {
      return res.status(404).json({
        success: false,
        message: 'Status history tidak ditemukan'
      });
    }

    // Dapatkan layanan secara terpisah - PERBAIKI INI
    const layanan = await LayananKlinik.findByPk(pembayaran.checkout.booking.layanan_klinik_id);

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

    // Buat response
    return res.status(200).json({
      success: true,
      data: {
        id: pembayaran.id,
        metode_pembayaran: pembayaran.metode_pembayaran,
        total_biaya: pembayaran.total_biaya,
        status: pembayaran.status,
        status_history: statusHistory.slug,
        bukti_pembayaran: pembayaran.bukti_pembayaran,
        koin_didapat: koinDidapat,
        created_at: pembayaran.created_at,
        updated_at: pembayaran.updated_at,
        invoice: pembayaran.checkout.invoice,
        no_rekening_klinik: pembayaran.checkout.booking.klinik.no_rekening_klinik,
        // Info untuk expired payment
        expired_at: new Date(new Date(pembayaran.created_at).getTime() + 24 * 60 * 60 * 1000)
      }
    });
  } catch (error) {
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
  try {
    const { id } = req.params;
    const { status, status_history_slug } = req.body;
    
    // Dapatkan data pembayaran
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
    
    // Dapatkan status history berdasarkan slug
    const statusHistory = await StatusHistory.findOne({
      where: { slug: status_history_slug }
    });
    
    if (!statusHistory) {
      return res.status(404).json({
        success: false,
        message: 'Status history tidak ditemukan'
      });
    }
    
    // Update status pembayaran
    await pembayaran.update({
      status,
      kategori_status_history_id: statusHistory.id
    });
    
    // Jika status pembayaran 'selesai' dan status history 'selesai', tambahkan koin ke user
    if (status === 'selesai' && status_history_slug === 'selesai') {
      const userId = pembayaran.checkout.booking.user_id;
      const coinAmount = pembayaran.koin_didapat;
      
      try {
        // Tambahkan koin ke akun user menggunakan service
        await CoinService.addCoinsAfterPayment(userId, coinAmount, {
          id: pembayaran.id,
          type: 'klinik'
        });
      } catch (coinError) {
        console.error('Error adding coins:', coinError);
        // Kita tidak ingin gagal update status jika penambahan koin gagal
        // Tapi tetap log error untuk investigasi lebih lanjut
      }
    }
    
    console.log('Status:', status);
    console.log('Status History Slug:', status_history_slug);
    console.log('User ID:', pembayaran.checkout.booking.user_id);
    console.log('Coin Amount:', pembayaran.koin_didapat);
    
    return res.status(200).json({
      success: true,
      message: 'Status pembayaran berhasil diupdate',
      data: pembayaran
    });
  } catch (error) {
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
  try {
    const { id } = req.params;
    const { status, status_history_slug } = req.body;
    
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
      ]
    });
    
    if (!pembayaran) {
      return res.status(404).json({
        success: false,
        message: 'Pembayaran tidak ditemukan'
      });
    }

    // Dapatkan status history berdasarkan slug
    const statusHistory = await StatusHistory.findOne({
      where: { slug: status_history_slug }
    });
    
    if (!statusHistory) {
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
      kategori_status_history_id: statusHistory.id
    });

    // Jika status berubah menjadi 'selesai' dan sebelumnya bukan 'selesai'
    // Tambahkan koin ke user (tanpa memeriksa status_history)
    if (status === 'selesai' && statusSebelumnya !== 'selesai') {
      const userId = pembayaran.checkout.booking.user_id;
      const coinAmount = pembayaran.koin_didapat;
      
      try {
        await CoinService.addCoinsAfterPayment(userId, coinAmount, {
          id: pembayaran.id,
          type: 'klinik'
        });
      } catch (coinError) {
        console.error('Error adding coins:', coinError);
        // Tetap lanjutkan proses meski gagal menambah koin
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
      ]
    });
    
    return res.status(200).json({
      success: true,
      message: 'Status pembayaran berhasil diupdate',
      data: {
        id: updatedPembayaran.id,
        metode_pembayaran: updatedPembayaran.metode_pembayaran,
        total_biaya: updatedPembayaran.total_biaya,
        status: updatedPembayaran.status,
        status_history: statusHistory.slug,
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
    console.error('Error in adminUpdateStatusPembayaran:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat update status pembayaran',
      error: error.message
    });
  }
};