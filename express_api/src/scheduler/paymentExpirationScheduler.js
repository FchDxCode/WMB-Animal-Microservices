// scheduler/paymentExpirationScheduler.js
import { PembayaranProduk } from '../models/checkoutProdukModels.js';
import { TotalCoinUser, CoinHistory } from '../models/userCoinModels.js';
import { Op } from 'sequelize';
import sequelize from '../config/db.js';

/**
 * Scheduler untuk mengecek dan mengubah status pembayaran produk yang sudah melewati batas waktu (24 jam)
 */
export const checkExpiredProductPayments = async () => {
  try {
    console.log('Running product payment expiration scheduler...');
    
    const expiredTime = new Date(new Date().getTime() - 24 * 60 * 60 * 1000); // 24 jam yang lalu
    
    // Cari pembayaran produk yang sudah expired
    const expiredPayments = await PembayaranProduk.findAll({
      where: {
        status: 'tertunda',
        created_at: {
          [Op.lt]: expiredTime
        }
      },
      include: [
        {
          association: 'checkout',
          attributes: ['user_id', 'koin_digunakan']
        }
      ]
    });

    console.log(`Found ${expiredPayments.length} expired product payments`);

    // Update status pembayaran menjadi 'dibatalkan' dan kembalikan coin
    for (const payment of expiredPayments) {
      const t = await sequelize.transaction();
      
      try {
        // Update status pembayaran
        await payment.update({
          status: 'dibatalkan'
        }, { transaction: t });
        
        // Jika ada koin yang digunakan, kembalikan ke akun user
        if (payment.checkout && payment.checkout.koin_digunakan > 0) {
          // Update total coin user
          const totalCoinUser = await TotalCoinUser.findOne({
            where: { user_id: payment.checkout.user_id },
            transaction: t
          });
          
          if (totalCoinUser) {
            await totalCoinUser.update({
              total_coin: totalCoinUser.total_coin + payment.checkout.koin_digunakan
            }, { transaction: t });
            
            // Tambahkan riwayat pengembalian coin
            await CoinHistory.create({
              user_id: payment.checkout.user_id,
              pembayaran_produk_id: payment.id,
              coin_di_gunakan: -payment.checkout.koin_digunakan, // Nilai negatif menandakan pengembalian
              tanggal_digunakan: new Date(),
            }, { transaction: t });
            
            console.log(`Returned ${payment.checkout.koin_digunakan} coins to user ID ${payment.checkout.user_id}`);
          }
        }
        
        await t.commit();
        console.log(`Payment ID ${payment.id} marked as dibatalkan and coins refunded`);
      } catch (error) {
        await t.rollback();
        console.error(`Error updating payment ID ${payment.id}:`, error);
      }
    }

    console.log('Product payment expiration scheduler completed');
    return expiredPayments.length;
  } catch (error) {
    console.error('Error in checkExpiredProductPayments:', error);
    throw error;
  }
};

// Fungsi untuk menjalankan scheduler
export const runPaymentExpirationScheduler = () => {
  // Jalankan scheduler setiap 1 jam
  setInterval(async () => {
    try {
      await checkExpiredProductPayments();
    } catch (error) {
      console.error('Failed to run payment expiration scheduler:', error);
    }
  }, 60 * 60 * 1000); // 1 jam dalam milidetik
};