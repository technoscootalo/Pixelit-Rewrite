const mongoose = require("mongoose");

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI, {
            dbName: "Pixelit-Rewrite"
        });

        console.log("MongoDB connected");
    } catch (err) {
        console.error("MongoDB connection failed:", err);
        process.exit(1);
    }
};

module.exports = connectDB;