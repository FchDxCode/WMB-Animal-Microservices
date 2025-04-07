import { MediaSection, GambarMediaSection } from '../models/mediaSectionsModels.js';
import { uploadFolders, createImageUrl } from '../utils/uploadUtils.js';

// Helper function untuk format data media section
const formatMediaSection = (section, gambarList) => {
  // Format gambar media jika ada
  const formattedGambar = gambarList.map(gambar => ({
    id: gambar.id,
    gambar_media: createImageUrl(gambar.gambar_media, uploadFolders.mediaSections)
  }));

  return {
    id: section.id,
    nama_section: section.nama_section,
    judul: section.judul,
    deskripsi: section.deskripsi,
    is_active: section.is_active,
    gambarMedia: formattedGambar,
    createdAt: section.created_at,
    updatedAt: section.updated_at
  };
};

// API untuk mengambil semua media section
export const getAllMediaSections = async (req, res) => {
  try {
    // Query semua media sections
    const mediaSections = await MediaSection.findAll({
      order: [['id', 'ASC']],
    });

    // Ambil semua gambar yang terkait dengan media sections
    const allMediaSectionIds = mediaSections.map(section => section.id);
    const allGambar = await GambarMediaSection.findAll({
      where: {
        media_sections_id: allMediaSectionIds
      }
    });

    // Format response
    const formattedSections = mediaSections.map(section => {
      // Filter gambar untuk section ini
      const sectionGambar = allGambar.filter(gambar => 
        gambar.media_sections_id === section.id
      );
      
      return formatMediaSection(section, sectionGambar);
    });

    res.status(200).json({
      success: true,
      message: 'Berhasil mengambil semua data media section',
      data: formattedSections,
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

// API untuk mengambil media section berdasarkan nama section
export const getMediaSectionsByName = async (req, res) => {
  try {
    const { nama_section } = req.query;

    if (!nama_section) {
      return res.status(400).json({
        success: false,
        message: 'Parameter nama_section diperlukan',
      });
    }

    // Query media sections berdasarkan nama
    const mediaSections = await MediaSection.findAll({
      where: { nama_section },
      order: [['id', 'ASC']],
    });

    if (mediaSections.length === 0) {
      return res.status(404).json({
        success: false,
        message: `Media section dengan nama ${nama_section} tidak ditemukan`,
      });
    }

    // Ambil semua ID section yang ditemukan
    const sectionIds = mediaSections.map(section => section.id);
    
    // Ambil semua gambar terkait
    const allGambar = await GambarMediaSection.findAll({
      where: {
        media_sections_id: sectionIds
      }
    });

    // Format response
    const formattedSections = mediaSections.map(section => {
      // Filter gambar untuk section ini
      const sectionGambar = allGambar.filter(gambar => 
        gambar.media_sections_id === section.id
      );
      
      return formatMediaSection(section, sectionGambar);
    });

    res.status(200).json({
      success: true,
      message: `Berhasil mengambil data media section dengan nama ${nama_section}`,
      data: formattedSections,
    });
  } catch (error) {
    console.error('Error getMediaSectionsByName:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada server',
      error: error.message
    });
  }
};

// API untuk mengambil media section berdasarkan ID
export const getMediaSectionById = async (req, res) => {
  try {
    const { id } = req.params;

    // Query media section berdasarkan ID
    const mediaSection = await MediaSection.findByPk(id);

    if (!mediaSection) {
      return res.status(404).json({
        success: false,
        message: 'Media section tidak ditemukan',
      });
    }

    // Ambil gambar terkait
    const gambarMedia = await GambarMediaSection.findAll({
      where: { media_sections_id: id }
    });

    // Format response
    const formattedSection = formatMediaSection(mediaSection, gambarMedia);

    res.status(200).json({
      success: true,
      message: 'Berhasil mengambil detail media section',
      data: formattedSection,
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