import express from "express";
import cors from "cors";
import { connectToserver } from "./src/config/dbconnect";
import  auth  from "./src/routes/auth/accountAuth";


const app = express();
const PORT = process.env.PORT || 3000;

// Global middleware
app.use(cors());
app.use(express.json());
app.use(auth);


app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  connectToserver()
});
