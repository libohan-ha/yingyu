const mongoose = require('mongoose');

// MongoDB 连接函数
const connectDB = async () => {
  try {
    const conn = await mongoose.connect('mongodb+srv://bl5724876:079825lbh@cluster0.0esozol.mongodb.net/english_learning', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log(`MongoDB 连接成功: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`MongoDB 连接错误: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
