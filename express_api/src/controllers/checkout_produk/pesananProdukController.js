// controllers/checkout_produk/pesananProdukController.js
import { PembayaranProduk, CheckoutProduk, CheckoutItem, EkspedisiData } from '../../models/checkoutProdukModels.js';
import { Produk, GambarProduk } from '../../models/produkModels.js';
import { AlamatUser } from '../../models/alamatUserModels.js';
import { User } from '../../models/userModels.js';
import { uploadFolders, createImageUrl } from '../../utils/uploadUtils.js';

// Helper function untuk format data items
const formatOrderItems = (items) => {
  return items.map(item => {
    const gambar = item.produk.gambar_produk && item.produk.gambar_produk.length > 0
      ? createImageUrl(item.produk.gambar_produk[0].gambar, uploadFolders.productImages)
      : null;
    
    return {
      id: item.id,
      checkout_id: item.checkout_id,
      produk_id: item.produk_id,
      jumlah: item.jumlah,
      harga_satuan: item.harga_satuan,
      subtotal: item.subtotal,
      produk: {
        id: item.produk.id,
        nama_produk: item.produk.nama_produk,
        harga_produk: item.produk.harga_produk,
        gambar_produk : gambar
      }
    };
  });
};

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
        },
        {
          model: CheckoutItem,
          as: 'items',
          include: [
            {
              model: Produk,
              as: 'produk',
              attributes: ['id', 'nama_produk', 'harga_produk'],
              include: [
                {
                  model: GambarProduk,
                  as: 'gambar_produk',
                  attributes: ['id', 'gambar'],
                  limit: 1
                }
              ]
            }
          ]
        }
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['created_at', 'DESC']]
    });
    
    // Format response dengan URL gambar lengkap
    const formattedOrders = orders.rows.map(order => {
      return {
        id: order.id,
        user_id: order.user_id,
        alamat_id: order.alamat_id,
        ekspedisi_id: order.ekspedisi_id,
        ongkir: order.ongkir,
        total_harga: order.total_harga,
        created_at: order.created_at,
        updated_at: order.updated_at,
        pembayaran: order.pembayaran,
        items: formatOrderItems(order.items)
      };
    });
    
    return res.status(200).json({
      success: true,
      data: {
        orders: formattedOrders,
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
              attributes: ['id', 'nama_produk', 'harga_produk', 'slug', 'berat_produk'],
              include: [
                {
                  model: GambarProduk,
                  as: 'gambar_produk',
                  attributes: ['id', 'gambar'],
                  limit: 1
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

    // Format response dengan URL gambar lengkap
    const formattedOrder = {
      id: order.id,
      user_id: order.user_id,
      alamat_id: order.alamat_id,
      ekspedisi_id: order.ekspedisi_id,
      ongkir: order.ongkir,
      total_harga: order.total_harga,
      created_at: order.created_at,
      updated_at: order.updated_at,
      pembayaran: order.pembayaran,
      items: formatOrderItems(order.items),
      alamat: order.alamat,
      ekspedisi: order.ekspedisi
    };

    return res.status(200).json({
      success: true,
      data: {
        order: formattedOrder
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
        },
        {
          model: CheckoutItem,
          as: 'items',
          include: [
            {
              model: Produk,
              as: 'produk',
              attributes: ['id', 'nama_produk', 'harga_produk'],
              include: [
                {
                  model: GambarProduk,
                  as: 'gambar_produk',
                  attributes: ['id', 'gambar'],
                  limit: 1
                }
              ]
            }
          ]
        }
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['created_at', 'DESC']]
    });
    
    // Format response dengan URL gambar lengkap
    const formattedOrders = orders.rows.map(order => {
      return {
        id: order.id,
        user_id: order.user_id,
        alamat_id: order.alamat_id,
        ekspedisi_id: order.ekspedisi_id,
        ongkir: order.ongkir,
        total_harga: order.total_harga,
        created_at: order.created_at,
        updated_at: order.updated_at,
        pembayaran: order.pembayaran,
        user: order.user,
        items: formatOrderItems(order.items)
      };
    });
    
    return res.status(200).json({
      success: true,
      data: {
        orders: formattedOrders,
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