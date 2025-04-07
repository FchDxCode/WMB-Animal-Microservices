// scheduler/paymentExpirationScheduler.js
import { PembayaranKlinik } from '../models/bookingKlinikModels.js';
import { Op } from 'sequelize';

/**
 * Scheduler untuk mengecek dan mengubah status pembayaran yang sudah melewati batas waktu (24 jam)
 */
export const checkExpiredPayments = async () => {
  try {
    console.log('Running payment expiration scheduler...');
    
    // Dapatkan semua pembayaran dengan status 'tertunda' yang sudah dibuat lebih dari 24 jam
    const expiredTime = new Date(new Date().getTime() - 24 * 60 * 60 * 1000); // 24 jam yang lalu
    
    // Cari pembayaran yang sudah expired
    const expiredPayments = await PembayaranKlinik.findAll({
      where: {
        status: 'tertunda',
        created_at: {
          [Op.lt]: expiredTime
        }
      }
    });

    console.log(`Found ${expiredPayments.length} expired payments`);

    // Update status pembayaran menjadi 'dibatalkan'
    for (const payment of expiredPayments) {
      await payment.update({
        status: 'dibatalkan'
      });
      console.log(`Payment ID ${payment.id} marked as dibatalkan`);
    }

    console.log('Payment expiration scheduler completed');
    return expiredPayments.length;
  } catch (error) {
    console.error('Error in checkExpiredPayments:', error);
    throw error;
  }
};

// Fungsi untuk menjalankan scheduler
export const runPaymentExpirationScheduler = () => {
  // Jalankan scheduler setiap 1 jam
  setInterval(async () => {
    try {
      await checkExpiredPayments();
    } catch (error) {
      console.error('Failed to run payment expiration scheduler:', error);
    }
  }, 60 * 60 * 1000); // 1 jam dalam milidetik
};