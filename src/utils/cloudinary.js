import { v2 as cloudinary } from "cloudinary"
import fs from "fs"

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

/**
 * 
 * @param {string} localFilePath 
 * @returns response
 * 
 * This function upload the media file to cloudinary.
 * This will return an object response from which we will take out the url and 
 * save in our database
 */

const uploadMediaOnCloudinary = async (localFilePath) => {
    try {
        if (!localFilePath) return null;

        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto"
        });

        console.log("SUCCESS: File uploaded to cloudinary successfully: "
            , response);

        fs.unlinkSync(localFilePath)

        return response;
    } catch (error) {
        fs.unlinkSync(localFilePath);
        return null;
    }
}

export { uploadMediaOnCloudinary }