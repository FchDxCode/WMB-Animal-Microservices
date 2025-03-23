-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Mar 20, 2025 at 12:57 PM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `wmb_project`
--

-- --------------------------------------------------------

--
-- Table structure for table `admin`
--

CREATE TABLE `admin` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `nama` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `role` int(11) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `alamat_user`
--

CREATE TABLE `alamat_user` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `user_id` bigint(20) UNSIGNED NOT NULL,
  `nama_lengkap` varchar(255) NOT NULL,
  `no_tlpn` varchar(255) NOT NULL,
  `provinsi_id` bigint(20) UNSIGNED NOT NULL,
  `kabupaten_kota_id` bigint(20) UNSIGNED NOT NULL,
  `kecamatan_id` bigint(20) UNSIGNED NOT NULL,
  `kode_pos` varchar(255) NOT NULL,
  `maps` varchar(255) NOT NULL,
  `detail_alamat` text NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `artikel`
--

CREATE TABLE `artikel` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `judul_artikel` varchar(255) NOT NULL,
  `preview_deskripsi_artikel` text NOT NULL,
  `deskripsi_artikel` longtext NOT NULL,
  `jadwal_posting_artikel` datetime DEFAULT NULL,
  `tampilkan_artikel` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `booking_klinik`
--

CREATE TABLE `booking_klinik` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `user_id` bigint(20) UNSIGNED NOT NULL,
  `klinik_id` bigint(20) UNSIGNED NOT NULL,
  `layanan_klinik_id` bigint(20) UNSIGNED DEFAULT NULL,
  `alamat_user_id` bigint(20) UNSIGNED NOT NULL,
  `tipe_booking` enum('booking_antar_jemput','booking_ke_klinik') NOT NULL,
  `tanggal_booking` date NOT NULL,
  `waktu_booking` time NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `booking_pet_hotel`
--

CREATE TABLE `booking_pet_hotel` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `pet_hotel_id` bigint(20) UNSIGNED NOT NULL,
  `hewan_peliharaan_id` bigint(20) UNSIGNED NOT NULL,
  `tipe_hotel_id` bigint(20) UNSIGNED NOT NULL,
  `permintaan_khusus` text DEFAULT NULL,
  `kondisi_hewan` text NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `cache`
--

