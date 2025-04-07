import { Artikel, GambarArtikel } from '../models/artikelModels.js';
import { Op } from 'sequelize';
import path from 'path';
import { uploadPaths, createImageUrl, uploadFolders } from '../utils/uploadUtils.js';

// Gunakan path dari uploadUtils
const UPLOAD_DIR = uploadPaths.artikelImages;

// Ambil base path untuk artikel dari uploadPaths
const ARTIKEL_PATH = 'artikel-images'; // Nama folder untuk artikel
const BASE_STORAGE_PATH = process.env.STORAGE_PATH || 'public/storage';

// Get date for today's start (00:00:00)
const getToday = () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
};

/**
 * Format artikel untuk response
 */
const formatArticle = (artikel, type, today) => ({
  id: artikel.id,
  judul: artikel.judul_artikel,
  preview: artikel.preview_deskripsi_artikel,
  thumbnail: artikel.gambar?.[0]?.thumbnail_artikel 
    ? createImageUrl(artikel.gambar[0].thumbnail_artikel, uploadFolders.artikelImages)
    : null,
  tanggal_posting: artikel.created_at,
  jumlah_dilihat: artikel.jumlah_dilihat,
  article_type: type,
  created_today: new Date(artikel.created_at).setHours(0,0,0,0) === today.getTime()
});

/**
 * Format gambar untuk detail artikel
 */
const formatGambarList = (gambarList) => {
  return gambarList.map(img => ({
    id: img.id,
    url: img.thumbnail_artikel ? createImageUrl(img.thumbnail_artikel, uploadFolders.artikelImages) : null
  }));
};

/**
 * Mendapatkan daftar artikel dengan urutan: artikel terbaru dan terpopuler dulu, lalu artikel terbaru lainnya
 * @route GET /api/artikel
 */
export const getArtikelList = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      search = '' 
    } = req.query;
    
    const offset = (parseInt(page) - 1) * parseInt(limit);
    
    // Base where condition
    const baseWhereCondition = {
      ...(search && {
        judul_artikel: {
          [Op.like]: `%${search}%`
        }
      })
    };

    const today = getToday();

    // 1. Ambil artikel populer hari ini
    const popularArticles = await Artikel.findAll({
      where: {
        ...baseWhereCondition,
        created_at: {
          [Op.gte]: today
        },
        jumlah_dilihat: {
          [Op.gte]: 10 // Threshold untuk artikel populer
        }
      },
      include: [{
        model: GambarArtikel,
        as: 'gambar',
        attributes: ['id', 'thumbnail_artikel'],
        required: false
      }],
      order: [
        ['jumlah_dilihat', 'DESC']
      ]
    });

    // 2. Ambil artikel terbaru hari ini (yang bukan artikel populer)
    const popularIds = popularArticles.map(article => article.id);
    const recentArticles = await Artikel.findAll({
      where: {
        ...baseWhereCondition,
        id: {
          [Op.notIn]: popularIds.length ? popularIds : [0]
        },
        created_at: {
          [Op.gte]: today
        }
      },
      include: [{
        model: GambarArtikel,
        as: 'gambar',
        attributes: ['id', 'thumbnail_artikel'],
        required: false
      }],
      order: [
        ['created_at', 'DESC']
      ]
    });

    // 3. Ambil artikel lainnya
    const todayArticleIds = [...popularIds, ...recentArticles.map(article => article.id)];
    const regularArticles = await Artikel.findAll({
      where: {
        ...baseWhereCondition,
        id: {
          [Op.notIn]: todayArticleIds.length ? todayArticleIds : [0]
        }
      },
      include: [{
        model: GambarArtikel,
        as: 'gambar',
        attributes: ['id', 'thumbnail_artikel'],
        required: false
      }],
      order: [
        ['created_at', 'DESC']
      ],
      limit: parseInt(limit) - (popularArticles.length + recentArticles.length),
      offset: offset > (popularArticles.length + recentArticles.length) ? 
        offset - (popularArticles.length + recentArticles.length) : 0
    });

    // Gabungkan dan format semua artikel
    const formattedArticles = [
      ...popularArticles.map(article => formatArticle(article, 'popular', today)),
      ...recentArticles.map(article => formatArticle(article, 'recent', today)),
      ...regularArticles.map(article => formatArticle(article, 'regular', today))
    ];

    // Hitung total data untuk pagination
    const totalCount = await Artikel.count({
      where: baseWhereCondition
    });

    return res.status(200).json({
      status: true,
      message: 'Berhasil mengambil data artikel',
      data: formattedArticles,
      pagination: {
        total_data: totalCount,
        total_halaman: Math.ceil(totalCount / parseInt(limit)),
        halaman_aktif: parseInt(page),
        jumlah_per_halaman: parseInt(limit)
      },
      summary: {
        popular_count: popularArticles.length,
        recent_count: recentArticles.length,
        regular_count: regularArticles.length
      }
    });

  } catch (error) {
    console.error('Error pada getArtikelList:', error);
    return res.status(500).json({
      status: false,
      message: 'Terjadi kesalahan saat mengambil data artikel',
      error: error.message
    });
  }
};

/**
 * Mendapatkan detail artikel berdasarkan ID
 * @route GET /api/artikel/:id
 */
export const getArtikelDetail = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        status: false,
        message: 'ID artikel diperlukan',
      });
    }

    const artikel = await Artikel.findOne({
      where: {
        id,
        tampilkan_artikel: 1
      },
      include: [
        {
          model: GambarArtikel,
          as: 'gambar',
          attributes: ['id', 'thumbnail_artikel'],
        },
      ],
      logging: console.log
    });

    console.log('Artikel yang ditemukan:', artikel);

    if (!artikel) {
      return res.status(404).json({
        status: false,
        message: 'Artikel tidak ditemukan',
      });
    }

    // Update jumlah dilihat
    await artikel.increment('jumlah_dilihat');

    // Format data untuk response menggunakan helper function
    const artikelData = {
      id: artikel.id,
      judul: artikel.judul_artikel,
      preview: artikel.preview_deskripsi_artikel,
      deskripsi: artikel.deskripsi_artikel,
      tanggal_posting: artikel.jadwal_posting_artikel || artikel.created_at,
      jumlah_dilihat: artikel.jumlah_dilihat + 1,
      gambar: formatGambarList(artikel.gambar)
    };

    return res.status(200).json({
      status: true,
      message: 'Berhasil mengambil detail artikel',
      data: artikelData
    });
  } catch (error) {
    console.error('Error pada getArtikelDetail:', error);
    return res.status(500).json({
      status: false,
      message: 'Terjadi kesalahan saat mengambil detail artikel',
      error: error.message
    });
  }
};