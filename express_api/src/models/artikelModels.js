import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

// === Model Artikel ===
const Artikel = sequelize.define('Artikel', {
  id: {
    type: DataTypes.BIGINT,
    autoIncrement: true,
    primaryKey: true,
  },
  judul_artikel: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  preview_deskripsi_artikel: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  deskripsi_artikel: {
    type: DataTypes.TEXT('long'),
    allowNull: true,
  },
  jadwal_posting_artikel: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  tampilkan_artikel: {
    type: DataTypes.TINYINT(1),
    allowNull: false,
    defaultValue: 1,
  },
  jumlah_dilihat: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
    defaultValue: 0,
  },
  created_at: {
    type: DataTypes.DATE,
    allowNull: true,
    defaultValue: DataTypes.NOW,
  },
  updated_at: {
    type: DataTypes.DATE,
    allowNull: true,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: 'artikel',
  timestamps: true,
  underscored: true,
});

// === Model GambarArtikel ===
const GambarArtikel = sequelize.define('GambarArtikel', {
  id: {
    type: DataTypes.BIGINT,
    autoIncrement: true,
    primaryKey: true,
  },
  artikel_id: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: false,
  },
  thumbnail_artikel: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  created_at: {
    type: DataTypes.DATE,
    allowNull: true,
    defaultValue: DataTypes.NOW,
  },
  updated_at: {
    type: DataTypes.DATE,
    allowNull: true,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: 'gambar_artikel',
  timestamps: true,
  underscored: true,
});

// === RELASI ===
Artikel.hasMany(GambarArtikel, { foreignKey: 'artikel_id', as: 'gambar' });
GambarArtikel.belongsTo(Artikel, { foreignKey: 'artikel_id', as: 'artikel' });

export { Artikel, GambarArtikel };
