import express from 'express';
import cors from'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import 'dotenv/config';


const app = express();

// Routers 
import userRouter from './Routers/userRouter.js';


// ─── Security & Parsing Middleware ───────────────────────────────
app.use(helmet());
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── CORS ─────────────────────────────────────────────────────────
app.use(cors({
  origin: process.env.CLIENT_URL, // e.g. http://localhost:5173
  credentials: true,
}));


app.use('/user', userRouter);

// ─── 404 Handler ───────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// ─── Global Error Handler ──────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: 'Internal server error' });
});

// ─── Start Server ───────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
