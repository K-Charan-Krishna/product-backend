const multer=require("multer")
 
// Memory storage (file kept in buffer)
const storage = multer.memoryStorage();
 
const uploads3 = multer({ storage });

module.exports={uploads3}