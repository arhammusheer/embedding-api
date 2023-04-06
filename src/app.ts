import express, { ErrorRequestHandler } from "express";
import helmet from "helmet";
import morgan from "morgan";
import compression from "compression";
import { PORT } from "./config";
import router from "./routes";
import { PrismaClient } from "@prisma/client";
import cors from "cors";

const app = express();
export const prisma = new PrismaClient();

app.use(helmet());
app.use(morgan("dev"));
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  cors({
    origin: ["http://localhost:3000", /\.croissant\.one$/],
  })
);

app.use(router);

const _404: express.RequestHandler = (req, res, next) => {
  res.status(404).json({
    status: "error",
    message: "Not Found",
  });
};

app.use(_404);

const errorHandler: ErrorRequestHandler = (err, req, res, next) => {
  res.status(500).json({
    status: "error",
    message: err.message,
  });
};

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

export default app;
