// models/dokterModels.js

import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js'; 

const Dokter = sequelize.define('Dokter', {
  id: {
    type: DataTypes.BIGINT,
    autoIncrement: true,
    primaryKey: true,
  },
  nama: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  password: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  universitas: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  klinik_id: {
    type: DataTypes.BIGINT.UNSIGNED,
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
  tableName: 'dokter',
  timestamps: true,
  underscored: true,
});

const GambarDokter = sequelize.define('GambarDokter', {
  id: {
    type: DataTypes.BIGINT,
    autoIncrement: true,
    primaryKey: true,
  },
  dokter_id: {
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
  tableName: 'gambar_dokter',
  timestamps: true,
  underscored: true,
});

// Relasi antara Dokter dan GambarDokter
Dokter.hasMany(GambarDokter, { foreignKey: 'dokter_id', as: 'gambar_dokter' });
GambarDokter.belongsTo(Dokter, { foreignKey: 'dokter_id', as: 'dokter' });

export { Dokter, GambarDokter };