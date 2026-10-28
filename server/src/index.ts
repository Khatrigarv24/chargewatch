import express from "express";
import cors from "cors";
import { sitesRouter } from "./routes/sites.js";
import { chargersRouter } from "./routes/chargers.js";
import { errorHandler } from "./lib/errors.js";

const app = express();
app.use(cors());
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/sites", sitesRouter);
app.use("/api/chargers", chargersRouter);

app.use(errorHandler);

const port = process.env.PORT ? Number(process.env.PORT) : 3000;
if (process.env.NODE_ENV !== "test") {
  app.listen(port, () => {
    console.log(`chargewatch server listening on :${port}`);
  });
}

export default app;
