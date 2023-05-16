const express = require('express')
const cors = require('cors')
const { MongoClient, ServerApiVersion } = require('mongodb');
const jwt = require("jsonwebtoken");
require('dotenv').config();
const port = process.env.PORT || 5000;
const app = express();

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.8cnv71c.mongodb.net/?retryWrites=true&w=majority`;

app.use(cors());
app.use(express.json());





// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    const productCollection = client.db("emaJohnProducts").collection("products");
const cartCollection = client.db("emaJohnProducts").collection("customerCart")

// JWT API
app.post("/jwt",(req,res)=>{
  const user = req.body;
  console.log(user);
  const token = jwt.sign(user , process.env.PRIVATE_KEYS,{expiresIn:'2h'});
  res.send({token})
})

    app.get("/allProducts", async(req,res)=>{
        const result = await productCollection.find({}).toArray();
        res.send(result)
    })


    //Get Product by query
    app.get("/cartProducts",async(req,res)=>{
      let query = {} 
      if(req.query.userEmail){
        query = {userEmail : req.query.userEmail}
      }
      console.log(query);
      const result = await cartCollection.find(query).toArray();
      res.send(result)
    })


    // Add products of customer in db
    app.post("/cartProducts",async(req,res)=>{
      const body = req.body;
      const result = await cartCollection.insertOne(body);
      res.send(result)
    })















    // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });
    console.log("Server successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);


app.get("/",(req,res)=>{
    res.send("The Ema John Server")
})

app.listen(port , ()=>{
    console.log(`This app listening at port ${port}`)
})