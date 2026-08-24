import express from 'express';
import cors from'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import 'dotenv/config';
import path from 'path';
import { fileURLToPath } from 'url';
import multer from 'multer';


const app = express();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Routers 
import userRouter from './Routers/userRouter.js';
import animalRoutes from './Routers/Animalroutes.js'
import teamRouter from './Routers/teamRouter.js';
import StatusRoute from './Routers/StatusRoute.js'
import WeightValuationRoute from './Routers/WeightValuationRoute.js'



// ─── Security & Parsing Middleware ───────────────────────────────
// crossOriginResourcePolicy: 'cross-origin' is required because the
// frontend (e.g. http://localhost:5173) loads uploaded animal images
// from this API (http://localhost:5000/uploads/...). The default
// 'same-origin' policy silently blocks those images in the browser.
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── Static files (uploaded animal images) ───────────────────────
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ─── CORS ─────────────────────────────────────────────────────────
app.use(cors({
  origin: process.env.CLIENT_URL, // e.g. http://localhost:5173
  credentials: true,
}));


app.use('/user', userRouter);
app.use('/animal/api', animalRoutes);
app.use('/team/api', teamRouter)
app.use('/status/api', StatusRoute);
app.use('/weight/api', WeightValuationRoute);

// ─── 404 Handler ───────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// ─── Global Error Handler ──────────────────────────────────────────
app.use((err, req, res, next) => {
  // Multer errors (file uploads)
  if (err instanceof multer.MulterError) {
    return res.status(err.code === 'LIMIT_FILE_SIZE' ? 413 : 400).json({
      success: false,
      message:
        err.code === 'LIMIT_FILE_SIZE'
          ? 'Image is too large. Maximum size is 5MB.'
          : `Upload error: ${err.message}`,
    });
  }
  if (err && err.message === 'Only image files are allowed (JPEG, PNG, GIF, WEBP)') {
    return res.status(400).json({ success: false, message: err.message });
  }

  console.error(err.stack);
  res.status(500).json({ success: false, message: 'Internal server error' });
});

// ─── Start Server ───────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
