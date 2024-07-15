import { Schema, model } from "mongoose";
import bcrypt from "bcrypt"
const userSchema = Schema({
    username: {
        type: String,
        required: true,
        trim: true,
        index: true,
        unique: true,
        lowercase: true
    },
    email: {
        type: String,
        required: true,
        lowercase: true,
        unique: true,
        trim: true
    },
    fullname: {
        type: String,
        required: [true, "FullName is required"],
        trim: true,
        index: true
    },
    password: {
        type: String,
        required: [true, "Password is required"]
    },
    avatar: {
        type: String, // cloudinary url
        required: true
    },
    coverImage: {
        type: String, // cloudinary url
    },
    watchHistory: [{
        type: Schema.Types.ObjectId,
        ref: "Video"
    }],
    refreshToken: {
        type: String
    }
}, { timestamps: true });

/**
 * pre is a middleware used in mongoose to perform some operations before some 
   event
 */
userSchema.pre("save", async function() {
    if(!this.isModified("password")) return next();
    
    this.password = await bcrypt.hash(this.password, 10);
    next()
})

export const User = model("User", userSchema);