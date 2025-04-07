// models/mediaSectionsModels.js
import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const GambarMediaSection = sequelize.define('GambarMediaSection', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true,
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
  gambar_media_id: {
    type: DataTypes.BIGINT,
    allowNull: false,
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
MediaSection.belongsTo(GambarMediaSection, { foreignKey: 'gambarMediaId', as: 'gambarMedia' });
GambarMediaSection.hasMany(MediaSection, { foreignKey: 'gambarMediaId', as: 'mediaSections' }); 

export { GambarMediaSection, MediaSection };