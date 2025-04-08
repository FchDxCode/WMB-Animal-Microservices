import { Produk, KategoriProduk, GambarProduk } from '../models/produkModels.js';
import KeranjangProduk from '../models/keranjangProdukModels.js';
import { Op } from 'sequelize';
import sequelize from '../config/db.js';
import { uploadFolders, createImageUrl } from '../utils/uploadUtils.js';

// Helper function untuk format data produk
const formatProductImage = (gambarProduk) => {
  if (!gambarProduk || !Array.isArray(gambarProduk)) return null;
  return gambarProduk.map(gambar => ({
    id: gambar.id,
    url: createImageUrl(gambar.gambar, uploadFolders.productImages)
  }));
};

const formatProductData = (product, includeDetails = false) => {
  const baseData = {
    id: product.id,
    nama_produk: product.nama_produk,
    harga_produk: product.harga_produk,
    diskon_produk: product.diskon_produk,
    berat_produk: product.berat_produk,
    slug: product.slug,
    gambar: product.gambar_produk?.length > 0 
      ? createImageUrl(product.gambar_produk[0].gambar, uploadFolders.productImages)
      : null
  };

  if (includeDetails) {
    return {
      ...baseData,
      deskripsi: product.deskripsi,
      stok_produk: product.stok_produk,
      kategori: product.kategori,
      gambar_produk: formatProductImage(product.gambar_produk),
      created_at: product.created_at,
      updated_at: product.updated_at
    };
  }

  return baseData;
};

// Get all products dengan informasi dasar
export const getAllProducts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    
    const products = await Produk.findAndCountAll({
      attributes: ['id', 'nama_produk', 'harga_produk', 'diskon_produk', 'slug'],
      where: {
        tampilkan_produk: 1
      },
      include: [
        {
          model: GambarProduk,
          as: 'gambar_produk',
          attributes: ['id', 'gambar'],
          limit: 1
        }
      ],
      limit,
      offset,
      order: [['created_at', 'DESC']]
    });
    
    // Format response dengan URL gambar lengkap
    const formattedProducts = products.rows.map(product => formatProductData(product));
    
    return res.status(200).json({
      success: true,
      data: {
        products: formattedProducts,
        pagination: {
          total_items: products.count,
          total_pages: Math.ceil(products.count / limit),
          current_page: page,
          items_per_page: limit
        }
      }
    });
  } catch (error) {
    console.error('Error mendapatkan semua produk:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat mengambil data produk',
      error: error.message
    });
  }
};

// Get products by kategori
export const getProductsByCategory = async (req, res) => {
  try {
    const { slug } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    
    // Cari kategori berdasarkan slug
    const kategori = await KategoriProduk.findOne({
      where: { slug }
    });
    
    if (!kategori) {
      return res.status(404).json({
        success: false,
        message: 'Kategori tidak ditemukan'
      });
    }
    
    const products = await Produk.findAndCountAll({
      attributes: ['id', 'nama_produk', 'harga_produk', 'diskon_produk', 'slug'],
      where: {
        kategori_produk_id: kategori.id,
        tampilkan_produk: 1
      },
      include: [
        {
          model: GambarProduk,
          as: 'gambar_produk',
          attributes: ['id', 'gambar'],
          limit: 1 // Ambil satu gambar saja untuk list
        }
      ],
      limit,
      offset,
      order: [['created_at', 'DESC']]
    });
    
    // Format response menggunakan helper function yang sudah ada
    const formattedProducts = products.rows.map(product => formatProductData(product));
    
    return res.status(200).json({
      success: true,
      data: {
        kategori: {
          id: kategori.id,
          nama: kategori.nama,
          slug: kategori.slug
        },
        products: formattedProducts,
        pagination: {
          total_items: products.count,
          total_pages: Math.ceil(products.count / limit),
          current_page: page,
          items_per_page: limit
        }
      }
    });
  } catch (error) {
    console.error('Error mendapatkan produk berdasarkan kategori:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat mengambil data produk berdasarkan kategori',
      error: error.message
    });
  }
};

// Get product detail by ID or slug
export const getProductDetail = async (req, res) => {
  try {
    const { identifier } = req.params;
    
    const where = !isNaN(identifier) ? { id: identifier } : { slug: identifier };
    
    const product = await Produk.findOne({
      where,
      include: [
        {
          model: GambarProduk,
          as: 'gambar_produk',
          attributes: ['id', 'gambar']
        },
        {
          model: KategoriProduk,
          as: 'kategori',
          attributes: ['id', 'nama', 'slug']
        }
      ]
    });
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Produk tidak ditemukan'
      });
    }
    
    // Format response dengan URL gambar lengkap
    const productDetail = formatProductData(product, true);
    
    return res.status(200).json({
      success: true,
      data: productDetail
    });
  } catch (error) {
    console.error('Error mendapatkan detail produk:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat mengambil detail produk',
      error: error.message
    });
  }
};

