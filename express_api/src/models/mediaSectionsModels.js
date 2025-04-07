// models/mediaSectionsModels.js
import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const GambarMediaSection = sequelize.define('GambarMediaSection', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true,
  },
  media_sections_id: {
    type: DataTypes.BIGINT,
    allowNull: false,
  },
  gambar_media: {
    type: DataTypes.STRING,
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  updated_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    onUpdate: DataTypes.NOW,
  },
}, {
  tableName: 'gambar_media', 
  timestamps: true,
  underscored: true,
});

const MediaSection = sequelize.define('MediaSection', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true,
  },
  nama_section: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  judul: {
    type: DataTypes.STRING,
  },
  deskripsi: {
    type: DataTypes.TEXT,
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  updated_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    onUpdate: DataTypes.NOW,
  },
}, {
  tableName: 'media_sections', 
  timestamps: true,
  underscored: true,
});

// Relasi
MediaSection.hasMany(GambarMediaSection, {foreignKey: 'media_sections_id',as: 'gambarMedia', });
GambarMediaSection.belongsTo(MediaSection, {foreignKey: 'media_sections_id', as: 'mediaSection', });

export { GambarMediaSection, MediaSection };