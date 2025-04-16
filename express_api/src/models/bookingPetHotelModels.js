// models/bookingPetHotelModels.js
import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";
import { Payment } from "./configPembayaranModels.js";
import { HewanPeliharaan } from "./petModels.js";
import { Klinik } from "./klinikModels.js";

// =======================
// Tabel: checkout_pet_hotel
// =======================
const CheckoutPetHotel = sequelize.define(
  "checkout_pet_hotel",
  {
    id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
    user_id: { type: DataTypes.BIGINT, allowNull: false },
    klinik_id: { type: DataTypes.BIGINT, allowNull: false },
    alamat_id: { type: DataTypes.BIGINT, allowNull: true },
    payment_id: { type: DataTypes.BIGINT, allowNull: true },
    tipe_booking_pet_hotel: {
      type: DataTypes.ENUM("jemput", "datang_ke_klinik"),
      allowNull: false,
    },
    tanggal_check_in: { type: DataTypes.DATEONLY, allowNull: false },
    tanggal_check_out: { type: DataTypes.DATEONLY, allowNull: false },
    waktu_kedatangan: { type: DataTypes.TIME, allowNull: true },
    waktu_penjemputan: { type: DataTypes.TIME, allowNull: true },
    invoice: { type: DataTypes.STRING, allowNull: false },
    total_harga: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
    created_at: { type: DataTypes.DATE, allowNull: true },
    updated_at: { type: DataTypes.DATE, allowNull: true },
  },
  {
    tableName: "checkout_pet_hotel",
    timestamps: false,
  }
);

// =======================
// Tabel: checkout_pet_hotel_detail
// =======================
const CheckoutPetHotelDetail = sequelize.define(
  "checkout_pet_hotel_detail",
  {
    id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
    checkout_pet_hotel_id: { type: DataTypes.BIGINT, allowNull: false },
    tipe_hotel_id: { type: DataTypes.BIGINT, allowNull: false },
    hewan_peliharaan_id: { type: DataTypes.BIGINT, allowNull: false },
    permintaan_khusus: { type: DataTypes.TEXT, allowNull: true },
    kondisi_hewan: { type: DataTypes.TEXT, allowNull: false },
    created_at: { type: DataTypes.DATE, allowNull: true },
    updated_at: { type: DataTypes.DATE, allowNull: true },
  },
  {
    tableName: "checkout_pet_hotel_detail",
    timestamps: false,
  }
);

// =======================
// Tabel: tipe_hotel
// =======================
const TipeHotel = sequelize.define(
  "tipe_hotel",
  {
    id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
    tipe_hotel: { type: DataTypes.STRING(255), allowNull: false },
    harga_pet_hotel: { type: DataTypes.INTEGER, allowNull: false },
    klinik_id: { type: DataTypes.BIGINT, allowNull: false },
    created_at: { type: DataTypes.DATE, allowNull: true },
    updated_at: { type: DataTypes.DATE, allowNull: true },
  },
  {
    tableName: "tipe_hotel",
    timestamps: false,
  }
);

// =======================
// Tabel: pembayaran_pet_hotel
// =======================
const PembayaranPetHotel = sequelize.define(
  "pembayaran_pet_hotel",
  {
    id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
    checkout_pet_hotel_id: { type: DataTypes.BIGINT, allowNull: false },
    status: {
      type: DataTypes.ENUM("belum-bayar", "diproses", "selesai", "tertunda"),
      allowNull: false,
    },
    kategori_status_history_id: { type: DataTypes.BIGINT, allowNull: false },
    koin_didapat: { type: DataTypes.INTEGER, defaultValue: 0 },
    bukti_pembayaran: { type: DataTypes.TEXT, allowNull: true },
    created_at: { type: DataTypes.DATE, allowNull: true },
    updated_at: { type: DataTypes.DATE, allowNull: true },
  },
  {
    tableName: "pembayaran_pet_hotel",
    timestamps: false,
  }
);

// =======================
// RELASI ANTAR MODEL
// =======================

// Relasi dengan Klinik
CheckoutPetHotel.belongsTo(Klinik, {
  foreignKey: "klinik_id",
  as: "klinik"
});
Klinik.hasMany(CheckoutPetHotel, {
  foreignKey: "klinik_id",
  as: "checkouts"
});

// Relasi dengan HewanPeliharaan
CheckoutPetHotelDetail.belongsTo(HewanPeliharaan, {
  foreignKey: "hewan_peliharaan_id",
  as: "hewan"
});
HewanPeliharaan.hasMany(CheckoutPetHotelDetail, {
  foreignKey: "hewan_peliharaan_id",
  as: "booking_details"
});

// checkout_pet_hotel to detail
CheckoutPetHotel.hasMany(CheckoutPetHotelDetail, {
  foreignKey: "checkout_pet_hotel_id",
  as: "detail_booking",
});
CheckoutPetHotelDetail.belongsTo(CheckoutPetHotel, {
  foreignKey: "checkout_pet_hotel_id",
  as: "booking",
});

// tipe_hotel to detail
TipeHotel.hasMany(CheckoutPetHotelDetail, {
  foreignKey: "tipe_hotel_id",
  as: "booking_detail",
});
CheckoutPetHotelDetail.belongsTo(TipeHotel, {
  foreignKey: "tipe_hotel_id",
  as: "tipe",
});

// pembayaran_pet_hotel to checkout
CheckoutPetHotel.hasOne(PembayaranPetHotel, {
  foreignKey: "checkout_pet_hotel_id",
  as: "pembayaran",
});
PembayaranPetHotel.belongsTo(CheckoutPetHotel, {
  foreignKey: "checkout_pet_hotel_id",
  as: "checkout",
});

// Relasi dengan Payment untuk Checkout
CheckoutPetHotel.belongsTo(Payment, {
  foreignKey: 'payment_id',
  as: 'payment'
});
Payment.hasMany(CheckoutPetHotel, {
  foreignKey: 'payment_id',
  as: 'checkouts'
});

export {
  CheckoutPetHotel,
  CheckoutPetHotelDetail,
  TipeHotel,
  PembayaranPetHotel,
};