// Search products
export const searchProducts = async (req, res) => {
  try {
    const { keyword } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    
    if (!keyword) {
      return res.status(400).json({
        success: false,
        message: 'Parameter pencarian (keyword) diperlukan'
      });
    }
    
    const products = await Produk.findAndCountAll({
      attributes: ['id', 'nama_produk', 'harga_produk', 'diskon_produk', 'slug'],
      where: {
        [Op.and]: [
          {
            [Op.or]: [
              { nama_produk: { [Op.like]: `%${keyword}%` } },
              { deskripsi: { [Op.like]: `%${keyword}%` } }
            ]
          },
          { tampilkan_produk: 1 }
        ]
      },
      include: [
        {
          model: GambarProduk,
          as: 'gambar_produk',
          attributes: ['id', 'gambar'],
          limit: 1
        }
      ],
      limit,
      offset,
      order: [['created_at', 'DESC']]
    });
    
    // Format response dengan URL gambar lengkap
    const formattedProducts = products.rows.map(product => formatProductData(product));
    
    return res.status(200).json({
      success: true,
      data: {
        keyword,
        products: formattedProducts,
        pagination: {
          total_items: products.count,
          total_pages: Math.ceil(products.count / limit),
          current_page: page,
          items_per_page: limit
        }
      }
    });
  } catch (error) {
    console.error('Error mencari produk:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat mencari produk',
      error: error.message
    });
  }
};

// Add Product to cart
export const addToKeranjang = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const userId = req.user.id;
    const produkId = req.params.id; // ID produk dari parameter URL
    const { stok_produk_id, jumlah_dibeli } = req.body;

    // Validasi input
    if (!stok_produk_id || !jumlah_dibeli || jumlah_dibeli <= 0) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Stok Produk ID dan jumlah dibeli harus diisi dengan benar'
      });
    }

    // Cek apakah produk ada
    const produk = await Produk.findByPk(produkId);
    if (!produk) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Produk tidak ditemukan'
      });
    }

    // Cek apakah produk ditampilkan
    if (produk.tampilkan_produk !== 1) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Produk tidak tersedia untuk dibeli'
      });
    }

    // Cek stok produk
    if (produk.stok_produk < jumlah_dibeli) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Stok produk tidak mencukupi'
      });
    }

    // Hitung harga setelah diskon (jika ada)
    const hargaDiskon = produk.diskon_produk 
      ? produk.harga_produk - produk.diskon_produk 
      : produk.harga_produk;
    
    const subtotalHarga = hargaDiskon * jumlah_dibeli;

    // Cek apakah produk sudah ada di keranjang pengguna
    let keranjangItem = await KeranjangProduk.findOne({
      where: {
        user_id: userId,
        produk_id: produkId,
        stok_produk_id
      },
      transaction
    });

    if (keranjangItem) {
      // Update jumlah dan subtotal jika produk sudah ada di keranjang
      keranjangItem.jumlah_dibeli += parseInt(jumlah_dibeli);
      keranjangItem.subtotal_harga = hargaDiskon * keranjangItem.jumlah_dibeli;
      
      await keranjangItem.save({ transaction });
    } else {
      // Buat item baru di keranjang jika produk belum ada
      keranjangItem = await KeranjangProduk.create({
        user_id: userId,
        produk_id: produkId,
        stok_produk_id,
        jumlah_dibeli,
        subtotal_harga: subtotalHarga
      }, { transaction });
    }

    await transaction.commit();

    // Mendapatkan data produk untuk respons
    const produkData = {
      id: produk.id,
      nama_produk: produk.nama_produk,
      harga_produk: produk.harga_produk,
      diskon_produk: produk.diskon_produk,
      harga_setelah_diskon: hargaDiskon
    };

    return res.status(201).json({
      success: true,
      message: 'Produk berhasil ditambahkan ke keranjang',
      data: {
        keranjang_item: {
          id: keranjangItem.id,
          produk_id: keranjangItem.produk_id,
          stok_produk_id: keranjangItem.stok_produk_id,
          jumlah_dibeli: keranjangItem.jumlah_dibeli,
          subtotal_harga: keranjangItem.subtotal_harga
        },
        produk: produkData
      }
    });
  } catch (error) {
    await transaction.rollback();
    console.error('Error menambahkan produk ke keranjang:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat menambahkan produk ke keranjang',
      error: error.message
    });
  }
};
