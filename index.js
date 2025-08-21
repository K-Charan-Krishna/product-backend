const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const jwt =require('jsonwebtoken')
const bcrypt= require('bcrypt')
const fs = require('fs');
const path = require('path');
const multer = require('multer');
require('dotenv').config();
const nodemailer = require('nodemailer');

const app = express();
// const router = express.Router();

const User=require('./models/User')
const Product=require('./models/Products');
const { uploads3 } = require('./utilits/multers3');
const { uploadFile, deleteFile } = require('./utilits/s3uploads');

//word
const word='charan'

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));



// Middleware to parse JSON
app.use(cors({origin:"http://localhost:64242/"}));
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

// const storage=multer.memoryStorage({
//   filename:function(req,file,cb){
//     console.log(req.file)
//   }
// })

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

//get single Product 

app.get('/product/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findOne({id});

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    const category = product.category;
    const related_products = await Product.find({category});
    res.status(200).json({
      product,
      related_products,
    });

  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

app.post('/uplodetos3',uploads3.single('image'),async(req,res)=>{
    try {
      const {productId,title,price,description,category}=req.body
      const bucketName=process.env.AWS_BUCKET_NAME
      const key=Date.now()+req.file.originalname;
      const fileBuffer=req.file.buffer.data;
      const mimetype=req.file.mimetype;
      const fileuploade=await uploadFile(bucketName, key, fileBuffer, mimetype)
      const newProduct = new Product({ id:productId,title,price,description,category,image:fileuploade,key:key});
      await newProduct.save()
      return res.status(201).send({
              success:true,
              statuscode:201,
              message: 'File uploaded successfully',
              data: fileuploade,
            });
    } catch (error) {
    return res.status(500).json({
        success:false,
        statuscode:500,
        message:'Unable to Create!',
        data:[]
    })
    }
})

app.post('/deletefroms3',uploads3.single('image'),async(req,res)=>{
  try {
    const bucketName=process.env.AWS_BUCKET_NAME
    const {productId}=req.query
    console.log(productId)
    const products=await Product.findOne({id:productId})
    if (!products){
      return res.status(400).json({
        success:false,
        statuscode:400,
        message:'Product Not Found!',
        data:[]
      })
    }
    console.log(products)
    const key =products.key
    const deleteFileres=await deleteFile(bucketName,key)
    await Product.deleteOne({id:productId})
    return res.status(200).json({
        success:deleteFileres,
        statuscode:200,
        message:'Deleted Successfully!',
        data:[]
    })
  } catch (error) {
    return res.status(500).json({
        success:false,
        statuscode:500,
        message:'Unable to Delete!',
        data:[]
    })
  }
})

app.post('/sendmail',async(req,res)=>{
  // Create transporter
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'your-email@gmail.com',
      pass: 'your-app-password', // or real password (not recommended)
    },
  });
  const mailOptions = {
  from: 'your-email@gmail.com',
  to: 'recipient@example.com',
  subject: 'Test Email from Node.js',
  text: 'Hello! This is a plain text email.',
  // or use HTML
  // html: '<h1>Hello</h1><p>This is an HTML email.</p>',
};
transporter.sendMail(mailOptions, (error, info) => {
  if (error) {
    console.error('Error sending email:', error);
  } else {
    console.log('Email sent:', info.response);
  }
})
  
})


// Start server
app.listen(3000, () => {
  console.log('Server is running on port 3000');
});
