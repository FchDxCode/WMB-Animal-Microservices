// services/coin/coinServices.js
import { TotalCoinUser, CoinHistory } from '../../models/userCoinModels.js';
import sequelize from '../../config/db.js';

/**
 * Service untuk mengelola koin pengguna
 */
export const CoinService = {
  /**
   * Mendapatkan total koin pengguna
   * @param {number} userId - ID pengguna
   * @returns {Promise<number>} - Total koin pengguna
   */
  getUserCoins: async (userId) => {
    try {
      const totalCoin = await TotalCoinUser.findOne({
        where: { user_id: userId }
      });
      
      return totalCoin ? parseFloat(totalCoin.total_coin) : 0;
    } catch (error) {
      console.error('Error in getUserCoins:', error);
      throw new Error('Gagal mendapatkan total koin pengguna');
    }
  },
  
  /**
   * Menambahkan koin ke akun pengguna setelah pembayaran selesai
   * @param {number} userId - ID pengguna
   * @param {number} amount - Jumlah koin yang akan ditambahkan
   * @param {Object} paymentInfo - Informasi pembayaran
   * @returns {Promise<Object>} - Detail hasil operasi
   */
  addCoinsAfterPayment: async (userId, amount, paymentInfo) => {
    const transaction = await sequelize.transaction();
    
    try {
      // Validasi input
      if (!userId || amount <= 0) {
        throw new Error('User ID dan jumlah koin harus valid');
      }
      
      // Cari atau buat record total koin
      let totalCoinUser = await TotalCoinUser.findOne({
        where: { user_id: userId },
        transaction
      });
      
      if (!totalCoinUser) {
        totalCoinUser = await TotalCoinUser.create({
          user_id: userId,
          total_coin: amount
        }, { transaction });
      } else {
        // Update total koin
        await totalCoinUser.update({
          total_coin: sequelize.literal(`total_coin + ${amount}`)
        }, { transaction });
      }
      
      // Siapkan objek untuk CoinHistory
      const coinHistoryData = {
        user_id: userId,
        coin_di_dapat: amount,
        coin_di_gunakan: 0,
        tanggal_diperoleh: new Date(),
        keterangan: `Koin dari ${paymentInfo.type || 'pembayaran'} #${paymentInfo.id || 0}`
      };
      
      // Tambahkan ID pembayaran berdasarkan jenis
      if (paymentInfo.type === 'klinik') {
        coinHistoryData.pembayaran_klinik_id = paymentInfo.id;
      } else if (paymentInfo.type === 'produk') {
        coinHistoryData.pembayaran_produk_id = paymentInfo.id;
      } else if (paymentInfo.type === 'konsultasi') {
        coinHistoryData.pembayaran_konsultasi_id = paymentInfo.id;
      } else if (paymentInfo.type === 'pet_hotel') {
        coinHistoryData.pembayaran_pet_hotel_id = paymentInfo.id;
      } else if (paymentInfo.type === 'house_call') {
        coinHistoryData.pembayaran_house_call_id = paymentInfo.id;
      }
      
      // Catat di history
      await CoinHistory.create(coinHistoryData, { transaction });
      
      // Commit transaksi
      await transaction.commit();
      
      // Ambil total koin terbaru
      const updatedTotal = await CoinService.getUserCoins(userId);
      
      return {
        success: true,
        userId,
        amountAdded: amount,
        newTotal: updatedTotal
      };
    } catch (error) {
      // Rollback transaksi jika terjadi error
      await transaction.rollback();
      console.error('Error in addCoinsAfterPayment:', error);
      throw new Error(`Gagal menambahkan koin: ${error.message}`);
    }
  },
  
  /**
   * Menggunakan koin untuk diskon pada pembayaran
   * @param {number} userId - ID pengguna
   * @param {number} amount - Jumlah koin yang akan digunakan
   * @param {Object} orderInfo - Informasi pesanan
   * @returns {Promise<Object>} - Detail hasil operasi
   */
  useCoinsForDiscount: async (userId, amount, orderInfo) => {
    const transaction = await sequelize.transaction();
    
    try {
      // Validasi input
      if (!userId || amount <= 0) {
        throw new Error('User ID dan jumlah koin harus valid');
      }
      
      // Cek saldo koin user
      const totalCoinUser = await TotalCoinUser.findOne({
        where: { user_id: userId },
        transaction
      });
      
      // Validasi saldo cukup
      if (!totalCoinUser || parseFloat(totalCoinUser.total_coin) < amount) {
        throw new Error('Saldo koin tidak mencukupi');
      }
      
      // Kurangi saldo koin
      await totalCoinUser.update({
        total_coin: sequelize.literal(`total_coin - ${amount}`)
      }, { transaction });
      
      // Siapkan objek untuk CoinHistory
      const coinHistoryData = {
        user_id: userId,
        coin_di_dapat: 0,
        coin_di_gunakan: amount,
        tanggal_digunakan: new Date(),
        keterangan: `Digunakan untuk ${orderInfo.type || 'pembelian'} #${orderInfo.id || 0}`
      };
      
      // Tambahkan ID pembayaran berdasarkan jenis
      if (orderInfo.type === 'klinik') {
        coinHistoryData.pembayaran_klinik_id = orderInfo.id;
      } else if (orderInfo.type === 'produk') {
        coinHistoryData.pembayaran_produk_id = orderInfo.id;
      } else if (orderInfo.type === 'konsultasi') {
        coinHistoryData.pembayaran_konsultasi_id = orderInfo.id;
      } else if (orderInfo.type === 'pet_hotel') {
        coinHistoryData.pembayaran_pet_hotel_id = orderInfo.id;
      } else if (orderInfo.type === 'house_call') {
        coinHistoryData.pembayaran_house_call_id = orderInfo.id;
      }
      
      // Catat di history
      await CoinHistory.create(coinHistoryData, { transaction });
      
      // Commit transaksi
      await transaction.commit();
      
      // Ambil total koin terbaru
      const updatedTotal = await CoinService.getUserCoins(userId);
      
      return {
        success: true,
        userId,
        amountUsed: amount,
        newTotal: updatedTotal
      };
    } catch (error) {
      // Rollback transaksi jika terjadi error
      await transaction.rollback();
      console.error('Error in useCoinsForDiscount:', error);
      throw new Error(`Gagal menggunakan koin: ${error.message}`);
    }
  },
  
  /**
   * Memeriksa apakah user memiliki cukup koin
   * @param {number} userId - ID pengguna
   * @param {number} amount - Jumlah koin yang dibutuhkan
   * @returns {Promise<boolean>} - True jika cukup, false jika tidak
   */
  hasEnoughCoins: async (userId, amount) => {
    try {
      const totalCoins = await CoinService.getUserCoins(userId);
      return totalCoins >= amount;
    } catch (error) {
      console.error('Error in hasEnoughCoins:', error);
      return false;
    }
  }
};