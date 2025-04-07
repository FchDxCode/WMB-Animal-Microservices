// produkModels.js

import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const KategoriProduk = sequelize.define('KategoriProduk', {
  id: {
    type: DataTypes.BIGINT,
    autoIncrement: true,
    primaryKey: true,
  },
  nama: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  slug: {
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
  tableName: 'kategori_produk',
  timestamps: true,
  underscored: true,
});

const Produk = sequelize.define('Produk', {
  id: {
    type: DataTypes.BIGINT,
    autoIncrement: true,
    primaryKey: true,
  },
  kategori_produk_id: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: false,
  },
  nama_produk: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  slug: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  deskripsi: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  total_produk: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  tampilkan_produk: {
    type: DataTypes.TINYINT(1),
    allowNull: false,
    defaultValue: 1,
  },
  harga_produk: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  diskon_produk: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
  },
  stok_produk: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  coin_perbarang: {
    type: DataTypes.INTEGER,
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
  tableName: 'produk',
  timestamps: true,
  underscored: true,
});

const GambarProduk = sequelize.define('GambarProduk', {
  id: {
    type: DataTypes.BIGINT,
    autoIncrement: true,
    primaryKey: true,
  },
  produk_id: {
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
  tableName: 'gambar_produk',
  timestamps: true,
  underscored: true,
});

// Relasi antara Produk dan KategoriProduk
Produk.belongsTo(KategoriProduk, { foreignKey: 'kategori_produk_id', as: 'kategori' });
KategoriProduk.hasMany(Produk, { foreignKey: 'kategori_produk_id', as: 'produk' });

// Relasi antara Produk dan GambarProduk
Produk.hasMany(GambarProduk, { foreignKey: 'produk_id', as: 'gambar_produk' });
GambarProduk.belongsTo(Produk, { foreignKey: 'produk_id', as: 'produk' });

export { KategoriProduk, Produk, GambarProduk };