import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

// === Model Klinik ===
const Klinik = sequelize.define('Klinik', {
  id: {
    type: DataTypes.BIGINT,
    autoIncrement: true,
    primaryKey: true,
  },
  nama_klinik: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  deskripsi_klinik: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  alamat_klinik: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  no_tlpn_klinik: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  no_rekening_klinik : {
    type: DataTypes.BIGINT,
    allowNull: false,
  },
  harga_konsultasi: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
  },
  maps: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  updated_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  latitude: {
    type: DataTypes.DECIMAL(10, 8),
    allowNull: false,
  },
  longitude: {
    type: DataTypes.DECIMAL(11, 8),
    allowNull: false,
  },  
}, {
  tableName: 'klinik',
  timestamps: true,
  underscored: true,
});

// === Model LayananKlinik ===
const LayananKlinik = sequelize.define('LayananKlinik', {
  id: {
    type: DataTypes.BIGINT,
    autoIncrement: true,
    primaryKey: true,
  },
  klinik_id: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: false,
  },
  nama_layanan: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
    harga_layanan: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  updated_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: 'layanan_klinik',
  timestamps: true,
  underscored: true,
});

// === Model JadwalBukaKlinik ===
const JadwalBukaKlinik = sequelize.define('JadwalBukaKlinik', {
  id: {
    type: DataTypes.BIGINT,
    autoIncrement: true,
    primaryKey: true,
  },
  klinik_id: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: false,
  },
  hari: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  jam_mulai: {
    type: DataTypes.TIME,
    allowNull: false,
  },
  jam_selesai: {
    type: DataTypes.TIME,
    allowNull: false,
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  updated_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: 'jadwal_buka_klinik',
  timestamps: true,
  underscored: true,
});

// === Model GambarKlinik ===
const GambarKlinik = sequelize.define('GambarKlinik', {
  id: {
    type: DataTypes.BIGINT,
    autoIncrement: true,
    primaryKey: true,
  },
  klinik_id: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: false,
  },
  thumbnail_klinik: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  logo_klinik: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  updated_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: 'gambar_klinik',
  timestamps: true,
  underscored: true,
});

// === RELASI ===

// Klinik → LayananKlinik
Klinik.hasMany(LayananKlinik, { foreignKey: 'klinik_id', as: 'layanan' });
LayananKlinik.belongsTo(Klinik, { foreignKey: 'klinik_id', as: 'klinik' });

// Klinik → JadwalBukaKlinik
Klinik.hasMany(JadwalBukaKlinik, { foreignKey: 'klinik_id', as: 'jadwal_buka' });
JadwalBukaKlinik.belongsTo(Klinik, { foreignKey: 'klinik_id', as: 'klinik' });

// Klinik → GambarKlinik
Klinik.hasMany(GambarKlinik, { foreignKey: 'klinik_id', as: 'gambar' });
GambarKlinik.belongsTo(Klinik, { foreignKey: 'klinik_id', as: 'klinik' });

export { Klinik, LayananKlinik, JadwalBukaKlinik, GambarKlinik };
