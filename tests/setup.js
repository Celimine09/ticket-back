const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongoServer;

// เตรียมฐานข้อมูลในหน่วยความจำก่อนทำการทดสอบทั้งหมด
beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  
  await mongoose.connect(uri);
  console.log('Connected to the in-memory database');
});

// ล้างข้อมูลในฐานข้อมูลระหว่างการทดสอบแต่ละชุด
afterEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    const collection = collections[key];
    await collection.deleteMany({});
  }
});

// ตัดการเชื่อมต่อและหยุดเซิร์ฟเวอร์หลังจบการทดสอบทั้งหมด
afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
  console.log('Disconnected from the in-memory database');
});