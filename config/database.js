const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        const mongoURI = 'mongodb://himanshucodeyogi_db_user:avCDEF6W3nI4TcGr@ac-z3n9hea-shard-00-01.bf0hjq3.mongodb.net:27017,ac-z3n9hea-shard-00-02.bf0hjq3.mongodb.net:27017,ac-z3n9hea-shard-00-00.bf0hjq3.mongodb.net:27017/sugbot?ssl=true&authSource=admin&retryWrites=true&w=majority';
        
        const conn = await mongoose.connect(mongoURI);

        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error('Database connection error:', error);
        process.exit(1);
    }
};

module.exports = connectDB;
