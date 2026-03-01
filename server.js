// importing module and packages
import express from "express";
import cookieParser from "cookie-parser";
import "dotenv/config";
import connectDB from "./config/db.js";
import cors from "cors";
import os from "os";
import helmet from "helmet";


// importing routes
import allRoutes from "./routes/index.js";


const app = express();
const PORT = process.env.PORT || 3000;

// Security Middleware
app.use(helmet());

// CORS Configuration (Restricted for production)
const corsOptions = {
  origin: process.env.NODE_ENV === "production"
    ? [process.env.FRONTEND_URL || "https://hiresmart.vercel.app"]
    : true,
  credentials: true,
};
app.use(cors(corsOptions));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// connect to database globally
connectDB();

// setting up routes
app.use("/", allRoutes);

// Global Error Handler
app.use((err, req, res, next) => {
  console.error(`[Error] ${err.stack}`);
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    isStatus: false,
    msg: process.env.NODE_ENV === "production" ? "Internal Server Error" : err.message,
    data: null,
  });
});


// get local network IP
const getLocalIP = () => {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) return iface.address;
    }
  }
  return 'localhost';
};

// starting server
app.listen(PORT, '0.0.0.0', () => {
  const ip = getLocalIP();
  console.log(`\n🚀 HireSmart Backend Running!\n`);
  console.log(`   Local:   http://localhost:${PORT}`);
  console.log(`   Network: http://${ip}:${PORT}\n`);
});

export default app;
