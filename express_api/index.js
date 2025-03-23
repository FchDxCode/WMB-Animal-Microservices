import express from 'express';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import redoc from 'redoc-express';
import swaggerSpec from './src/config/swagger.js'; 
import dotenv from 'dotenv';
import swaggerJSDoc from 'swagger-jsdoc';

// import routes
import registerRoutes from './src/routes/registerRoutes.js';
import loginRoutes from './src/routes/loginRoutes.js';
import userRoutes from './src/routes/userRoutes.js';

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