CREATE TABLE `cache` (
  `key` varchar(255) NOT NULL,
  `value` mediumtext NOT NULL,
  `expiration` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `cache_locks`
--

CREATE TABLE `cache_locks` (
  `key` varchar(255) NOT NULL,
  `owner` varchar(255) NOT NULL,
  `expiration` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `chat_konsultasi`
--

CREATE TABLE `chat_konsultasi` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `konsultasi_online_id` bigint(20) UNSIGNED NOT NULL,
  `user_id` bigint(20) UNSIGNED NOT NULL,
  `dokter_id` bigint(20) UNSIGNED NOT NULL,
  `pesan_konsultasi` text NOT NULL,
  `status_pesan_konsultasi` enum('terkirim','dibaca','dihapus') NOT NULL DEFAULT 'terkirim',
  `waktu_mulai_konsultasi` timestamp NULL DEFAULT NULL,
  `waktu_selesai_konsultasi` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `checkout_booking_klinik`
--

CREATE TABLE `checkout_booking_klinik` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `keluhan_id` bigint(20) UNSIGNED NOT NULL,
  `config_pembayaran_id` bigint(20) UNSIGNED NOT NULL,
  `tanggal_checkout_booking_klinik` datetime NOT NULL,
  `invoice` varchar(255) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `checkout_house_call`
--

CREATE TABLE `checkout_house_call` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `checkout_konsultasi`
--

CREATE TABLE `checkout_konsultasi` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `konsultasi_online_id` bigint(20) UNSIGNED NOT NULL,
  `tanggal_checkout_konsultasi` datetime NOT NULL,
  `lama_konsultasi` int(11) NOT NULL COMMENT 'Durasi konsultasi dalam menit',
  `total_harga` decimal(10,2) NOT NULL COMMENT 'lama_konsultasi * tarif_konsultasi',
  `invoice` varchar(255) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `checkout_pet_hotel`
--

CREATE TABLE `checkout_pet_hotel` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `booking_pet_hotel_id` bigint(20) UNSIGNED NOT NULL,
  `metode_pembayaran` varchar(255) NOT NULL,
  `invoice` varchar(255) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `checkout_produk`
--

CREATE TABLE `checkout_produk` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `alamat_id` bigint(20) UNSIGNED NOT NULL,
  `ekspedisi_id` bigint(20) UNSIGNED NOT NULL,
  `produk_id` bigint(20) UNSIGNED NOT NULL,
  `config_pembayaran_id` bigint(20) UNSIGNED NOT NULL,
  `metode_pembayaran` enum('bca','bni','bri','all bank') NOT NULL,
  `total_pesanan` decimal(10,2) NOT NULL,
  `subtotal_produk` decimal(10,2) NOT NULL,
  `invoice` varchar(255) NOT NULL,
  `tanggal_checkout_produk` datetime NOT NULL,
  `koin_digunakan` decimal(10,2) NOT NULL DEFAULT 0.00,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `coin_history`
--

CREATE TABLE `coin_history` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `pembayaran_produk_id` bigint(20) UNSIGNED DEFAULT NULL,
  `pembayaran_klinik_id` bigint(20) UNSIGNED DEFAULT NULL,
  `pembayaran_konsultasi_id` bigint(20) UNSIGNED DEFAULT NULL,
  `pembayaran_pet_hotel_id` bigint(20) UNSIGNED DEFAULT NULL,
  `pembayaran_house_call_id` bigint(20) UNSIGNED DEFAULT NULL,
  `user_id` bigint(20) UNSIGNED NOT NULL,
  `coin_di_dapat` int(11) NOT NULL DEFAULT 0,
  `coin_di_gunakan` int(11) NOT NULL DEFAULT 0,
  `tanggal_digunakan` datetime DEFAULT NULL,
  `tanggal_diperoleh` datetime DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `config_pembayaran`
--

CREATE TABLE `config_pembayaran` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `admin_id` bigint(20) UNSIGNED NOT NULL,
  `biaya_admin` decimal(10,2) NOT NULL,
  `no_rekening_admin` varchar(255) NOT NULL,
  `biaya_booking` decimal(10,2) NOT NULL,
  `persentase_coin` decimal(5,2) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `dokter`
--

CREATE TABLE `dokter` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `nama` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `universitas` varchar(255) NOT NULL,
  `klinik_id` bigint(20) UNSIGNED NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `ekspedisi_api`
--

CREATE TABLE `ekspedisi_api` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `alamat_id` bigint(20) UNSIGNED NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `ekspedisi_data`
--

CREATE TABLE `ekspedisi_data` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `nama_ekspedisi` varchar(255) NOT NULL,
  `ongkir` decimal(10,2) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `failed_jobs`
--

CREATE TABLE `failed_jobs` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `uuid` varchar(255) NOT NULL,
  `connection` text NOT NULL,
  `queue` text NOT NULL,
  `payload` longtext NOT NULL,
  `exception` longtext NOT NULL,
  `failed_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `gambar_artikel`
--

CREATE TABLE `gambar_artikel` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `artikel_id` bigint(20) UNSIGNED NOT NULL,
  `thumbnail_artikel` varchar(255) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `gambar_dokter`
--

CREATE TABLE `gambar_dokter` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `dokter_id` bigint(20) UNSIGNED NOT NULL,
  `gambar` varchar(255) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `gambar_hewan`
--

CREATE TABLE `gambar_hewan` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `hewan_peliharaan_id` bigint(20) UNSIGNED NOT NULL,
  `profile_hewan` varchar(255) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `gambar_klinik`
--

CREATE TABLE `gambar_klinik` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `klinik_id` bigint(20) UNSIGNED NOT NULL,
  `thumbnail_klinik` varchar(255) NOT NULL,
  `logo_klinik` varchar(255) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `gambar_produk`
--

CREATE TABLE `gambar_produk` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `produk_id` bigint(20) UNSIGNED NOT NULL,
  `gambar` varchar(255) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `gambar_user`
--

CREATE TABLE `gambar_user` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `users_id` bigint(20) UNSIGNED NOT NULL,
  `gambar` varchar(255) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `hewan_peliharaan`
--

CREATE TABLE `hewan_peliharaan` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `user_id` bigint(20) UNSIGNED NOT NULL,
  `nama_hewan` varchar(255) NOT NULL,
  `jenis_hewan_id` bigint(20) UNSIGNED NOT NULL,
  `jenis_kelamin` enum('jantan','betina','nonbinary') NOT NULL,
  `jenis_ras` varchar(255) DEFAULT NULL,
  `tanggal_lahir_hewan` date DEFAULT NULL,
  `berat_badan` int(10) UNSIGNED NOT NULL DEFAULT 0 COMMENT 'Maksimum 4 kg',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `history_layanan`
--

CREATE TABLE `history_layanan` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `pembayaran_konsultasi_id` bigint(20) UNSIGNED DEFAULT NULL,
  `pembayaran_klinik_id` bigint(20) UNSIGNED DEFAULT NULL,
  `pembayaran_produk_id` bigint(20) UNSIGNED DEFAULT NULL,
  `pembayaran_house_call_id` bigint(20) UNSIGNED DEFAULT NULL,
  `status_history_id` bigint(20) UNSIGNED NOT NULL,
  `user_id` bigint(20) UNSIGNED NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `jadwal_buka_klinik`
--

CREATE TABLE `jadwal_buka_klinik` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `klinik_id` bigint(20) UNSIGNED NOT NULL,
  `hari` varchar(255) NOT NULL,
  `jam_mulai` time NOT NULL,
  `jam_selesai` time NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `jenis_hewan`
--

CREATE TABLE `jenis_hewan` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `jenis_hewan_peliharaan` varchar(255) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `job_batches`
--

CREATE TABLE `job_batches` (
  `id` varchar(255) NOT NULL,
  `name` varchar(255) NOT NULL,
  `total_jobs` int(11) NOT NULL,
  `pending_jobs` int(11) NOT NULL,
  `failed_jobs` int(11) NOT NULL,
  `failed_job_ids` longtext NOT NULL,
  `options` mediumtext DEFAULT NULL,
  `cancelled_at` int(11) DEFAULT NULL,
  `created_at` int(11) NOT NULL,
  `finished_at` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `kabupaten_kota`
--

CREATE TABLE `kabupaten_kota` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `provinsi_id` bigint(20) UNSIGNED NOT NULL,
  `nama_kabupaten_kota` varchar(255) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `kategori_produk`
--

CREATE TABLE `kategori_produk` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `nama` varchar(255) NOT NULL,
  `slug` varchar(255) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `kecamatan`
--

CREATE TABLE `kecamatan` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `kabupaten_id` bigint(20) UNSIGNED NOT NULL,
  `nama_kecamatan` varchar(255) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `keluhan`
--

CREATE TABLE `keluhan` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `user_id` bigint(20) UNSIGNED NOT NULL,
  `hewan_peliharaan_id` bigint(20) UNSIGNED NOT NULL,
  `keluhan` text NOT NULL,
  `tipe_layanan` enum('klinik','housecall','konsultasi') NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `keranjang`
--

CREATE TABLE `keranjang` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `produk_id` bigint(20) UNSIGNED NOT NULL,
  `jumlah_dibeli` int(11) NOT NULL DEFAULT 1,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `keranjang_produk`
--

CREATE TABLE `keranjang_produk` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `produk_id` bigint(20) UNSIGNED NOT NULL,
  `user_id` bigint(20) UNSIGNED NOT NULL,
  `subtotal_harga` decimal(10,2) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `klinik`
--

CREATE TABLE `klinik` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `nama_klinik` varchar(255) NOT NULL,
  `thumbnail_klinik` varchar(255) NOT NULL,
  `logo_klinik` varchar(255) NOT NULL,
  `deskripsi_klinik` text NOT NULL,
  `jadwal_buka_id` bigint(20) UNSIGNED NOT NULL,
  `alamat_klinik` text NOT NULL,
  `no_tlpn_klinik` varchar(255) NOT NULL,
  `layanan_id` bigint(20) UNSIGNED NOT NULL,
  `harga_konsultasi` decimal(10,2) NOT NULL,
  `waktu_konsultasi` time NOT NULL,
  `maps` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `konsultasi_online`
--

CREATE TABLE `konsultasi_online` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `user_id` bigint(20) UNSIGNED NOT NULL,
  `klinik_id` bigint(20) UNSIGNED NOT NULL,
  `dokter_id` bigint(20) UNSIGNED NOT NULL,
  `hewan_peliharaan_id` bigint(20) UNSIGNED NOT NULL,
  `keluhan_id` bigint(20) UNSIGNED NOT NULL,
  `metode_pembayaran` varchar(255) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `layanan_klinik`
--

CREATE TABLE `layanan_klinik` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `nama_layanan` varchar(255) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `migrations`
--

CREATE TABLE `migrations` (
  `id` int(10) UNSIGNED NOT NULL,
  `migration` varchar(255) NOT NULL,
  `batch` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `migrations`
--

INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES
(1, '0001_01_01_000000_create_users_table', 1),
(2, '0001_01_01_000001_create_cache_table', 1),
(3, '0001_01_01_000002_create_jobs_table', 2),
(4, '2025_03_20_065219_create_admin_table', 3),
(5, '2025_03_20_070914_create_layanan_klinik_table', 4),
(6, '2025_03_20_071010_create_klinik_table', 5),
(7, '2025_03_20_071415_create_dokter_table', 6),
(8, '2025_03_20_071802_create_provinsi_table', 7),
(9, '2025_03_20_071813_create_kabupaen_kota_table', 7),
(10, '2025_03_20_071856_create_kecamatan_table', 7),
(12, '2025_03_20_072414_create_alamat_user_table', 8),
(13, '2025_03_20_073352_create_config_pembayaran_table', 9),
(14, '2025_03_20_073716_create_total_coin_user_table', 10),
(15, '2025_03_20_074922_create_kategori_produk_table', 11),
(16, '2025_03_20_075118_create_produk_table', 12),
(17, '2025_03_20_075416_create_keranjang_produk_table', 13),
(18, '2025_03_20_080015_create_ekspedisi_data_table', 14),
(19, '2025_03_20_080130_create_ekspedisi_api_table', 15),
(20, '2025_03_20_080316_create_checkout_produk_table', 16),
(21, '2025_03_20_102405_create_jadwal_buka_klinik_table', 17),
(22, '2025_03_20_103050_create_jenis_hewan_table', 18),
(23, '2025_03_20_103453_create_hewan_peliharaan_table', 19),
(24, '2025_03_20_103712_create_keluhan_table', 20),
(25, '2025_03_20_103833_create_artikel_table', 21),
(26, '2025_03_20_104051_create_booking_klinik_table', 22),
(27, '2025_03_20_104308_create_checkout_booking_klinik_table', 23),
(28, '2025_03_20_105111_create_status_history_table', 24),
(29, '2025_03_20_105615_create_konsultasi_online_table', 24),
(30, '2025_03_20_105931_create_checkout_konsultasi_table', 25),
(31, '2025_03_20_110041_create_pembayaran_konsultasi_table', 26),
(32, '2025_03_20_110157_create_chat_konsultasi_table', 27),
(33, '2025_03_20_110313_create_house_call_table', 28),
(34, '2025_03_20_110421_create_checkout_house_call_table', 29),
(35, '2025_03_20_110620_create_house_call_table', 30),
(37, '2025_03_20_112203_create_history_layanan_table', 31),
(38, '2025_03_20_112345_create_keranjang_table', 32),
(39, '2025_03_20_112524_create_pet_hotel_table', 33),
(40, '2025_03_20_113447_create_booking_pet_hotel_table', 34),
(41, '2025_03_20_113714_create_checkout_pet_hotel_table', 35),
(42, '2025_03_20_113854_create_pembayaran_pet_hotel_table', 36),
(43, '2025_03_20_114525_create_gambar_user_table', 37),
(44, '2025_03_20_114658_create_gambar_dokter_table', 38),
(45, '2025_03_20_114910_create_gambar_produk_table', 39),
(46, '2025_03_20_115044_create_gambar_hewan_table', 40),
(47, '2025_03_20_115156_create_gambar_artikel_table', 41),
(48, '2025_03_20_115314_create_gambar_klinik_table', 42);

-- --------------------------------------------------------

--
-- Table structure for table `password_reset_tokens`
--

CREATE TABLE `password_reset_tokens` (
  `email` varchar(255) NOT NULL,
  `token` varchar(255) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `pembayaran_house_call`
--

CREATE TABLE `pembayaran_house_call` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `house_call_checkout_id` bigint(20) UNSIGNED NOT NULL,
  `bukti_pembayaran` varchar(255) DEFAULT NULL,
  `status` enum('selesai','tertunda','dibatalkan') NOT NULL DEFAULT 'tertunda',
  `kategori_status_history_id` bigint(20) UNSIGNED NOT NULL,
  `koin_didapat` int(11) NOT NULL DEFAULT 0,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `pembayaran_klinik`
--

CREATE TABLE `pembayaran_klinik` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `checkout_booking_klinik_id` bigint(20) UNSIGNED NOT NULL,
  `metode_pembayaran` varchar(255) NOT NULL,
  `total_biaya` decimal(10,2) NOT NULL,
  `status` enum('selesai','tertunda','dibatalkan') NOT NULL DEFAULT 'tertunda',
  `bukti_pembayaran` varchar(255) DEFAULT NULL,
  `kategori_status_history_id` bigint(20) UNSIGNED NOT NULL,
  `koin_didapat` int(11) NOT NULL DEFAULT 0,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `pembayaran_konsultasi`
--

CREATE TABLE `pembayaran_konsultasi` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `checkout_konsultasi_id` bigint(20) UNSIGNED NOT NULL,
  `bukti_pembayaran` varchar(255) DEFAULT NULL COMMENT 'Path gambar bukti pembayaran',
  `status` enum('selesai','tertunda','dibatalkan') NOT NULL,
  `kategori_status_history_id` bigint(20) UNSIGNED NOT NULL,
  `koin_didapat` int(11) NOT NULL DEFAULT 0,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `pembayaran_pet_hotel`
--

CREATE TABLE `pembayaran_pet_hotel` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `checkout_pet_hotel_id` bigint(20) UNSIGNED NOT NULL,
  `status_pembayaran` enum('berhasil','tidak valid','belum di bayar') NOT NULL,
  `status` enum('selesai','tertunda','dibatalkan') NOT NULL,
  `kategori_status_history_id` bigint(20) UNSIGNED NOT NULL,
  `koin_didapat` int(11) NOT NULL DEFAULT 0,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `pembayaran_produk`
--

CREATE TABLE `pembayaran_produk` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `checkout_produk_id` bigint(20) UNSIGNED NOT NULL,
  `invoice` varchar(255) NOT NULL,
  `config_pembayaran_id` bigint(20) UNSIGNED NOT NULL,
  `bukti_pembayaran` varchar(255) DEFAULT NULL,
  `status` enum('selesai','tertunda','dibatalkan') NOT NULL DEFAULT 'tertunda',
  `kategori_status_history_id` bigint(20) UNSIGNED NOT NULL,
  `koin_didapat` int(11) NOT NULL DEFAULT 0,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `pet_hotel`
--

CREATE TABLE `pet_hotel` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `klinik_id` bigint(20) UNSIGNED NOT NULL,
  `tipe_booking_pet_hotel` enum('jemput','datang_ke_klinik') NOT NULL,
  `tanggal_check_in` date NOT NULL,
  `tanggal_check_out` date NOT NULL,
  `waktu_penjemputan` time DEFAULT NULL,
  `alamat_id` bigint(20) UNSIGNED DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `produk`
--

CREATE TABLE `produk` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `kategori_produk_id` bigint(20) UNSIGNED NOT NULL,
  `nama_produk` varchar(255) NOT NULL,
  `slug` varchar(255) NOT NULL,
  `deskripsi` text NOT NULL,
  `total_produk` int(11) NOT NULL,
  `tampilkan_produk` tinyint(1) NOT NULL DEFAULT 1,
  `harga_produk` decimal(10,2) NOT NULL,
  `diskon_produk` decimal(10,2) DEFAULT NULL,
  `stok_produk` int(11) NOT NULL,
  `coin_perbarang` int(11) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `provinsi`
--

CREATE TABLE `provinsi` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `provinsi` varchar(255) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `sessions`
--

CREATE TABLE `sessions` (
  `id` varchar(255) NOT NULL,
  `user_id` bigint(20) UNSIGNED DEFAULT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` text DEFAULT NULL,
  `payload` longtext NOT NULL,
  `last_activity` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `status_history`
--

CREATE TABLE `status_history` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `nama` varchar(255) NOT NULL,
  `slug` varchar(255) NOT NULL,
  `isi_data` enum('belum bayar','diproses','dikirim','selesai','dibatalkan') NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `tipe_hotel`
--

CREATE TABLE `tipe_hotel` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `tipe_hotel` varchar(255) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `total_coin_user`
--

CREATE TABLE `total_coin_user` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `user_id` bigint(20) UNSIGNED NOT NULL,
  `total_coin` decimal(10,2) NOT NULL DEFAULT 0.00,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `id_google` varchar(255) DEFAULT NULL,
  `email_verified_at` timestamp NULL DEFAULT NULL,
  `password` varchar(255) NOT NULL,
  `remember_token` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `otp_code` varchar(6) DEFAULT NULL,
  `otp_expires_at` timestamp NULL DEFAULT NULL,
  `last_login` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `admin`
--
ALTER TABLE `admin`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `alamat_user`
--
ALTER TABLE `alamat_user`
  ADD PRIMARY KEY (`id`),
  ADD KEY `alamat_user_user_id_foreign` (`user_id`),
  ADD KEY `alamat_user_provinsi_id_foreign` (`provinsi_id`),
  ADD KEY `alamat_user_kabupaten_kota_id_foreign` (`kabupaten_kota_id`),
  ADD KEY `alamat_user_kecamatan_id_foreign` (`kecamatan_id`);

--
-- Indexes for table `artikel`
--
ALTER TABLE `artikel`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `booking_klinik`
--
ALTER TABLE `booking_klinik`
  ADD PRIMARY KEY (`id`),
  ADD KEY `booking_klinik_user_id_foreign` (`user_id`),
  ADD KEY `booking_klinik_klinik_id_foreign` (`klinik_id`),
  ADD KEY `booking_klinik_layanan_klinik_id_foreign` (`layanan_klinik_id`),
  ADD KEY `booking_klinik_alamat_user_id_foreign` (`alamat_user_id`);

--
-- Indexes for table `booking_pet_hotel`
--
ALTER TABLE `booking_pet_hotel`
  ADD PRIMARY KEY (`id`),
  ADD KEY `booking_pet_hotel_pet_hotel_id_foreign` (`pet_hotel_id`),
  ADD KEY `booking_pet_hotel_hewan_peliharaan_id_foreign` (`hewan_peliharaan_id`),
  ADD KEY `booking_pet_hotel_tipe_hotel_id_foreign` (`tipe_hotel_id`);

--
-- Indexes for table `cache`
--
ALTER TABLE `cache`
  ADD PRIMARY KEY (`key`);

--
-- Indexes for table `cache_locks`
--
ALTER TABLE `cache_locks`
  ADD PRIMARY KEY (`key`);

--
-- Indexes for table `chat_konsultasi`
--
ALTER TABLE `chat_konsultasi`
  ADD PRIMARY KEY (`id`),
  ADD KEY `chat_konsultasi_konsultasi_online_id_foreign` (`konsultasi_online_id`),
  ADD KEY `chat_konsultasi_user_id_foreign` (`user_id`),
  ADD KEY `chat_konsultasi_dokter_id_foreign` (`dokter_id`);

--
-- Indexes for table `checkout_booking_klinik`
--
ALTER TABLE `checkout_booking_klinik`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `checkout_booking_klinik_invoice_unique` (`invoice`),
  ADD KEY `checkout_booking_klinik_keluhan_id_foreign` (`keluhan_id`),
  ADD KEY `checkout_booking_klinik_config_pembayaran_id_foreign` (`config_pembayaran_id`);

--
-- Indexes for table `checkout_house_call`
--
ALTER TABLE `checkout_house_call`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `checkout_konsultasi`
--
ALTER TABLE `checkout_konsultasi`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `checkout_konsultasi_invoice_unique` (`invoice`),
  ADD KEY `checkout_konsultasi_konsultasi_online_id_foreign` (`konsultasi_online_id`);

--
-- Indexes for table `checkout_pet_hotel`
--
ALTER TABLE `checkout_pet_hotel`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `checkout_pet_hotel_invoice_unique` (`invoice`),
  ADD KEY `checkout_pet_hotel_booking_pet_hotel_id_foreign` (`booking_pet_hotel_id`);

--
-- Indexes for table `checkout_produk`
--
ALTER TABLE `checkout_produk`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `checkout_produk_invoice_unique` (`invoice`),
  ADD KEY `checkout_produk_alamat_id_foreign` (`alamat_id`),
  ADD KEY `checkout_produk_ekspedisi_id_foreign` (`ekspedisi_id`),
  ADD KEY `checkout_produk_produk_id_foreign` (`produk_id`),
  ADD KEY `checkout_produk_config_pembayaran_id_foreign` (`config_pembayaran_id`);

--
-- Indexes for table `coin_history`
--
ALTER TABLE `coin_history`
  ADD PRIMARY KEY (`id`),
  ADD KEY `coin_history_pembayaran_produk_id_foreign` (`pembayaran_produk_id`),
  ADD KEY `coin_history_pembayaran_klinik_id_foreign` (`pembayaran_klinik_id`),
  ADD KEY `pembayaran_konsultasi_id` (`pembayaran_konsultasi_id`),
  ADD KEY `pembayaran_pet_hotel_id` (`pembayaran_pet_hotel_id`),
  ADD KEY `pembayaran_house_call_id` (`pembayaran_house_call_id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `config_pembayaran`
--
ALTER TABLE `config_pembayaran`
  ADD PRIMARY KEY (`id`),
  ADD KEY `config_pembayaran_admin_id_foreign` (`admin_id`);

--
-- Indexes for table `dokter`
--
ALTER TABLE `dokter`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `dokter_email_unique` (`email`),
  ADD KEY `dokter_klinik_id_foreign` (`klinik_id`);

--
-- Indexes for table `ekspedisi_api`
--
ALTER TABLE `ekspedisi_api`
  ADD PRIMARY KEY (`id`),
  ADD KEY `ekspedisi_api_alamat_id_foreign` (`alamat_id`);

--
-- Indexes for table `ekspedisi_data`
--
ALTER TABLE `ekspedisi_data`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `failed_jobs`
--
ALTER TABLE `failed_jobs`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `failed_jobs_uuid_unique` (`uuid`);

--
-- Indexes for table `gambar_artikel`
--
ALTER TABLE `gambar_artikel`
  ADD PRIMARY KEY (`id`),
  ADD KEY `gambar_artikel_artikel_id_foreign` (`artikel_id`);

--
-- Indexes for table `gambar_dokter`
--
ALTER TABLE `gambar_dokter`
  ADD PRIMARY KEY (`id`),
  ADD KEY `gambar_dokter_dokter_id_foreign` (`dokter_id`);

--
-- Indexes for table `gambar_hewan`
--
ALTER TABLE `gambar_hewan`
  ADD PRIMARY KEY (`id`),
  ADD KEY `gambar_hewan_hewan_peliharaan_id_foreign` (`hewan_peliharaan_id`);

--
-- Indexes for table `gambar_klinik`
--
ALTER TABLE `gambar_klinik`
  ADD PRIMARY KEY (`id`),
  ADD KEY `gambar_klinik_klinik_id_foreign` (`klinik_id`);

--
-- Indexes for table `gambar_produk`
--
ALTER TABLE `gambar_produk`
  ADD PRIMARY KEY (`id`),
  ADD KEY `gambar_produk_produk_id_foreign` (`produk_id`);

--
-- Indexes for table `gambar_user`
--
ALTER TABLE `gambar_user`
  ADD PRIMARY KEY (`id`),
  ADD KEY `gambar_user_users_id_foreign` (`users_id`);

--
-- Indexes for table `hewan_peliharaan`
--
ALTER TABLE `hewan_peliharaan`
  ADD PRIMARY KEY (`id`),
  ADD KEY `hewan_peliharaan_user_id_foreign` (`user_id`),
  ADD KEY `hewan_peliharaan_jenis_hewan_id_foreign` (`jenis_hewan_id`);

--
-- Indexes for table `history_layanan`
--
ALTER TABLE `history_layanan`
  ADD PRIMARY KEY (`id`),
  ADD KEY `history_layanan_pembayaran_konsultasi_id_foreign` (`pembayaran_konsultasi_id`),
  ADD KEY `history_layanan_pembayaran_klinik_id_foreign` (`pembayaran_klinik_id`),
  ADD KEY `history_layanan_pembayaran_produk_id_foreign` (`pembayaran_produk_id`),
  ADD KEY `history_layanan_pembayaran_house_call_id_foreign` (`pembayaran_house_call_id`),
  ADD KEY `history_layanan_status_history_id_foreign` (`status_history_id`),
  ADD KEY `history_layanan_user_id_foreign` (`user_id`);

--
-- Indexes for table `jadwal_buka_klinik`
--
ALTER TABLE `jadwal_buka_klinik`
  ADD PRIMARY KEY (`id`),
  ADD KEY `jadwal_buka_klinik_klinik_id_foreign` (`klinik_id`);

--
-- Indexes for table `jenis_hewan`
--
ALTER TABLE `jenis_hewan`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `job_batches`
--
ALTER TABLE `job_batches`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `kabupaten_kota`
--
ALTER TABLE `kabupaten_kota`
  ADD PRIMARY KEY (`id`),
  ADD KEY `kabupaten_kota_provinsi_id_foreign` (`provinsi_id`);

--
-- Indexes for table `kategori_produk`
--
ALTER TABLE `kategori_produk`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `kategori_produk_nama_unique` (`nama`),
  ADD UNIQUE KEY `kategori_produk_slug_unique` (`slug`);

--
-- Indexes for table `kecamatan`
--
ALTER TABLE `kecamatan`
  ADD PRIMARY KEY (`id`),
  ADD KEY `kecamatan_kabupaten_id_foreign` (`kabupaten_id`);

--
-- Indexes for table `keluhan`
--
ALTER TABLE `keluhan`
  ADD PRIMARY KEY (`id`),
  ADD KEY `keluhan_user_id_foreign` (`user_id`),
  ADD KEY `keluhan_hewan_peliharaan_id_foreign` (`hewan_peliharaan_id`);

--
-- Indexes for table `keranjang`
--
ALTER TABLE `keranjang`
  ADD PRIMARY KEY (`id`),
  ADD KEY `keranjang_produk_id_foreign` (`produk_id`);

--
-- Indexes for table `keranjang_produk`
--
ALTER TABLE `keranjang_produk`
  ADD PRIMARY KEY (`id`),
  ADD KEY `keranjang_produk_produk_id_foreign` (`produk_id`),
  ADD KEY `keranjang_produk_user_id_foreign` (`user_id`);

--
-- Indexes for table `klinik`
--
ALTER TABLE `klinik`
  ADD PRIMARY KEY (`id`),
  ADD KEY `klinik_layanan_id_foreign` (`layanan_id`),
  ADD KEY `jadwal_buka_id` (`jadwal_buka_id`);

--
-- Indexes for table `konsultasi_online`
--
ALTER TABLE `konsultasi_online`
  ADD PRIMARY KEY (`id`),
  ADD KEY `konsultasi_online_user_id_foreign` (`user_id`),
  ADD KEY `konsultasi_online_klinik_id_foreign` (`klinik_id`),
  ADD KEY `konsultasi_online_dokter_id_foreign` (`dokter_id`),
  ADD KEY `konsultasi_online_hewan_peliharaan_id_foreign` (`hewan_peliharaan_id`),
  ADD KEY `konsultasi_online_keluhan_id_foreign` (`keluhan_id`);

--
-- Indexes for table `layanan_klinik`
--
ALTER TABLE `layanan_klinik`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `migrations`
--
ALTER TABLE `migrations`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `password_reset_tokens`
--
ALTER TABLE `password_reset_tokens`
  ADD PRIMARY KEY (`email`);

--
-- Indexes for table `pembayaran_house_call`
--
ALTER TABLE `pembayaran_house_call`
  ADD PRIMARY KEY (`id`),
  ADD KEY `pembayaran_house_call_house_call_checkout_id_foreign` (`house_call_checkout_id`),
  ADD KEY `pembayaran_house_call_kategori_status_history_id_foreign` (`kategori_status_history_id`);

--
-- Indexes for table `pembayaran_klinik`
--
ALTER TABLE `pembayaran_klinik`
  ADD PRIMARY KEY (`id`),
  ADD KEY `pembayaran_klinik_checkout_booking_klinik_id_foreign` (`checkout_booking_klinik_id`),
  ADD KEY `kategori_status_history_id` (`kategori_status_history_id`);

--
-- Indexes for table `pembayaran_konsultasi`
--
ALTER TABLE `pembayaran_konsultasi`
  ADD PRIMARY KEY (`id`),
  ADD KEY `pembayaran_konsultasi_checkout_konsultasi_id_foreign` (`checkout_konsultasi_id`),
  ADD KEY `pembayaran_konsultasi_kategori_status_history_id_foreign` (`kategori_status_history_id`);

--
-- Indexes for table `pembayaran_pet_hotel`
--
ALTER TABLE `pembayaran_pet_hotel`
  ADD PRIMARY KEY (`id`),
  ADD KEY `pembayaran_pet_hotel_checkout_pet_hotel_id_foreign` (`checkout_pet_hotel_id`),
  ADD KEY `pembayaran_pet_hotel_kategori_status_history_id_foreign` (`kategori_status_history_id`);

--
-- Indexes for table `pembayaran_produk`
--
ALTER TABLE `pembayaran_produk`
  ADD PRIMARY KEY (`id`),
  ADD KEY `pembayaran_produk_checkout_produk_id_foreign` (`checkout_produk_id`),
  ADD KEY `pembayaran_produk_config_pembayaran_id_foreign` (`config_pembayaran_id`),
  ADD KEY `kategori_status_history_id` (`kategori_status_history_id`);

--
-- Indexes for table `pet_hotel`
--
ALTER TABLE `pet_hotel`
  ADD PRIMARY KEY (`id`),
  ADD KEY `pet_hotel_klinik_id_foreign` (`klinik_id`),
  ADD KEY `pet_hotel_alamat_id_foreign` (`alamat_id`);

--
-- Indexes for table `produk`
--
ALTER TABLE `produk`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `produk_nama_produk_unique` (`nama_produk`),
  ADD UNIQUE KEY `produk_slug_unique` (`slug`),
  ADD KEY `produk_kategori_produk_id_foreign` (`kategori_produk_id`);

--
-- Indexes for table `provinsi`
--
ALTER TABLE `provinsi`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `sessions`
--
ALTER TABLE `sessions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `sessions_user_id_index` (`user_id`),
  ADD KEY `sessions_last_activity_index` (`last_activity`);

--
-- Indexes for table `status_history`
--
ALTER TABLE `status_history`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `status_history_slug_unique` (`slug`);

--
-- Indexes for table `tipe_hotel`
--
ALTER TABLE `tipe_hotel`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `total_coin_user`
--
ALTER TABLE `total_coin_user`
  ADD PRIMARY KEY (`id`),
  ADD KEY `total_coin_user_user_id_foreign` (`user_id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `users_email_unique` (`email`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `admin`
--
ALTER TABLE `admin`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `alamat_user`
--
ALTER TABLE `alamat_user`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `artikel`
--
ALTER TABLE `artikel`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `booking_klinik`
--
ALTER TABLE `booking_klinik`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `booking_pet_hotel`
--
ALTER TABLE `booking_pet_hotel`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `chat_konsultasi`
--
ALTER TABLE `chat_konsultasi`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `checkout_booking_klinik`
--
ALTER TABLE `checkout_booking_klinik`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `checkout_house_call`
--
ALTER TABLE `checkout_house_call`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `checkout_konsultasi`
--
ALTER TABLE `checkout_konsultasi`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `checkout_pet_hotel`
--
ALTER TABLE `checkout_pet_hotel`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `checkout_produk`
--
ALTER TABLE `checkout_produk`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `coin_history`
--
ALTER TABLE `coin_history`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `config_pembayaran`
--
ALTER TABLE `config_pembayaran`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `dokter`
--
ALTER TABLE `dokter`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `ekspedisi_api`
--
ALTER TABLE `ekspedisi_api`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `ekspedisi_data`
--
ALTER TABLE `ekspedisi_data`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `failed_jobs`
--
ALTER TABLE `failed_jobs`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `gambar_artikel`
--
ALTER TABLE `gambar_artikel`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `gambar_dokter`
--
ALTER TABLE `gambar_dokter`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `gambar_hewan`
--
ALTER TABLE `gambar_hewan`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `gambar_klinik`
--
ALTER TABLE `gambar_klinik`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `gambar_produk`
--
ALTER TABLE `gambar_produk`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `gambar_user`
--
ALTER TABLE `gambar_user`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `hewan_peliharaan`
--
ALTER TABLE `hewan_peliharaan`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `history_layanan`
--
ALTER TABLE `history_layanan`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `jadwal_buka_klinik`
--
ALTER TABLE `jadwal_buka_klinik`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `jenis_hewan`
--
ALTER TABLE `jenis_hewan`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `kabupaten_kota`
--
ALTER TABLE `kabupaten_kota`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `kategori_produk`
--
ALTER TABLE `kategori_produk`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `kecamatan`
--
ALTER TABLE `kecamatan`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `keluhan`
--
ALTER TABLE `keluhan`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `keranjang`
--
ALTER TABLE `keranjang`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `keranjang_produk`
--
ALTER TABLE `keranjang_produk`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `klinik`
--
ALTER TABLE `klinik`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `konsultasi_online`
--
ALTER TABLE `konsultasi_online`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `layanan_klinik`
--
ALTER TABLE `layanan_klinik`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `migrations`
--
ALTER TABLE `migrations`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=49;

--
-- AUTO_INCREMENT for table `pembayaran_house_call`
--
ALTER TABLE `pembayaran_house_call`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `pembayaran_klinik`
--
ALTER TABLE `pembayaran_klinik`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `pembayaran_konsultasi`
--
ALTER TABLE `pembayaran_konsultasi`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `pembayaran_pet_hotel`
--
ALTER TABLE `pembayaran_pet_hotel`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `pembayaran_produk`
--
ALTER TABLE `pembayaran_produk`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `pet_hotel`
--
ALTER TABLE `pet_hotel`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `produk`
--
ALTER TABLE `produk`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `provinsi`
--
ALTER TABLE `provinsi`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `status_history`
--
ALTER TABLE `status_history`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `tipe_hotel`
--
ALTER TABLE `tipe_hotel`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `total_coin_user`
--
ALTER TABLE `total_coin_user`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `alamat_user`
--
ALTER TABLE `alamat_user`
  ADD CONSTRAINT `alamat_user_kabupaten_kota_id_foreign` FOREIGN KEY (`kabupaten_kota_id`) REFERENCES `kabupaten_kota` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `alamat_user_kecamatan_id_foreign` FOREIGN KEY (`kecamatan_id`) REFERENCES `kecamatan` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `alamat_user_provinsi_id_foreign` FOREIGN KEY (`provinsi_id`) REFERENCES `provinsi` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `alamat_user_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `booking_klinik`
--
ALTER TABLE `booking_klinik`
  ADD CONSTRAINT `booking_klinik_alamat_user_id_foreign` FOREIGN KEY (`alamat_user_id`) REFERENCES `alamat_user` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `booking_klinik_klinik_id_foreign` FOREIGN KEY (`klinik_id`) REFERENCES `klinik` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `booking_klinik_layanan_klinik_id_foreign` FOREIGN KEY (`layanan_klinik_id`) REFERENCES `layanan_klinik` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `booking_klinik_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `booking_pet_hotel`
--
ALTER TABLE `booking_pet_hotel`
  ADD CONSTRAINT `booking_pet_hotel_hewan_peliharaan_id_foreign` FOREIGN KEY (`hewan_peliharaan_id`) REFERENCES `hewan_peliharaan` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `booking_pet_hotel_pet_hotel_id_foreign` FOREIGN KEY (`pet_hotel_id`) REFERENCES `pet_hotel` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `booking_pet_hotel_tipe_hotel_id_foreign` FOREIGN KEY (`tipe_hotel_id`) REFERENCES `tipe_hotel` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `chat_konsultasi`
--
ALTER TABLE `chat_konsultasi`
  ADD CONSTRAINT `chat_konsultasi_dokter_id_foreign` FOREIGN KEY (`dokter_id`) REFERENCES `dokter` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `chat_konsultasi_konsultasi_online_id_foreign` FOREIGN KEY (`konsultasi_online_id`) REFERENCES `konsultasi_online` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `chat_konsultasi_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `checkout_booking_klinik`
--
ALTER TABLE `checkout_booking_klinik`
  ADD CONSTRAINT `checkout_booking_klinik_config_pembayaran_id_foreign` FOREIGN KEY (`config_pembayaran_id`) REFERENCES `config_pembayaran` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `checkout_booking_klinik_keluhan_id_foreign` FOREIGN KEY (`keluhan_id`) REFERENCES `keluhan` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `checkout_konsultasi`
--
ALTER TABLE `checkout_konsultasi`
  ADD CONSTRAINT `checkout_konsultasi_konsultasi_online_id_foreign` FOREIGN KEY (`konsultasi_online_id`) REFERENCES `konsultasi_online` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `checkout_pet_hotel`
--
ALTER TABLE `checkout_pet_hotel`
  ADD CONSTRAINT `checkout_pet_hotel_booking_pet_hotel_id_foreign` FOREIGN KEY (`booking_pet_hotel_id`) REFERENCES `booking_pet_hotel` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `checkout_produk`
--
ALTER TABLE `checkout_produk`
  ADD CONSTRAINT `checkout_produk_alamat_id_foreign` FOREIGN KEY (`alamat_id`) REFERENCES `alamat_user` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `checkout_produk_config_pembayaran_id_foreign` FOREIGN KEY (`config_pembayaran_id`) REFERENCES `config_pembayaran` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `checkout_produk_ekspedisi_id_foreign` FOREIGN KEY (`ekspedisi_id`) REFERENCES `ekspedisi_data` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `checkout_produk_produk_id_foreign` FOREIGN KEY (`produk_id`) REFERENCES `produk` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `coin_history`
--
ALTER TABLE `coin_history`
  ADD CONSTRAINT `coin_history_ibfk_1` FOREIGN KEY (`pembayaran_konsultasi_id`) REFERENCES `pembayaran_konsultasi` (`id`),
  ADD CONSTRAINT `coin_history_ibfk_2` FOREIGN KEY (`pembayaran_pet_hotel_id`) REFERENCES `pembayaran_pet_hotel` (`id`),
  ADD CONSTRAINT `coin_history_ibfk_3` FOREIGN KEY (`pembayaran_house_call_id`) REFERENCES `pembayaran_house_call` (`id`),
  ADD CONSTRAINT `coin_history_ibfk_4` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`),
  ADD CONSTRAINT `coin_history_pembayaran_klinik_id_foreign` FOREIGN KEY (`pembayaran_klinik_id`) REFERENCES `pembayaran_klinik` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `coin_history_pembayaran_produk_id_foreign` FOREIGN KEY (`pembayaran_produk_id`) REFERENCES `pembayaran_produk` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `config_pembayaran`
--
ALTER TABLE `config_pembayaran`
  ADD CONSTRAINT `config_pembayaran_admin_id_foreign` FOREIGN KEY (`admin_id`) REFERENCES `admin` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `dokter`
--
ALTER TABLE `dokter`
  ADD CONSTRAINT `dokter_klinik_id_foreign` FOREIGN KEY (`klinik_id`) REFERENCES `klinik` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `ekspedisi_api`
--
ALTER TABLE `ekspedisi_api`
  ADD CONSTRAINT `ekspedisi_api_alamat_id_foreign` FOREIGN KEY (`alamat_id`) REFERENCES `alamat_user` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `gambar_artikel`
--
ALTER TABLE `gambar_artikel`
  ADD CONSTRAINT `gambar_artikel_artikel_id_foreign` FOREIGN KEY (`artikel_id`) REFERENCES `artikel` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `gambar_dokter`
--
ALTER TABLE `gambar_dokter`
  ADD CONSTRAINT `gambar_dokter_dokter_id_foreign` FOREIGN KEY (`dokter_id`) REFERENCES `dokter` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `gambar_hewan`
--
ALTER TABLE `gambar_hewan`
  ADD CONSTRAINT `gambar_hewan_hewan_peliharaan_id_foreign` FOREIGN KEY (`hewan_peliharaan_id`) REFERENCES `hewan_peliharaan` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `gambar_klinik`
--
ALTER TABLE `gambar_klinik`
  ADD CONSTRAINT `gambar_klinik_klinik_id_foreign` FOREIGN KEY (`klinik_id`) REFERENCES `klinik` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `gambar_produk`
--
ALTER TABLE `gambar_produk`
  ADD CONSTRAINT `gambar_produk_produk_id_foreign` FOREIGN KEY (`produk_id`) REFERENCES `produk` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `gambar_user`
--
ALTER TABLE `gambar_user`
  ADD CONSTRAINT `gambar_user_users_id_foreign` FOREIGN KEY (`users_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `hewan_peliharaan`
--
ALTER TABLE `hewan_peliharaan`
  ADD CONSTRAINT `hewan_peliharaan_jenis_hewan_id_foreign` FOREIGN KEY (`jenis_hewan_id`) REFERENCES `jenis_hewan` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `hewan_peliharaan_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `history_layanan`
--
ALTER TABLE `history_layanan`
  ADD CONSTRAINT `history_layanan_pembayaran_house_call_id_foreign` FOREIGN KEY (`pembayaran_house_call_id`) REFERENCES `pembayaran_house_call` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `history_layanan_pembayaran_klinik_id_foreign` FOREIGN KEY (`pembayaran_klinik_id`) REFERENCES `pembayaran_klinik` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `history_layanan_pembayaran_konsultasi_id_foreign` FOREIGN KEY (`pembayaran_konsultasi_id`) REFERENCES `pembayaran_konsultasi` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `history_layanan_pembayaran_produk_id_foreign` FOREIGN KEY (`pembayaran_produk_id`) REFERENCES `pembayaran_produk` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `history_layanan_status_history_id_foreign` FOREIGN KEY (`status_history_id`) REFERENCES `status_history` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `history_layanan_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `jadwal_buka_klinik`
--
ALTER TABLE `jadwal_buka_klinik`
  ADD CONSTRAINT `jadwal_buka_klinik_klinik_id_foreign` FOREIGN KEY (`klinik_id`) REFERENCES `klinik` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `kabupaten_kota`
--
ALTER TABLE `kabupaten_kota`
  ADD CONSTRAINT `kabupaten_kota_provinsi_id_foreign` FOREIGN KEY (`provinsi_id`) REFERENCES `provinsi` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `kecamatan`
--
ALTER TABLE `kecamatan`
  ADD CONSTRAINT `kecamatan_kabupaten_id_foreign` FOREIGN KEY (`kabupaten_id`) REFERENCES `kabupaten_kota` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `keluhan`
--
ALTER TABLE `keluhan`
  ADD CONSTRAINT `keluhan_hewan_peliharaan_id_foreign` FOREIGN KEY (`hewan_peliharaan_id`) REFERENCES `hewan_peliharaan` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `keluhan_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `keranjang`
--
ALTER TABLE `keranjang`
  ADD CONSTRAINT `keranjang_produk_id_foreign` FOREIGN KEY (`produk_id`) REFERENCES `produk` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `keranjang_produk`
--
ALTER TABLE `keranjang_produk`
  ADD CONSTRAINT `keranjang_produk_produk_id_foreign` FOREIGN KEY (`produk_id`) REFERENCES `produk` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `keranjang_produk_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `klinik`
--
ALTER TABLE `klinik`
  ADD CONSTRAINT `klinik_ibfk_1` FOREIGN KEY (`jadwal_buka_id`) REFERENCES `jadwal_buka_klinik` (`id`),
  ADD CONSTRAINT `klinik_layanan_id_foreign` FOREIGN KEY (`layanan_id`) REFERENCES `layanan_klinik` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `konsultasi_online`
--
ALTER TABLE `konsultasi_online`
  ADD CONSTRAINT `konsultasi_online_dokter_id_foreign` FOREIGN KEY (`dokter_id`) REFERENCES `dokter` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `konsultasi_online_hewan_peliharaan_id_foreign` FOREIGN KEY (`hewan_peliharaan_id`) REFERENCES `hewan_peliharaan` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `konsultasi_online_keluhan_id_foreign` FOREIGN KEY (`keluhan_id`) REFERENCES `keluhan` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `konsultasi_online_klinik_id_foreign` FOREIGN KEY (`klinik_id`) REFERENCES `klinik` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `konsultasi_online_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `pembayaran_house_call`
--
ALTER TABLE `pembayaran_house_call`
  ADD CONSTRAINT `pembayaran_house_call_house_call_checkout_id_foreign` FOREIGN KEY (`house_call_checkout_id`) REFERENCES `checkout_house_call` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `pembayaran_house_call_kategori_status_history_id_foreign` FOREIGN KEY (`kategori_status_history_id`) REFERENCES `status_history` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `pembayaran_klinik`
--
ALTER TABLE `pembayaran_klinik`
  ADD CONSTRAINT `pembayaran_klinik_checkout_booking_klinik_id_foreign` FOREIGN KEY (`checkout_booking_klinik_id`) REFERENCES `checkout_booking_klinik` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `pembayaran_klinik_ibfk_1` FOREIGN KEY (`kategori_status_history_id`) REFERENCES `status_history` (`id`);

--
-- Constraints for table `pembayaran_konsultasi`
--
ALTER TABLE `pembayaran_konsultasi`
  ADD CONSTRAINT `pembayaran_konsultasi_checkout_konsultasi_id_foreign` FOREIGN KEY (`checkout_konsultasi_id`) REFERENCES `checkout_konsultasi` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `pembayaran_konsultasi_kategori_status_history_id_foreign` FOREIGN KEY (`kategori_status_history_id`) REFERENCES `status_history` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `pembayaran_pet_hotel`
--
ALTER TABLE `pembayaran_pet_hotel`
  ADD CONSTRAINT `pembayaran_pet_hotel_checkout_pet_hotel_id_foreign` FOREIGN KEY (`checkout_pet_hotel_id`) REFERENCES `checkout_pet_hotel` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `pembayaran_pet_hotel_kategori_status_history_id_foreign` FOREIGN KEY (`kategori_status_history_id`) REFERENCES `status_history` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `pembayaran_produk`
--
ALTER TABLE `pembayaran_produk`
  ADD CONSTRAINT `pembayaran_produk_checkout_produk_id_foreign` FOREIGN KEY (`checkout_produk_id`) REFERENCES `checkout_produk` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `pembayaran_produk_config_pembayaran_id_foreign` FOREIGN KEY (`config_pembayaran_id`) REFERENCES `config_pembayaran` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `pembayaran_produk_ibfk_1` FOREIGN KEY (`kategori_status_history_id`) REFERENCES `status_history` (`id`);

--
-- Constraints for table `pet_hotel`
--
ALTER TABLE `pet_hotel`
  ADD CONSTRAINT `pet_hotel_alamat_id_foreign` FOREIGN KEY (`alamat_id`) REFERENCES `alamat_user` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `pet_hotel_klinik_id_foreign` FOREIGN KEY (`klinik_id`) REFERENCES `klinik` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `produk`
--
ALTER TABLE `produk`
  ADD CONSTRAINT `produk_kategori_produk_id_foreign` FOREIGN KEY (`kategori_produk_id`) REFERENCES `kategori_produk` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `total_coin_user`
--
ALTER TABLE `total_coin_user`
  ADD CONSTRAINT `total_coin_user_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
