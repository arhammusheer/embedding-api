import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import compression from "compression";
import { PORT } from "./config";

const app = express();

app.use(helmet());
app.use(morgan("dev"));
app.use(compression());

const _404: express.RequestHandler = (req, res, next) => {
  res.status(404).json({
    status: "error",
    message: "Not Found",
  });
};

app.use(_404);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

export default app;
