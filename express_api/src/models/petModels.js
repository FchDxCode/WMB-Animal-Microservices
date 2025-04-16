// petModels.js

import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

// Model HewanPeliharaan
const HewanPeliharaan = sequelize.define(
  'HewanPeliharaan',
  {
    id: {
      type: DataTypes.BIGINT,
      autoIncrement: true,
      primaryKey: true,
    },
    user_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false,
    },
    nama_hewan: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    jenis_hewan_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false,
    },
    jenis_kelamin: {
      type: DataTypes.ENUM('jantan', 'betina', 'nonbinary'),
      allowNull: false,
    },
    jenis_ras: {
      type: DataTypes.BIGINT,
      allowNull: true,
    },
    tanggal_lahir_hewan: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    berat_badan: {
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
  },
  {
    tableName: 'hewan_peliharaan',
    timestamps: true,
    underscored: true,
  }
);

// Model GambarHewan
const GambarHewan = sequelize.define(
  'GambarHewan',
  {
    id: {
      type: DataTypes.BIGINT,
      autoIncrement: true,
      primaryKey: true,
    },
    hewan_peliharaan_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false,
    },
    profile_hewan: {
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
  },
  {
    tableName: 'gambar_hewan',
    timestamps: true,
    underscored: true,
  }
);


// Model jenis_hewan
const JenisHewan = sequelize.define(
  'JenisHewan',
  {
    id: {
      type: DataTypes.BIGINT,
      autoIncrement: true,
      primaryKey: true,
    },
    jenis_hewan_peliharaan: {
      type: DataTypes.STRING(255),
      allowNull: false,
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
  },
  {
    tableName: 'jenis_hewan',
    timestamps: true,
    underscored: true,
  }
)

// Model ras_hewan
const RasHewan = sequelize.define(
  'RasHewan',
  {
    id: {
      type: DataTypes.BIGINT,
      autoIncrement: true,
      primaryKey: true,
    },
    jenis_hewan_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false,
    },
    nama_ras_hewan: {
      type: DataTypes.STRING(255),
      allowNull: false,
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
  },
  {
    tableName: 'ras_hewan',
    timestamps: true,
    underscored: true,
  }
);

// Relasi
HewanPeliharaan.hasMany(GambarHewan, { foreignKey: 'hewan_peliharaan_id', as: 'gambar' });
GambarHewan.belongsTo(HewanPeliharaan, { foreignKey: 'hewan_peliharaan_id', as: 'hewan' });
RasHewan.belongsTo(JenisHewan, { foreignKey: 'jenis_hewan_id', as: 'jenis' });
JenisHewan.hasMany(RasHewan, { foreignKey: 'jenis_hewan_id', as: 'rasHewan' });

// Add the missing association here
HewanPeliharaan.belongsTo(JenisHewan, { foreignKey: 'jenis_hewan_id', as: 'jenis' });
JenisHewan.hasMany(HewanPeliharaan, { foreignKey: 'jenis_hewan_id', as: 'hewanPeliharaans' });

export { HewanPeliharaan, GambarHewan, RasHewan, JenisHewan };
