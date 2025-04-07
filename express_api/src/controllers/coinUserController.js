// src/controllers/coinUserController.js
import { TotalCoinUser, CoinHistory } from '../models/userCoinModels.js';
import sequelize from '../config/db.js';

/**
 * @desc    Mendapatkan total coin dari user yang sedang login
 * @route   GET /api/coin/total
 * @access  Private
 */
export const getTotalCoin = async (req, res) => {
  try {
    // Ambil user_id dari user yang sedang login (disediakan oleh middleware auth)
    const userId = req.user.id;

    // Cari data total coin user
    const totalCoin = await TotalCoinUser.findOne({
      where: { user_id: userId }
    });

    // Jika tidak ditemukan, kembalikan total 0
    if (!totalCoin) {
      return res.status(200).json({
        success: true,
        data: {
          total_coin: 0
        }
      });
    }

    // Kembalikan data total coin
    return res.status(200).json({
      success: true,
      data: {
        total_coin: totalCoin.total_coin
      }
    });
  } catch (error) {
    console.error('Error in getTotalCoin:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat mengambil data total coin'
    });
  }
};

/**
 * @desc    Mendapatkan history coin dari user yang sedang login
 * @route   GET /api/coin/history
 * @access  Private
 */
export const getCoinHistory = async (req, res) => {
  try {
    // Ambil user_id dari user yang sedang login (disediakan oleh middleware auth)
    const userId = req.user.id;
    
    // Parameter paginasi
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    // Cari history coin user dengan paginasi
    const { count, rows: histories } = await CoinHistory.findAndCountAll({
      where: { user_id: userId },
      order: [['created_at', 'DESC']],
      limit,
      offset
    });

    // Hitung total halaman
    const totalPages = Math.ceil(count / limit);

    // Kembalikan data history coin
    return res.status(200).json({
      success: true,
      data: {
        histories,
        pagination: {
          total_items: count,
          total_pages: totalPages,
          current_page: page,
          items_per_page: limit
        }
      }
    });
  } catch (error) {
    console.error('Error in getCoinHistory:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat mengambil data history coin'
    });
  }
};

/**
 * @desc    Menambahkan coin ke user
 * @route   POST /api/coin/add
 * @access  Private (Admin)
 */
export const addCoin = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { user_id, amount, keterangan } = req.body;
    
    if (!user_id || !amount || amount <= 0) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'ID user dan jumlah coin yang valid diperlukan'
      });
    }

    // Cari total coin user
    let totalCoinUser = await TotalCoinUser.findOne({
      where: { user_id },
      transaction
    });

    // Jika user belum memiliki record total coin, buat baru
    if (!totalCoinUser) {
      totalCoinUser = await TotalCoinUser.create({
        user_id,
        total_coin: amount
      }, { transaction });
    } else {
      // Update total coin
      await totalCoinUser.update({
        total_coin: parseFloat(totalCoinUser.total_coin) + parseFloat(amount)
      }, { transaction });
    }

    // Catat di history
    await CoinHistory.create({
      user_id,
      coin_di_dapat: amount,
      coin_di_gunakan: 0,
      tanggal_diperoleh: new Date(),
      keterangan: keterangan || 'Penambahan coin'
    }, { transaction });

    await transaction.commit();

    return res.status(200).json({
      success: true,
      message: 'Coin berhasil ditambahkan',
      data: {
        user_id,
        amount_added: amount,
        new_total: totalCoinUser.total_coin
      }
    });
  } catch (error) {
    await transaction.rollback();
    console.error('Error in addCoin:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat menambahkan coin'
    });
  }
};

/**
 * @desc    Mengurangi coin user karena kesalahan teknis
 * @route   POST /api/coin/deduct
 * @access  Private (Admin)
 */
export const deductCoin = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { user_id, amount, alasan } = req.body;
    
    if (!user_id || !amount || amount <= 0 || !alasan) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'ID user, jumlah coin yang valid, dan alasan diperlukan'
      });
    }

    // Cari total coin user
    const totalCoinUser = await TotalCoinUser.findOne({
      where: { user_id },
      transaction
    });

    // Jika user tidak memiliki record atau total coin tidak cukup
    if (!totalCoinUser) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'User tidak memiliki coin'
      });
    }

    // Validasi total coin tidak menjadi negatif
    if (parseFloat(totalCoinUser.total_coin) < parseFloat(amount)) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Jumlah coin tidak mencukupi untuk pengurangan'
      });
    }

    // Update total coin
    await totalCoinUser.update({
      total_coin: parseFloat(totalCoinUser.total_coin) - parseFloat(amount)
    }, { transaction });

    // Catat di history
    await CoinHistory.create({
      user_id,
      coin_di_dapat: 0,
      coin_di_gunakan: amount,
      tanggal_digunakan: new Date(),
      keterangan: `Pengurangan coin karena kesalahan teknis: ${alasan}`
    }, { transaction });

    await transaction.commit();

    return res.status(200).json({
      success: true,
      message: 'Coin berhasil dikurangi',
      data: {
        user_id,
        amount_deducted: amount,
        new_total: totalCoinUser.total_coin,
        alasan
      }
    });
  } catch (error) {
    await transaction.rollback();
    console.error('Error in deductCoin:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat mengurangi coin'
    });
  }
};