// controllers/booking_konsultasi/pembayaranKonsultasiController.js

import { PembayaranKonsultasi, CheckoutKonsultasi } from '../../models/bookingKonsultasiModels.js';
import { StatusHistory, HistoryLayanan } from '../../models/historyModels.js';
import { createBuktiTransferUrl } from '../../utils/uploadBuktiTransferUtils.js';
import { ConfigPembayaran } from '../../models/configPembayaranModels.js';
import { TotalCoinUser, CoinHistory } from '../../models/userCoinModels.js';
import { calculateCoin } from '../../utils/coinCalculatorUtils.js';
import sequelize from '../../config/db.js';
import path from 'path';
import fs from 'fs';

// Upload bukti pembayaran
export const uploadBuktiPembayaran = async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`Mencari pembayaran dengan ID: ${id}`);
    
    // Validasi apakah file diunggah
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Bukti pembayaran harus diunggah',
      });
    }

    // Ambil data pembayaran
    const pembayaran = await PembayaranKonsultasi.findByPk(id, {
      include: [
        {
          association: 'checkout',
        }
      ]
    });
    
    if (!pembayaran) {
      console.log(`Pembayaran dengan ID ${id} tidak ditemukan`);
      return res.status(404).json({
        success: false,
        message: 'Data pembayaran tidak ditemukan',
      });
    }
    
    // Validasi apakah user adalah pemilik pembayaran
    if (pembayaran.checkout.user_id !== req.user.id) {
      // Hapus file yang baru diupload
      fs.unlinkSync(req.file.path);
      
      return res.status(403).json({
        success: false,
        message: 'Anda tidak memiliki akses untuk pembayaran ini',
      });
    }

    // Validasi status pembayaran - izinkan upload bukti untuk status belum-bayar atau tertunda
    if (pembayaran.status !== 'belum-bayar' && pembayaran.status !== 'tertunda') {
      // Hapus file yang baru diupload
      fs.unlinkSync(req.file.path);
      
      return res.status(400).json({
        success: false,
        message: 'Pembayaran sudah diproses, tidak dapat mengubah bukti pembayaran',
      });
    }

    // Hapus bukti pembayaran lama jika ada
    if (pembayaran.bukti_pembayaran) {
      const oldFilePath = path.join(process.cwd(), 'public/images/bukti-transfer', pembayaran.bukti_pembayaran);
      if (fs.existsSync(oldFilePath)) {
        fs.unlinkSync(oldFilePath);
      }
    }

    // Ambil status history 'diproses'
    const statusHistory = await StatusHistory.findOne({
      where: { slug: 'diproses' },
    });

    if (!statusHistory) {
      return res.status(404).json({
        success: false,
        message: 'Status history tidak ditemukan',
      });
    }

    // Update pembayaran dengan file bukti yang baru
    await pembayaran.update({
      bukti_pembayaran: req.file.filename,
      status: 'diproses',
      kategori_status_history_id: statusHistory.id,
    });

    // Tambahkan ke history layanan
    await HistoryLayanan.create({
      pembayaran_konsultasi_id: pembayaran.id,
      status_history_id: statusHistory.id,
      user_id: req.user.id,
    });

    return res.status(200).json({
      success: true,
      message: 'Bukti pembayaran berhasil diunggah',
      data: {
        id: pembayaran.id,
        bukti_pembayaran: createBuktiTransferUrl(req.file.filename),
        status: pembayaran.status,
      },
    });
  } catch (error) {
    console.error('Error in uploadBuktiPembayaran:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal mengunggah bukti pembayaran',
      error: error.message,
    });
  }
};

