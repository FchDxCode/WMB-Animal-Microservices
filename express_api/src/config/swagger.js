// src/config/swagger.js

export default {
  openapi: '3.0.0',
  info: {
    title: 'Api WMB Animal Apps',
    version: '1.0.0',
    description: 'Dokumentasi API wmb animal apps',
  },
  servers: [
    {
      url: 'http://localhost:3000', 
      description: 'Local server',
    },
  ],
  paths: {
    // generate otomatis
  },
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
  },
};
