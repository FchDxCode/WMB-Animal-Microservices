// controllers/checkout_produk/pesananProdukController.js
import { PembayaranProduk, CheckoutProduk, CheckoutItem, EkspedisiData } from '../../models/checkoutProdukModels.js';
import { Produk, GambarProduk } from '../../models/produkModels.js';
import { AlamatUser } from '../../models/alamatUserModels.js';
import { User } from '../../models/userModels.js';

/**
 * Mendapatkan daftar pesanan pengguna
 * @param {object} req - Request Express
 * @param {object} res - Response Express
 */
export const getUserOrders = async (req, res) => {
  try {
    const userId = req.user.id;
    const { status, page = 1, limit = 10 } = req.query;
    
    const offset = (page - 1) * limit;
    const whereCondition = { user_id: userId };
    
    const orders = await CheckoutProduk.findAndCountAll({
      where: whereCondition,
      include: [
        {
          model: PembayaranProduk,
          as: 'pembayaran',
          ...(status && { where: { status } })
        }
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['created_at', 'DESC']]
    });
    
    return res.status(200).json({
      success: true,
      data: {
        orders: orders.rows,
        pagination: {
          total: orders.count,
          currentPage: parseInt(page),
          totalPages: Math.ceil(orders.count / limit)
        }
      }
    });
  } catch (error) {
    console.error('Error getting user orders:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat mengambil daftar pesanan',
      error: error.message
    });
  }
};

/**
 * Mendapatkan detail pesanan
 * @param {object} req - Request Express
 * @param {object} res - Response Express
 */
export const getOrderDetail = async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;
  
      const order = await CheckoutProduk.findOne({
        where: { id, user_id: userId },
        include: [
          {
            model: PembayaranProduk,
            as: 'pembayaran'
          },
          {
            model: CheckoutItem,
            as: 'items',
            include: [
              {
                model: Produk,
                as: 'produk',
                attributes: ['id', 'nama_produk', 'harga_produk'],
                include: [ // Include the GambarProduk association
                  {
                    model: GambarProduk,
                    as: 'gambar_produk',
                    attributes: ['gambar'],
                    limit: 1 // Fetch only one image (you can adjust this)
                  }
                ]
              }
            ]
          },
          {
            model: AlamatUser,
            as: 'alamat',
            attributes: ['nama_lengkap', 'no_tlpn', 'detail_alamat', 'kode_pos']
          },
          {
            model: EkspedisiData,
            as: 'ekspedisi',
            attributes: ['nama_ekspedisi', 'ongkir']
          }
        ]
      });
  
      if (!order) {
        return res.status(404).json({
          success: false,
          message: 'Pesanan tidak ditemukan'
        });
      }
  
      return res.status(200).json({
        success: true,
        data: {
          order
        }
      });
    } catch (error) {
      console.error('Error getting order detail:', error);
      return res.status(500).json({
        success: false,
        message: 'Terjadi kesalahan saat mengambil detail pesanan',
        error: error.message
      });
    }
  };

/**
 * Mendapatkan daftar pesanan untuk admin
 * @param {object} req - Request Express
 * @param {object} res - Response Express
 */
export const getAllOrders = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    
    const offset = (page - 1) * limit;
    const whereCondition = {};
    
    const orders = await CheckoutProduk.findAndCountAll({
      include: [
        {
          model: PembayaranProduk,
          as: 'pembayaran',
          ...(status && { where: { status } })
        },
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email']
        }
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['created_at', 'DESC']]
    });
    
    return res.status(200).json({
      success: true,
      data: {
        orders: orders.rows,
        pagination: {
          total: orders.count,
          currentPage: parseInt(page),
          totalPages: Math.ceil(orders.count / limit)
        }
      }
    });
  } catch (error) {
    console.error('Error getting all orders:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat mengambil daftar semua pesanan',
      error: error.message
    });
  }
};