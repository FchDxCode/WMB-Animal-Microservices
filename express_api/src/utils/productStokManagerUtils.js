// utils/productStockManager.js
import { Produk } from '../models/produkModels.js';
import sequelize  from '../config/db.js';

/**
 * Mengurangi stok produk berdasarkan checkout
 * @param {Array} checkoutItems - Array of checkout items yang berisi produk_id dan jumlah
 * @returns {Promise<boolean>} - Status keberhasilan pengurangan stok
 */
export const reduceProductStock = async (checkoutItems) => {
  const t = await sequelize.transaction();
  
  try {
    for (const item of checkoutItems) {
      const produk = await Produk.findByPk(item.produk_id, { transaction: t });
      
      if (!produk) {
        throw new Error(`Produk dengan ID ${item.produk_id} tidak ditemukan`);
      }
      
      if (produk.stok_produk < item.jumlah) {
        throw new Error(`Stok produk ${produk.nama_produk} tidak mencukupi`);
      }
      
      // Kurangi stok
      await produk.update({
        stok_produk: produk.stok_produk - item.jumlah
      }, { transaction: t });
    }
    
    await t.commit();
    return true;
  } catch (error) {
    await t.rollback();
    console.error('Error reducing product stock:', error);
    throw error;
  }
};

/**
 * Mengembalikan stok produk jika pembayaran dibatalkan
 * @param {Array} checkoutItems - Array of checkout items yang berisi produk_id dan jumlah
 * @returns {Promise<boolean>} - Status keberhasilan pengembalian stok
 */
export const restoreProductStock = async (checkoutItems) => {
  const t = await sequelize.transaction();
  
  try {
    for (const item of checkoutItems) {
      const produk = await Produk.findByPk(item.produk_id, { transaction: t });
      
      if (!produk) {
        throw new Error(`Produk dengan ID ${item.produk_id} tidak ditemukan`);
      }
      
      // Kembalikan stok
      await produk.update({
        stok_produk: produk.stok_produk + item.jumlah
      }, { transaction: t });
    }
    
    await t.commit();
    return true;
  } catch (error) {
    await t.rollback();
    console.error('Error restoring product stock:', error);
    throw error;
  }
};