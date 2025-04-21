// bookingHouseCallModels.js
import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js'; 
import { Klinik, LayananKlinik } from './klinikModels.js';
import { AlamatUser } from './alamatUserModels.js';
import { HewanPeliharaan } from './petModels.js';
import { Payment } from './configPembayaranModels.js';

// Tabel: checkout_house_call
export const CheckoutHouseCall = sequelize.define('checkout_house_call', {
  id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
  klinik_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
  layanan_klinik_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
  user_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
  alamat_user_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
  payment_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
  tanggal_booking: { type: DataTypes.DATEONLY, allowNull: false },
  total_pesanan: { type: DataTypes.INTEGER, allowNull: false },
  invoice: { type: DataTypes.STRING(255), allowNull: false },
  created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  updated_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
}, {
  tableName: 'checkout_house_call',
  timestamps: false
});

// Tabel: detail_house_call
export const DetailHouseCall = sequelize.define('detail_house_call', {
  id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
  checkout_house_call_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
  hewan_peliharaan_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
  keluhan: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
  created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  updated_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
}, {
  tableName: 'detail_house_call',
  timestamps: false
});

// Tabel: pembayaran_house_call
export const PembayaranHouseCall = sequelize.define('pembayaran_house_call', {
  id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
  house_call_checkout_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
  bukti_pembayaran: { type: DataTypes.STRING(255), allowNull: true },
  status: {
    type: DataTypes.ENUM('belum-bayar', 'diproses', 'selesai', 'tertunda'),
    allowNull: false,
    defaultValue: 'belum-bayar'
  },
  kategori_status_history_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
  koin_didapat: { type: DataTypes.INTEGER, defaultValue: 0 },
  expired_at: { type: DataTypes.DATE, allowNull: true },
  created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  updated_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
}, {
  tableName: 'pembayaran_house_call',
  timestamps: false
});


// RELASI
CheckoutHouseCall.hasMany(DetailHouseCall, { foreignKey: 'checkout_house_call_id' });
DetailHouseCall.belongsTo(CheckoutHouseCall, { foreignKey: 'checkout_house_call_id' });

CheckoutHouseCall.hasOne(PembayaranHouseCall, { foreignKey: 'house_call_checkout_id' });
PembayaranHouseCall.belongsTo(CheckoutHouseCall, { foreignKey: 'house_call_checkout_id' });

// Additional relations
CheckoutHouseCall.belongsTo(Klinik, { foreignKey: 'klinik_id', as: 'klinik' });
CheckoutHouseCall.belongsTo(LayananKlinik, { foreignKey: 'layanan_klinik_id', as: 'layanan' });
CheckoutHouseCall.belongsTo(AlamatUser, { foreignKey: 'alamat_user_id', as: 'alamat' });
CheckoutHouseCall.belongsTo(Payment, { foreignKey: 'payment_id', as: 'payment' });

DetailHouseCall.belongsTo(HewanPeliharaan, { foreignKey: 'hewan_peliharaan_id', as: 'hewan' });
