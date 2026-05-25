import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routes/auth.js";
import bookingRoutes from "./routes/bookings.js";
import adminRoutes from "./routes/admin.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

// ---- Middleware ----
app.use(cors({
  origin: "*",
  credentials: true,
}));
app.use(express.json());

// ---- Routes ----
app.get("/", (req, res) => res.json({ message: "AA Tracker API is running." }));
app.use("/api/auth", authRoutes);
app.use("/api/booking", bookingRoutes);
app.use("/api/admin", adminRoutes);

// ---- 404 handler ----
app.use((req, res) => {
  res.status(404).json({ error: "Route not found." });
});

// ---- Error handler ----
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Internal server error." });
});

app.listen(PORT, () => {
  console.log(`AA Tracker API running on port ${PORT}`);
});