// Update status pembayaran (Admin only)
export const updatePaymentStatus = async (req, res) => {
  const t = await sequelize.transaction();
  
  try {
    const { id } = req.params;
    const { status, statusHistoryId } = req.body;
    
    // Validasi input status pembayaran
    if (!status || !['belum-bayar', 'diproses', 'selesai', 'tertunda', 'dibatalkan'].includes(status)) {
      await t.rollback();
      return res.status(400).json({
        success: false,
        message: 'Status pembayaran tidak valid',
      });
    }

    // Ambil data pembayaran
    const pembayaran = await PembayaranKonsultasi.findByPk(id, {
      include: [
        {
          association: 'checkout',
          include: [
            {
              association: 'dokter',
            }
          ]
        },
      ],
    });

    if (!pembayaran) {
      await t.rollback();
      return res.status(404).json({
        success: false,
        message: 'Data pembayaran tidak ditemukan',
      });
    }
    
    // Prioritaskan statusHistoryId dari request jika ada
    let newStatusHistoryId;
    let statusHistorySlug;
    
    if (statusHistoryId) {
      // Jika admin mengirimkan ID status history spesifik
      const checkStatusHistory = await StatusHistory.findByPk(statusHistoryId);
      if (!checkStatusHistory) {
        await t.rollback();
        return res.status(404).json({
          success: false,
          message: 'Status history tidak ditemukan',
        });
      }
      newStatusHistoryId = statusHistoryId;
      statusHistorySlug = checkStatusHistory.slug;
    } else {
      // Jika tidak ada statusHistoryId, gunakan status pembayaran untuk mencari status history
      const statusHistory = await StatusHistory.findOne({
        where: { slug: status },
      });

      if (!statusHistory) {
        await t.rollback();
        return res.status(404).json({
          success: false,
          message: 'Status history tidak ditemukan untuk status pembayaran tersebut',
        });
      }
      newStatusHistoryId = statusHistory.id;
      statusHistorySlug = statusHistory.slug;
    }

    // Status sebelumnya untuk menentukan apakah status baru berubah menjadi 'selesai'
    const previousStatus = pembayaran.status;

    // Update pembayaran
    await pembayaran.update({
      status,
      kategori_status_history_id: newStatusHistoryId,
    }, { transaction: t });

    // Tambahkan ke history layanan
    await HistoryLayanan.create({
      pembayaran_konsultasi_id: pembayaran.id,
      status_history_id: newStatusHistoryId,
      user_id: req.user.id,
    }, { transaction: t });

    // Buat notifikasi jika status berubah menjadi 'selesai'
    let notificationForUser = null;
    let notificationForDoctor = null;

    if (status === 'selesai' && previousStatus !== 'selesai') {
      try {
        // Buat notifikasi untuk user
        notificationForUser = await createNotifikasi({
          userId: pembayaran.checkout.user_id,
          title: 'Konsultasi Siap Dimulai',
          message: `Pembayaran berhasil dikonfirmasi. Klik untuk mulai konsultasi dengan ${pembayaran.checkout.dokter ? pembayaran.checkout.dokter.nama : 'dokter'}.`,
          type: 'konsultasi',
          referenceId: pembayaran.checkout.id,
          transaction: t
        });

        // Buat notifikasi untuk dokter
        notificationForDoctor = await createNotifikasi({
          userId: pembayaran.checkout.dokter_id,
          title: 'Permintaan Konsultasi Baru',
          message: `Ada konsultasi baru menunggu Anda. Pasien telah melakukan pembayaran.`,
          type: 'konsultasi',
          referenceId: pembayaran.checkout.id,
          isForDoctor: true,
          transaction: t
        });
      } catch (notifError) {
        console.error('Error creating notifications:', notifError);
        // Lanjutkan meskipun gagal membuat notifikasi
      }
    }

    // Jika status 'selesai', tambahkan koin
    if (status === 'selesai') {
      try {
        const configPembayaran = await ConfigPembayaran.findOne();
        
        if (configPembayaran) {
          // Hitung koin yang didapat
          const coinDapat = calculateCoin(
            pembayaran.checkout.total_harga,
            configPembayaran.persentase_coin
          );
          
          // Update koin di pembayaran
          await pembayaran.update({
            koin_didapat: coinDapat,
          }, { transaction: t });
          
          // Tambahkan koin ke total user
          const totalCoinUser = await TotalCoinUser.findOne({
            where: { user_id: pembayaran.checkout.user_id },
          });
          
          if (totalCoinUser) {
            await totalCoinUser.update({
              total_coin: totalCoinUser.total_coin + coinDapat,
            }, { transaction: t });
          } else {
            await TotalCoinUser.create({
              user_id: pembayaran.checkout.user_id,
              total_coin: coinDapat,
            }, { transaction: t });
          }
          
          // Tambahkan history koin
          await CoinHistory.create({
            pembayaran_konsultasi_id: pembayaran.id,
            user_id: pembayaran.checkout.user_id,
            coin_di_dapat: coinDapat,
            tanggal_diperoleh: new Date(),
          }, { transaction: t });
        }
      } catch (coinError) {
        console.error('Error processing coin:', coinError);
        // Lanjutkan meskipun ada error saat memproses koin
      }
    }

    // Commit transaction
    await t.commit();

    return res.status(200).json({
      success: true,
      message: `Status pembayaran berhasil diubah menjadi ${status}`,
      data: {
        id: pembayaran.id,
        status,
        statusHistoryId: newStatusHistoryId,
        statusHistorySlug,
        koin_didapat: pembayaran.koin_didapat,
        notifikasi: {
          user: notificationForUser,
          dokter: notificationForDoctor
        },
        chatAvailable: status === 'selesai'
      },
    });
  } catch (error) {
    // Rollback transaction jika terjadi error
    await t.rollback();
    
    console.error('Error in updatePaymentStatus:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal mengubah status pembayaran',
      error: error.message,
    });
  }
};

// Fungsi untuk membuat notifikasi (perlu dibuat di file notifikasiModels.js dan utilsnya)
async function createNotifikasi({ userId, title, message, type, referenceId, isForDoctor = false, transaction }) {
  // Implementasi notifikasi akan tergantung pada model Notifikasi di aplikasi
  // Contoh sederhana:
  const Notifikasi = isForDoctor ? DokterNotifikasi : UserNotifikasi; // Sesuaikan dengan model notifikasi
  
  return await Notifikasi.create({
    user_id: userId,
    judul: title,
    pesan: message,
    tipe: type,
    reference_id: referenceId,
    is_read: false,
    created_at: new Date()
  }, { transaction });
}