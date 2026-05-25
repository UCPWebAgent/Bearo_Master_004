import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Simple in-memory cache for parts
const partsCache = new Map<string, any>();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Orders API
  app.post('/api/orders', async (req, res) => {
    const order = req.body;
    console.log(`Processing Order for ${order.mechanicName} at ${order.shopName}`);
    
    // Simulate backend processing (e.g., sending to a parts supplier)
    setTimeout(() => {
      res.json({
        status: 'success',
        orderId: `ABC-${Math.floor(Math.random() * 1000000)}`,
        message: 'Order received and queued for fulfillment'
      });
    }, 1200);
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Ria Server running on http://localhost:${PORT}`);
  });
}

startServer();
