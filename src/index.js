import dotenv from "dotenv";
import connectDatabase from "./database/database.js";
import { app, PORT } from "./app.js";

/**
 * Here we are providing the path to the .env file.
 */
dotenv.config({
  path: "./.env",
});

/**
 *
 * Here we are connecting our database with node server.
 * After the database connection is successfull, we are making our server listen
 *  request on port: PORT.
 *
 */

connectDatabase()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`SUCCESS: Server is running on port: ${PORT}`);
    });
  })
  .catch((error) => {
    console.log("ERROR: In Connecting Database: ", error);
  });
