import express from "express";
import cors from "cors";
import jobsRouter from "./routes/jobs.js";
import mlRouter from "./routes/ml.js";
import interviewsRouter from "./routes/interviews.js";

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Simple health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "Backend is running!" });
});

app.use("/api/jobs", jobsRouter);
app.use("/api/ml", mlRouter);
app.use("/api/interviews", interviewsRouter);

app.listen(PORT, () => {
  console.log(`Backend server listening on port ${PORT}`);
});
