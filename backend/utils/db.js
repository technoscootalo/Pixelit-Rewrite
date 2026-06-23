const mongoose = require("mongoose");

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI, {
            dbName: "Pixelit-Rewrite"
        });

        console.log("MongoDB database connection successfully established.");
    } catch (error) {
        console.error("Failed to establish MongoDB connection:", error.message);
        process.exit(1); 
    }
};

module.exports = connectDB;