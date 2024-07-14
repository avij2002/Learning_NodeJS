import dotenv from "dotenv";
import connectDatabase from "./database/database.js";
import { app, PORT } from "./app.js";

dotenv.config({
    path: "./.env"
});

connectDatabase().then(() => {
    app.listen(PORT, () => {
        console.log(`Server is running on port: ${PORT}`);
    });
}).catch((error) => {
    console.log("ERROR: In Connecting Database: ", error);
})