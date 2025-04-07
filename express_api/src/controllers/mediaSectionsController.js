import { MediaSection, GambarMediaSection } from '../models/mediaSectionsModels.js';
import { uploadFolders, createImageUrl } from '../utils/uploadUtils.js';

// Helper function untuk format data media section
const formatMediaSection = (mediaSection) => {
  const gambarMedia = mediaSection.gambarMedia 
    ? {
        id: mediaSection.gambarMedia.id,
        gambar_media: createImageUrl(mediaSection.gambarMedia.gambar_media, uploadFolders.mediaSections)
      }
    : null;

  return {
    id: mediaSection.id,
    nama_section: mediaSection.nama_section,
    judul: mediaSection.judul,
    deskripsi: mediaSection.deskripsi,
    gambar_media_id: mediaSection.gambar_media_id,
    is_active: mediaSection.is_active,
    gambarMedia: gambarMedia,
    createdAt: mediaSection.createdAt,
    updatedAt: mediaSection.updatedAt
  };
};

export const getAllMediaSections = async (req, res) => {
  try {
    const { nama_section } = req.query;

    const whereClause = {};
    if (nama_section) {
      whereClause.nama_section = nama_section;
    }

    const mediaSections = await MediaSection.findAll({
      where: whereClause,
      include: {
        model: GambarMediaSection,
        as: 'gambarMedia',
        attributes: ['id', 'gambar_media'],
      },
      order: [['id', 'ASC']],
    });

    // Format response dengan URL gambar lengkap
    const formattedMediaSections = mediaSections.map(section => formatMediaSection(section));

    res.status(200).json({
      success: true,
      message: `Berhasil mengambil data media${nama_section ? ` untuk section ${nama_section}` : ''}`,
      data: formattedMediaSections,
    });
  } catch (error) {
    console.error('Error getAllMediaSections:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada server',
      error: error.message
    });
  }
};

export const getMediaSectionById = async (req, res) => {
  try {
    const { id } = req.params;

    const mediaSection = await MediaSection.findByPk(id, {
      include: {
        model: GambarMediaSection,
        as: 'gambarMedia',
        attributes: ['id', 'gambar_media'],
      },
    });

    if (!mediaSection) {
      return res.status(404).json({
        success: false,
        message: 'Media section tidak ditemukan',
      });
    }

    // Format response dengan URL gambar lengkap
    const formattedMediaSection = formatMediaSection(mediaSection);

    res.status(200).json({
      success: true,
      message: 'Berhasil mengambil detail media section',
      data: formattedMediaSection,
    });
  } catch (error) {
    console.error('Error getMediaSectionById:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada server',
      error: error.message
    });
  }
};
