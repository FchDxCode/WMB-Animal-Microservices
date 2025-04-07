// configWebsiteModels.js

import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js'; 

const GambarKonfigurasi = sequelize.define('GambarKonfigurasi', {
  id: {
    type: DataTypes.BIGINT,
    autoIncrement: true,
    primaryKey: true,
  },
  konfigurasi_id: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: false,
  },
  gambar: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  created_at: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  updated_at: {
    type: DataTypes.DATE,
    allowNull: true,
  },
}, {
  tableName: 'gambar_konfigurasi',
  timestamps: true,
  underscored: true,
});

const Konfigurasi = sequelize.define('Konfigurasi', {
  id: {
    type: DataTypes.BIGINT,
    autoIncrement: true,
    primaryKey: true,
  },
  nama_perusahaan: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  no_tlpn: {
    type: DataTypes.STRING(20),
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  alamat: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  payment_guide: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  syarat_ketentuan: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  kebijakan_privasi: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  created_at: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  updated_at: {
    type: DataTypes.DATE,
    allowNull: true,
  },
}, {
  tableName: 'konfigurasi',
  timestamps: true,
  underscored: true,
});

// Relasi
Konfigurasi.hasMany(GambarKonfigurasi, { foreignKey: 'konfigurasi_id', as: 'gambar_konfigurasi' });
GambarKonfigurasi.belongsTo(Konfigurasi, { foreignKey: 'konfigurasi_id', as: 'konfigurasi' });

export { GambarKonfigurasi, Konfigurasi };