const express = require('express')
const cors = require('cors')
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
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


// Jwt verification
const jwtVerification = (req, res, next) => {
  // console.log("Verifing");
  const authorization = req.headers.authorization;
  if (!authorization) {
    return res.status(403).send("Unauthorized Access")
  }
  const token = authorization.split(" ")[1]
  // console.log(token);
  jwt.verify(token, process.env.PRIVATE_KEYS, (error, decoded) => {
    if (error) {
      return res.status(403).send("Unauthorized access")
    }
    req.decoded = decoded;
    next();
  })
}

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    const productCollection = client.db("emaJohnProducts").collection("products");
    const cartCollection = client.db("emaJohnProducts").collection("customerCart")

    // JWT API
    app.post("/jwt", (req, res) => {
      const user = req.body;
      console.log(user);
      const token = jwt.sign(user, process.env.PRIVATE_KEYS, { expiresIn: '2h' });
      res.send({ token })
    })

    // Get all products API
    app.get("/allProducts", async (req, res) => {
      // console.log(req.query);
      const page = parseInt(req.query.page) || 0;
      const limit = parseInt(req.query.limit) || 15;
      const skip = page*limit;

      const result = await productCollection.find().skip(skip).limit(limit).toArray();
      res.send(result)
    })

    // Get total Product for pagination
    app.get("/totalProducts",async(req,res)=>{
      const result = await productCollection.estimatedDocumentCount();
      res.send({totalProducts : result})
    })


    //Get Product by query
    app.get("/cartProducts", jwtVerification, async (req, res) => {
      const decoded = req.decoded;
      if (decoded.email !== req.query.userEmail) {
        res.status(403).send("Forbidden")
      }
      let query = {}
      if (req.query.userEmail) {
        query = { userEmail: req.query.userEmail }
      }
      // console.log(query);
      const result = await cartCollection.find(query).toArray();
      res.send(result)
    })

    // Delete API
    app.delete("/cartProducts/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await cartCollection.deleteOne(query);
      res.send(result);
    })


    // Add products of customer in db
    app.post("/cartProducts", async (req, res) => {
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


app.get("/", (req, res) => {
  res.send("The Ema John Server")
})

app.listen(port, () => {
  console.log(`This app listening at port ${port}`)
})