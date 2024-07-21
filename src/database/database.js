import mongoose from "mongoose";

const connectDatabase = async () => {
  try {
    const databaseInstance = await mongoose.connect(
      `${process.env.MONGODB_URI}/${process.env.DATABASE_NAME}`
    );
    console.log(
      `SUCCESS: Database Connection is Successfull: ${databaseInstance.connection.host}`
    );
  } catch (error) {
    console.log("ERROR: In Connecting Database: ", error);
    process.exit(1);
  }
};

export default connectDatabase;
