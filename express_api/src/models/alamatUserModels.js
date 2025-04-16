import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

// === Model AlamatUser ===
const AlamatUser = sequelize.define('AlamatUser', {
  id: {
    type: DataTypes.BIGINT,
    autoIncrement: true,
    primaryKey: true,
  },
  user_id: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: false,
  },
  nama_lengkap: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  no_tlpn: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  provinsi_id: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: false,
  },
  kabupaten_kota_id: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: false,
  },
  kecamatan_id: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: false,
  },
  kode_pos: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  maps: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  detail_alamat: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  latitude: {
    type: DataTypes.DECIMAL(10, 8),
    allowNull: true,
  },
  longitude: {
    type: DataTypes.DECIMAL(11, 8),
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
  tableName: 'alamat_user',
  timestamps: true,
  underscored: true,
});


// === Model Provinsi ===
const Provinsi = sequelize.define('Provinsi', {
  id: {
    type: DataTypes.BIGINT,
    autoIncrement: true,
    primaryKey: true,
  },
  provinsi: {
    type: DataTypes.STRING(255),
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
  tableName: 'provinsi',
  timestamps: true,
  underscored: true,
});

// === Model KabupatenKota ===
const KabupatenKota = sequelize.define('KabupatenKota', {
  id: {
    type: DataTypes.BIGINT,
    autoIncrement: true,
    primaryKey: true,
  },
  provinsi_id: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: false,
  },
  nama_kabupaten_kota: {
    type: DataTypes.STRING(255),
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
  tableName: 'kabupaten_kota',
  timestamps: true,
  underscored: true,
});

// === Model Kecamatan ===
const Kecamatan = sequelize.define('Kecamatan', {
  id: {
    type: DataTypes.BIGINT,
    autoIncrement: true,
    primaryKey: true,
  },
  kabupaten_id: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: false,
  },
  nama_kecamatan: {
    type: DataTypes.STRING(255),
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
  tableName: 'kecamatan',
  timestamps: true,
  underscored: true,
});

// === RELASI ===
AlamatUser.belongsTo(Provinsi, { foreignKey: 'provinsi_id', as: 'provinsi' });
AlamatUser.belongsTo(KabupatenKota, { foreignKey: 'kabupaten_kota_id', as: 'kabupatenKota' });
AlamatUser.belongsTo(Kecamatan, { foreignKey: 'kecamatan_id', as: 'kecamatan' });

KabupatenKota.belongsTo(Provinsi, { foreignKey: 'provinsi_id', as: 'provinsi' });
Provinsi.hasMany(KabupatenKota, { foreignKey: 'provinsi_id', as: 'kabupatenKota' });

Kecamatan.belongsTo(KabupatenKota, { foreignKey: 'kabupaten_id', as: 'kabupatenKota' });
KabupatenKota.hasMany(Kecamatan, { foreignKey: 'kabupaten_id', as: 'kecamatan' });

export { AlamatUser, Provinsi, KabupatenKota, Kecamatan };
