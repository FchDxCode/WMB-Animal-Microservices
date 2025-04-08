import express from 'express';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import redoc from 'redoc-express';
import swaggerSpec from './src/config/swagger.js'; 
import dotenv from 'dotenv';
import swaggerJSDoc from 'swagger-jsdoc';
import path from 'path';
import { runPaymentExpirationScheduler } from './src/scheduler/paymentExpirationScheduler.js';

// import routes
import registerRoutes from './src/routes/registerRoutes.js';
import loginRoutes from './src/routes/loginRoutes.js';
import userRoutes from './src/routes/userRoutes.js';
import petRoutes from './src/routes/petRoutes.js';
import alamatUserRoutes from './src/routes/alamatUserRoutes.js';
import artikelRoutes from './src/routes/artikelRoutes.js';
import klinikRoutes from './src/routes/klinikRoutes.js';
import bookingKlinikRoutes from './src/routes/bookingKlinikRoutes.js';
import produkRoutes from './src/routes/produkRoutes.js';
import coinUserRoutes from './src/routes/coinUserRoutes.js';
import historyRoutes from './src/routes/historyRoutes.js';
import mediaSectionsRoutes from './src/routes/mediaSectionsRoutes.js';
import configWebsiteRoutes from './src/routes/configWebsiteRoutes.js';
import productRoutes from './src/routes/produkRoutes.js';
import keranjangProdukRoutes from './src/routes/keranjangProdukRoutes.js';

dotenv.config();

const PORT = process.env.PORT || 3000;
const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const options = {
  definition: swaggerSpec,
  apis: ['./src/routes/*.js'], 
};
const openapiSpecification = swaggerJSDoc(options);

// Routes
app.use('/api/auth', registerRoutes);
app.use('/api/auth', loginRoutes);
app.use('/api/user', userRoutes);
app.use('/api/pets', petRoutes);
app.use('/api/alamat', alamatUserRoutes);
app.use('/api/artikel', artikelRoutes);
app.use('/api/klinik', klinikRoutes);
app.use('/api/booking-klinik', bookingKlinikRoutes);
app.use('/api/history', historyRoutes);
app.use('/api/produk', produkRoutes);
app.use('/api/coin', coinUserRoutes);
app.use('/api/media-sections', mediaSectionsRoutes);
app.use('/api/config-website', configWebsiteRoutes);
app.use('/api/keranjang', keranjangProdukRoutes);


// static storage
app.use('/images', express.static(path.join(process.cwd(), 'public', 'images')));

// Home route
app.get('/', (req, res) => {
  res.send('Server berjalan broo');
});

// Swagger UI
app.use('/docs', swaggerUi.serve, swaggerUi.setup(openapiSpecification));

// Redoc
app.get('/redoc', redoc({ 
  title: 'API Docs',
  specUrl: '/swagger.json'
}));
app.get('/swagger.json', (req, res) => {
  res.json(openapiSpecification);
});

runPaymentExpirationScheduler();

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint tidak ditemukan',
  });
});

app.use((err, req, res, next) => {
  console.error('❌ Error server:', err.stack);
  res.status(500).json({
    success: false,
    message: 'Terjadi kesalahan pada server',
    error: err.message,
  });
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
  console.log(`Swagger Docs: http://localhost:${PORT}/docs`);
  console.log(`Redoc Docs:   http://localhost:${PORT}/redoc`);
});

export default app;
