const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken");

const app = express();
const port = 7002;

app.use(cors());
app.use(express.json());


const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = "mongodb+srv://rkshivaanisree2003:W6UI3nIHIY8ErHp8@cluster0.3oomybk.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

const secretKey = "magickhome";

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    const userCollection = client.db("magickhome").collection("users");
    app.post("/register", async(req, res) => {
      const {username, password} = req.body;
      const hashedPassword = await bcrypt.hash(password, 10);
      const result = await userCollection.insertOne({username, password: hashedPassword});
      res.send(result);
    })

    app.post("/login", async(req, res) => {
      const {username, password} = req.body;
      const user = await userCollection.findOne({username});
      if(user) {
        const validUser = await bcrypt.compare(password, user.password);
        if(validUser) {
          const token = jwt.sign({username}, secretKey, {expiresIn: '1h'});
          res.json({token})
        } else {
          res.status(401).json({message: "Invalid password"});
        }
      } else {
          res.status(401).json({message: "Invalid password"});
        }
    })

    const feedbackCollection = client.db("magickhome").collection("feedback");
    app.post("/sendfeedback", async(req, res) => {
      const data = req.body;
      const result = await feedbackCollection.insertOne(data);
      res.send(result);
    });


    app.get("/getfeedbacks", async(req, res) => {
      const data = feedbackCollection.find();
      const result = await data.toArray();
      res.send(result);
    });

    app.get("/getfeedbackbyid/:id", async(req, res) => {
      const id = req.params.id;
      const objectId = {_id: new ObjectId(id)};
      const data = await feedbackCollection.findOne(objectId);
      res.send(data);
    });

    app.delete("/deletefeedbackbyid/:id", async(req, res) => {
      const id = req.params.id;
      const objectId = {_id: new ObjectId(id)};
      const data = await feedbackCollection.deleteOne(objectId);
      res.send(data);
    });

    app.patch("/editfeedback/:id", async(req, res) => {
      const id = req.params.id;
      const objectId = {_id: new ObjectId(id)};
      const data = req.body;
      const correctdata = {
        $set: {
          ...data
        }
      }
      const optional = {upsert: true};
      const result = feedbackCollection.updateOne(objectId, correctdata, optional);
      res.send(result);
    })

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);


app.listen(port, () => {
    console.log(`Connected to Port: ${port}`);
})