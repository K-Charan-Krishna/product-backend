const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const jwt =require('jsonwebtoken')
const bcrypt= require('bcrypt')
const fs = require('fs');
const path = require('path');
const multer = require('multer');

const app = express();
// const router = express.Router();

const User=require('./models/User')
const Product=require('./models/Products')

//word
const word='charan'

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));



// Middleware to parse JSON
app.use(cors());
app.use(express.json());

// MongoDB connection
const url = "mongodb://localhost:27017/ccart";
mongoose.connect(url, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log('MongoDB connected');
})
.catch((err) => {
  console.error('Connection error:', err);
});



// Register route
app.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    console.log(name,email,password)
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ existing });
    }
    const hashedPassword= await bcrypt.hash(password,10)
    const newUser = new User({ name, email, password:hashedPassword,admin:false });
    await newUser.save();
    console.log('data saved')
    res.status(201).json({ message: 'User registered successfully' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});


// Login 
app.post('/Login', async (req, res) => {
  const { email,password } = req.body;

  try {
    const existing = await User.findOne({email});
    if (existing) {
      const isMatch= await bcrypt.compare(password,existing.password)
      if(isMatch){
        const {name,email}=existing
        const payload={
          name,
          email
        }
        const token=jwt.sign(payload,word)
        const isAdmin=existing.admin
        return res.status(200).send({token,isAdmin})
      }
      else{
        return res.status(401).json({message:'Password Did Not Match'})
      }
    }
    // const newUser = new User({ name, email, password });
    // await newUser.save();
    // res.status(201).json({ message: 'User registered successfully' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

function checkingSortaandPrice(category, sort) {
  const isValid = category != 'undefined' && sort != 'undefined';
  console.log(isValid, 'from function');
  return isValid;
}



let products;
//products API
app.get('/allproducts',async (req,res)=>{
  const {category,sort} = req.query;
  console.log('api hits @ allproduct')
  console.log('sort: ',sort,'type: ',typeof sort)
  console.log('caregory: ',category,typeof category)
   try{
    switch(true){
      case (checkingSortaandPrice(category,sort)):
        console.log('from both price and category ')
        if (sort === 'High-Low') {
          products=await Product.find({category}).sort({price:-1})
          return res.status(200).json({products})
          } 
        else {
           products=await Product.find({category}).sort({price:1})
          return  res.status(200).json({products})
        }
        break
      case(category!='undefined'):
        console.log('from category')
        products= await Product.find({category})
        return  res.status(200).json({products})
        break
      case (sort!='undefined' && category=='undefined'):
          console.log('from sort')
          if (sort === 'High-Low') {
          console.log('High-Low')
          products=await Product.find().sort({price:-1})
          console.log(products)
          return res.status(200).json({products})
          } 
          else {
            products=await Product.find().sort({price:1})
           return res.status(200).json({products})
        }
      default:
        products=await Product.find()
        return res.status(200).json({products})
        break
    }
   }
   catch(e){
    res.status(500).json({message:e.message})
   }

})

//Uploading Image

// Setup Multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const dir = path.join(__dirname, 'uploads', 'products');
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    const timestamp = Date.now();
    // const ext = path.extname(file.originalname);
    const ext = path.basename(file.originalname);
    cb(null, `image_${timestamp}${ext}`);
  }
});

const upload = multer({ storage });

app.post('/uploads/products', upload.single('image'), async(req, res) => {
  console.log('API hit on upload Products')
  try{
    const { productId ,title,price,description,category} = req.body;
    let path=`/uploads/products/${req.file.filename}`
    const newProduct = new Product({ id:productId,title,price,description,category,image:path});
    // let data=await Product.create({ id:productId,title,price,description,category,image:path})
    await newProduct.save()
    res.send({
    message: 'File uploaded successfully',
    path: `/uploads/products/${req.file.filename}`
  });
  }
  catch(e){
    res.send({message:e.message})
  }
});

app.post('/adminaccess',async(req,res)=>{
  const {email}=req.body
  const user= await User.findOne({email})
  if (!user){
    res.send({message:"User Does't Exisist"})
  }
  await User.updateOne({email},{$set:{admin:true}})
  res.status(200).send({message:'Changes Made!'})
})


// Start server
app.listen(3000, () => {
  console.log('Server is running on port 3000');
});
