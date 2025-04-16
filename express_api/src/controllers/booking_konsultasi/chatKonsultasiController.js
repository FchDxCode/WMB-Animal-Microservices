// controllers/booking_konsultasi/chatKonsultasiService.js

import { Server } from 'socket.io';
import ChatKonsultasi from '../../models/chatKonsultasiModels.js';
import { CheckoutKonsultasi, PembayaranKonsultasi } from '../../models/bookingKonsultasiModels.js';
import jwt from 'jsonwebtoken';
import { User } from '../../models/userModels.js';
import { Dokter } from '../../models/dokterModels.js';
import { Op } from 'sequelize';

const JWT_SECRET = process.env.JWT_SECRET || 'yoursecretkey';

// Map untuk menyimpan koneksi aktif
const activeConnections = new Map();
// Map untuk menyimpan room chat aktif
const activeRooms = new Map();
// Map untuk menyimpan status online pengguna
const onlineUsers = new Map();

export function initSocket(server) {
  const io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || "*",
      methods: ["GET", "POST"]
    }
  });

  io.use(async (socket, next) => {
    try {
      // Ambil token dari handshake auth
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error("Authentication error: Token missing"));
      }

      // Verifikasi token
      const decoded = jwt.verify(token, JWT_SECRET);
      
      // Simpan data user di socket - pastikan userId adalah string
      socket.userId = String(decoded.userId);
      socket.userRole = decoded.role || 'user'; // Default ke 'user' jika tidak ada

      console.log(`Auth data: userId=${socket.userId}, role=${socket.userRole}`);

      // Cek apakah user atau dokter
      if (decoded.role === 'dokter') {
        const dokter = await Dokter.findByPk(decoded.userId);
        if (!dokter) {
          return next(new Error("Authentication error: Dokter not found"));
        }
        socket.user = dokter;
      } else {
        const user = await User.findByPk(decoded.userId);
        if (!user) {
          return next(new Error("Authentication error: User not found"));
        }
        socket.user = user;
      }

      next();
    } catch (error) {
      console.error("Socket authentication error:", error);
      next(new Error("Authentication error"));
    }
  });

  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.userId}, Role: ${socket.userRole}`);
    
    // Simpan koneksi
    activeConnections.set(socket.userId, socket);
    
    // Update status online
    onlineUsers.set(socket.userId, true);
    
    // Broadcast status online ke semua user
    io.emit('user_status_update', { userId: socket.userId, isOnline: true });

    // Join room berdasarkan checkoutId
    socket.on('join_room', async (data) => {
      try {
        const { checkoutId } = data;
        
        // Validasi apakah user/dokter memiliki akses ke room ini
        const checkout = await CheckoutKonsultasi.findByPk(checkoutId, {
          include: [
            {
              association: 'pembayaran',
            },
            {
              association: 'dokter',
              attributes: ['id', 'nama', 'email'],
            },
            {
              association: 'user',
              attributes: ['id', 'name', 'email'],
            }
          ]
        });

        if (!checkout) {
          socket.emit('error', { message: 'Data konsultasi tidak ditemukan' });
          return;
        }

        // Cek apakah pembayaran ada dan statusnya selesai
        if (!checkout.pembayaran || checkout.pembayaran.status !== 'selesai') {
          socket.emit('error', { 
            message: 'Konsultasi belum dapat dimulai karena pembayaran belum selesai', 
            status: checkout.pembayaran ? checkout.pembayaran.status : 'unknown' 
          });
          return;
        }

        // Cek apakah user adalah pemilik pesanan atau dokternya
        if (socket.userId !== String(checkout.user_id) && socket.userId !== String(checkout.dokter_id)) {
          console.log(`Access denied: socketUserId=${socket.userId}, checkoutUserId=${checkout.user_id}, checkoutDokterId=${checkout.dokter_id}`);
          socket.emit('error', { 
            message: 'Anda tidak memiliki akses ke room ini',
            debug: {
              socketUserId: socket.userId,
              checkoutUserId: checkout.user_id,
              checkoutDokterId: checkout.dokter_id
            }
          });
          return;
        }

        // Buat room ID
        const roomId = `consultation_${checkoutId}`;
        
        // Join room
        socket.join(roomId);
        
        // Tambahkan ke active rooms jika belum ada
        if (!activeRooms.has(roomId)) {
          activeRooms.set(roomId, {
            checkoutId,
            userId: checkout.user_id,
            dokterId: checkout.dokter_id,
            startTime: null,
            endTime: null
          });
        }
        
        // Kirim pesan selamat datang
        socket.emit('room_joined', { 
          roomId, 
          message: 'Berhasil bergabung ke room konsultasi',
          consultation: {
            id: checkout.id,
            tanggal: checkout.tanggal_checkout_konsultasi,
            lama_konsultasi: checkout.lama_konsultasi,
            dokter: checkout.dokter ? { 
              id: checkout.dokter.id, 
              nama: checkout.dokter.nama,
              online: onlineUsers.has(checkout.dokter.id.toString()) && onlineUsers.get(checkout.dokter.id.toString())
            } : null,
            user: checkout.user ? {
              id: checkout.user.id,
              name: checkout.user.name,
              online: onlineUsers.has(checkout.user.id.toString()) && onlineUsers.get(checkout.user.id.toString())
            } : null
          }
        });
        
        // Broadcast ke room bahwa user bergabung
        socket.to(roomId).emit('user_joined', { 
          userId: socket.userId, 
          name: socket.user.name || socket.user.nama,
          role: socket.userRole
        });

        // Load riwayat chat
        const chatHistory = await ChatKonsultasi.findAll({
          where: { checkout_konsultasi_id: checkoutId },
          order: [['created_at', 'ASC']]
        });

        socket.emit('chat_history', chatHistory);

        // Cek apakah konsultasi sudah dimulai
        const activeChat = await ChatKonsultasi.findOne({
          where: { 
            checkout_konsultasi_id: checkoutId,
            waktu_mulai_konsultasi: { [Op.ne]: null },
            waktu_selesai_konsultasi: null
          }
        });

        if (activeChat) {
          // Jika konsultasi sudah dimulai, update info di active rooms
          activeRooms.get(roomId).startTime = activeChat.waktu_mulai_konsultasi;
          
          // Hitung sisa waktu konsultasi
          const endTime = new Date(activeChat.waktu_mulai_konsultasi);
          // Tambahkan lama konsultasi (dalam menit)
          endTime.setMinutes(endTime.getMinutes() + checkout.lama_konsultasi);
          
          socket.emit('consultation_status', { 
            status: 'active',
            startTime: activeChat.waktu_mulai_konsultasi,
            endTime: endTime,
            remainingTime: Math.max(0, endTime - new Date()) // dalam milidetik
          });
        } else {
          socket.emit('consultation_status', { 
            status: 'waiting',
            message: socket.userRole === 'dokter' ? 
              'Silakan mulai konsultasi dengan pasien' : 
              'Menunggu dokter untuk memulai konsultasi'
          });
        }
      } catch (error) {
        console.error('Error joining room:', error);
        socket.emit('error', { message: 'Gagal bergabung ke room' });
      }
    });

    // Memulai konsultasi (dipanggil oleh dokter)
    socket.on('start_consultation', async (data) => {
      try {
        const { checkoutId } = data;
        const roomId = `consultation_${checkoutId}`;

        // Validasi akses dan role
        if (socket.userRole !== 'dokter') {
          socket.emit('error', { message: 'Hanya dokter yang dapat memulai konsultasi' });
          return;
        }

        const checkout = await CheckoutKonsultasi.findByPk(checkoutId);
        if (!checkout || socket.userId !== String(checkout.dokter_id)) {
          socket.emit('error', { message: 'Anda tidak memiliki akses untuk memulai konsultasi ini' });
          return;
        }

        // 1. Apakah konsultasi ini sudah pernah selesai?
        const endedChat = await ChatKonsultasi.findOne({
          where: {
            checkout_konsultasi_id: checkoutId,
            // artinya konsultasi sudah ada waktu_selesai
            waktu_selesai_konsultasi: { [Op.ne]: null }
          }
        });

        if (endedChat) {
          // Jika endedChat ada, berarti sesi ini sudah benar-benar berakhir
          socket.emit('error', { message: 'Konsultasi sudah berakhir. Tidak dapat memulai ulang.' });
          return;
        }

        // 2. Apakah sudah ada yang aktif sekarang?
        const activeChat = await ChatKonsultasi.findOne({
          where: { 
            checkout_konsultasi_id: checkoutId,
            waktu_mulai_konsultasi: { [Op.ne]: null },
            waktu_selesai_konsultasi: null
          }
        });

        if (activeChat) {
          socket.emit('error', { message: 'Konsultasi sudah dimulai' });
          return;
        }

        // Buat record chat pertama sebagai penanda dimulainya konsultasi
        const startTime = new Date();
        const newChat = await ChatKonsultasi.create({
          checkout_konsultasi_id: checkoutId,
          user_id: socket.userId,             // Dokter yang memulai
          dokter_id: checkout.dokter_id,
          pesan_konsultasi: 'Konsultasi dimulai',
          status_pesan_konsultasi: 'terkirim',
          waktu_mulai_konsultasi: startTime
        });

        // Update info di active rooms
        if (activeRooms.has(roomId)) {
          activeRooms.get(roomId).startTime = startTime;
        }

        // Hitung waktu selesai
        const endTime = new Date(startTime);
        endTime.setMinutes(endTime.getMinutes() + checkout.lama_konsultasi);

        // Broadcast ke semua user di room bahwa konsultasi dimulai
        io.to(roomId).emit('consultation_started', {
          startTime,
          endTime,
          remainingTime: checkout.lama_konsultasi * 60 * 1000, // dalam milidetik
          message: newChat
        });

        // Set timer untuk mengakhiri konsultasi otomatis
        setTimeout(async () => {
          try {
            // Cek apakah konsultasi masih aktif
            const stillActiveChat = await ChatKonsultasi.findOne({
              where: { 
                checkout_konsultasi_id: checkoutId,
                waktu_mulai_konsultasi: { [Op.ne]: null },
                waktu_selesai_konsultasi: null
              }
            });

            if (stillActiveChat) {
              // Update waktu selesai
              await stillActiveChat.update({
                waktu_selesai_konsultasi: new Date()
              });

              // Buat pesan system bahwa konsultasi berakhir
              await ChatKonsultasi.create({
                checkout_konsultasi_id: checkoutId,
                user_id: stillActiveChat.user_id,
                dokter_id: stillActiveChat.dokter_id,
                pesan_konsultasi: 'Konsultasi berakhir (waktu habis)',
                status_pesan_konsultasi: 'terkirim'
              });

              // Broadcast ke semua user di room bahwa konsultasi berakhir
              io.to(roomId).emit('consultation_ended', {
                reason: 'timeout',
                message: 'Konsultasi berakhir karena waktu habis'
              });

              // Update active rooms
              if (activeRooms.has(roomId)) {
                activeRooms.get(roomId).endTime = new Date();
              }
            }
          } catch (error) {
            console.error('Error ending consultation:', error);
          }
        }, checkout.lama_konsultasi * 60 * 1000);

      } catch (error) {
        console.error('Error starting consultation:', error);
        socket.emit('error', { message: 'Gagal memulai konsultasi' });
      }
    });


    // Kirim pesan
    socket.on('send_message', async (data) => {
      try {
        const { message, checkoutId } = data;
        const roomId = `consultation_${checkoutId}`;
        
        // Validasi input
        if (!message || message.trim() === '') {
          socket.emit('error', { message: 'Pesan tidak boleh kosong' });
          return;
        }

        // Cek apakah konsultasi aktif
        const activeChat = await ChatKonsultasi.findOne({
          where: { 
            checkout_konsultasi_id: checkoutId,
            waktu_mulai_konsultasi: { [Op.ne]: null },
            waktu_selesai_konsultasi: null
          }
        });

        if (!activeChat) {
          socket.emit('error', { message: 'Konsultasi belum dimulai atau sudah berakhir' });
          return;
        }

        // Validasi akses
        const checkout = await CheckoutKonsultasi.findByPk(checkoutId);
        if (!checkout || (socket.userId !== String(checkout.user_id) && socket.userId !== String(checkout.dokter_id))) {
          socket.emit('error', { message: 'Anda tidak memiliki akses ke konsultasi ini' });
          return;
        }

        // Tentukan user_id dan dokter_id berdasarkan role
        let userId, dokterId;
        if (socket.userRole === 'dokter') {
          dokterId = socket.userId;
          userId = checkout.user_id;
        } else {
          userId = socket.userId;
          dokterId = checkout.dokter_id;
        }

        // Buat pesan baru
        const newMessage = await ChatKonsultasi.create({
          checkout_konsultasi_id: checkoutId,
          user_id: userId,
          dokter_id: dokterId,
          pesan_konsultasi: message,
          status_pesan_konsultasi: 'terkirim'
        });

        // Broadcast pesan ke room
        io.to(roomId).emit('receive_message', {
          ...newMessage.toJSON(),
          sender: {
            id: socket.userId,
            name: socket.user.name || socket.user.nama,
            role: socket.userRole
          }
        });
      } catch (error) {
        console.error('Error sending message:', error);
        socket.emit('error', { message: 'Gagal mengirim pesan' });
      }
    });

    // Update status pesan dibaca
    socket.on('mark_as_read', async (data) => {
      try {
        const { messageId } = data;
        
        const message = await ChatKonsultasi.findByPk(messageId);
        if (!message) {
          socket.emit('error', { message: 'Pesan tidak ditemukan' });
          return;
        }

        // Validasi akses
        const checkout = await CheckoutKonsultasi.findByPk(message.checkout_konsultasi_id);
        if (!checkout || (socket.userId !== String(checkout.user_id) && socket.userId !== String(checkout.dokter_id))) {
          socket.emit('error', { message: 'Anda tidak memiliki akses ke pesan ini' });
          return;
        }

        // Update status pesan
        await message.update({
          status_pesan_konsultasi: 'dibaca'
        });

        // Broadcast update ke room
        const roomId = `consultation_${message.checkout_konsultasi_id}`;
        io.to(roomId).emit('message_read', {
          messageId,
          status: 'dibaca'
        });
      } catch (error) {
        console.error('Error marking message as read:', error);
        socket.emit('error', { message: 'Gagal mengubah status pesan' });
      }
    });

    // Hapus pesan
    socket.on('delete_message', async (data) => {
      try {
        const { messageId } = data;
        
        const message = await ChatKonsultasi.findByPk(messageId);
        if (!message) {
          socket.emit('error', { message: 'Pesan tidak ditemukan' });
          return;
        }

        // Validasi apakah user adalah pengirim pesan
        let isMessageSender = false;
        if (socket.userRole === 'dokter') {
          isMessageSender = message.dokter_id.toString() === socket.userId;
        } else {
          isMessageSender = message.user_id.toString() === socket.userId;
        }

        if (!isMessageSender) {
          socket.emit('error', { message: 'Anda hanya dapat menghapus pesan yang Anda kirim' });
          return;
        }

        // Hapus pesan
        await message.destroy();

        // Broadcast deletion ke room
        const roomId = `consultation_${message.checkout_konsultasi_id}`;
        io.to(roomId).emit('message_deleted', {
          messageId
        });
      } catch (error) {
        console.error('Error deleting message:', error);
        socket.emit('error', { message: 'Gagal menghapus pesan' });
      }
    });

    // Selesaikan room (dipanggil oleh user)
    socket.on('end_consultation', async (data) => {
      try {
        const { checkoutId } = data;
        const roomId = `consultation_${checkoutId}`;
        
        // Validasi akses dan role
        if (socket.userRole !== 'user') {
          socket.emit('error', { message: 'Hanya user yang dapat mengakhiri konsultasi' });
          return;
        }
        
        const checkout = await CheckoutKonsultasi.findByPk(checkoutId);
        if (!checkout || socket.userId !== String(checkout.user_id)) {
          socket.emit('error', { message: 'Anda tidak memiliki akses untuk mengakhiri konsultasi ini' });
          return;
        }

        // Cek apakah konsultasi masih aktif
        const activeChat = await ChatKonsultasi.findOne({
          where: { 
            checkout_konsultasi_id: checkoutId,
            waktu_mulai_konsultasi: { [Op.ne]: null },
            waktu_selesai_konsultasi: null
          }
        });

        if (!activeChat) {
          socket.emit('error', { message: 'Konsultasi belum dimulai atau sudah berakhir' });
          return;
        }

        // Update waktu selesai
        await activeChat.update({
          waktu_selesai_konsultasi: new Date()
        });

        // Buat pesan system bahwa konsultasi berakhir
        await ChatKonsultasi.create({
          checkout_konsultasi_id: checkoutId,
          user_id: checkout.user_id,
          dokter_id: checkout.dokter_id,
          pesan_konsultasi: 'Konsultasi diakhiri oleh pengguna',
          status_pesan_konsultasi: 'terkirim'
        });

        // Broadcast ke semua user di room bahwa konsultasi berakhir
        io.to(roomId).emit('consultation_ended', {
          reason: 'user_ended',
          message: 'Konsultasi diakhiri oleh pengguna'
        });

        // Update active rooms
        if (activeRooms.has(roomId)) {
          activeRooms.get(roomId).endTime = new Date();
        }
      } catch (error) {
        console.error('Error ending consultation:', error);
        socket.emit('error', { message: 'Gagal mengakhiri konsultasi' });
      }
    });

    // Disconnect
    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.userId}`);
      
      // Hapus dari active connections
      activeConnections.delete(socket.userId);
      
      // Update status offline
      onlineUsers.set(socket.userId, false);
      
      // Broadcast status offline ke semua user
      io.emit('user_status_update', { userId: socket.userId, isOnline: false });
    });
  });

  return io;
}