import { Konfigurasi, GambarKonfigurasi } from '../models/configWebsiteModels.js';
import { uploadFolders, createImageUrl } from '../utils/uploadUtils.js';

const formatConfigData = (config, selectedFields = []) => {
  if (!config) return null;

  const formattedGambarKonfigurasi = config.gambar_konfigurasi
    ? config.gambar_konfigurasi.map(gambar => ({
        id: gambar.id,
        konfigurasi_id: gambar.konfigurasi_id,
        gambar: createImageUrl(gambar.gambar, uploadFolders.configImages),
        created_at: gambar.created_at,
        updated_at: gambar.updated_at,
      }))
    : [];

  let responseData = {};
  if (selectedFields.length === 0 || selectedFields.includes('id')) responseData.id = config.id;
  if (selectedFields.length === 0 || selectedFields.includes('nama_perusahaan')) responseData.nama_perusahaan = config.nama_perusahaan;
  if (selectedFields.length === 0 || selectedFields.includes('no_tlpn')) responseData.no_tlpn = config.no_tlpn;
  if (selectedFields.length === 0 || selectedFields.includes('email')) responseData.email = config.email;
  if (selectedFields.length === 0 || selectedFields.includes('alamat')) responseData.alamat = config.alamat;
  if (selectedFields.length === 0 || selectedFields.includes('payment_guide')) responseData.payment_guide = config.payment_guide;
  if (selectedFields.length === 0 || selectedFields.includes('syarat_ketentuan')) responseData.syarat_ketentuan = config.syarat_ketentuan;
  if (selectedFields.length === 0 || selectedFields.includes('kebijakan_privasi')) responseData.kebijakan_privasi = config.kebijakan_privasi;
  if (selectedFields.length === 0 || selectedFields.includes('gambar_konfigurasi')) responseData.gambar_konfigurasi = formattedGambarKonfigurasi;
  if (selectedFields.length === 0 || selectedFields.includes('created_at')) responseData.created_at = config.created_at;
  if (selectedFields.length === 0 || selectedFields.includes('updated_at')) responseData.updated_at = config.updated_at;

  return responseData;
};

export const getConfigWebsite = async (req, res) => {
  try {
    
    const fieldsParam = req.query.fields; 
    const selectedFields = fieldsParam ? fieldsParam.split(',') : [];

    const config = await Konfigurasi.findOne({
      include: [
        {
          model: GambarKonfigurasi,
          as: 'gambar_konfigurasi',
          attributes: ['id', 'konfigurasi_id', 'gambar', 'created_at', 'updated_at'],
        },
      ],
    });

    if (!config) {
      return res.status(404).json({
        success: false,
        message: 'Data konfigurasi tidak ditemukan',
      });
    }

    const formattedConfig = formatConfigData(config, selectedFields);

    return res.status(200).json({
      success: true,
      message: 'Berhasil mengambil data konfigurasi website',
      data: formattedConfig,
    });
  } catch (error) {
    console.error('Error getConfigWebsite:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada server',
      error: error.message,
    });
  }
};
