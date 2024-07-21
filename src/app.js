import express, { urlencoded } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import userRouter from "./routes/user.routes.js";

const app = express();
const PORT = process.env.PORT || 3000;

/**
 * cors -> This middleware is used to handle cors related queries.
 */

app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  })
);

/**
 * These are middlwares used by express.js
 * 
 * express.json -> This middleware function is used to parse incoming JSON 
   requests
 * express.urlencoded -> This middleware function is used to parse incoming 
   requests with URL-encoded payloads.
 * express.static("public") -> This middleware function serves static files from
   the specified directory.
 * cookieParser -> This middleware is used to handle cookies.
 * 
 */

app.use(express.json({ limit: "16kb" }));
app.use(urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public"));
app.use(cookieParser());

//Routes
app.use("/api/v1/user", userRouter);

export { app, PORT };
