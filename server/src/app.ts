import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import errorHandler from "./middleware/errorHandler";
import scanRoutes from "./routes/scanRoutes";
import reportRoutes from "./routes/reportRoutes";
import authRoutes from "./routes/authRoutes";

const app = express();

// ==========================================
// Security Middleware
// ==========================================
app.use(
  helmet({
    crossOriginResourcePolicy: false,
  })
);

// ==========================================
// General Middleware
// ==========================================
const allowedOrigins = [
  "http://localhost:5173", // Vite dev server
  "http://localhost:4173", // Vite preview
  process.env.CLIENT_URL,  // Production frontend URL (set in .env)
].filter(Boolean) as string[];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow server-to-server requests (no origin) and allowed origins
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`CORS: origin ${origin} not allowed`));
      }
    },
    credentials: true,
  })
);

app.use(morgan("dev"));

app.use(express.json());

app.use(
  express.urlencoded({
    extended: true,
  })
);

// ==========================================
// Health Check
// ==========================================
app.get("/", (_req, res) => {
  res.status(200).json({
    success: true,
    message: "SentinelShield API Running",
    version: "1.0.0",
  });
});

// ==========================================
// API Routes
// ==========================================
app.use("/api/scans", scanRoutes);
app.use("/api/report", reportRoutes);
app.use("/api/auth", authRoutes);

// ==========================================
// 404 Handler
// ==========================================
app.use((_req, res, _next) => {
  res.status(404).json({
    success: false,
    message: "Route Not Found",
  });
});

// ==========================================
// Error Handler (must be last)
// ==========================================
app.use(errorHandler);
export default app;