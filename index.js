const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const admin = require("firebase-admin");
require("dotenv").config();

const app = express();
const port = process.env.PORT || 3000;

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(require("./espresso-emporium-5efb9-firebase-adminsdk-fbsvc-c1bfd6b5af.json")),
});

// Middleware
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Coffee server is getting hotter.");
});

// MongoDB connection
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.or0q8ig.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    await client.connect();
    const db = client.db("CoffeeDB");
    const coffeeCollection = db.collection("CoffeeCollection");
    const userCollection = db.collection("UserCollection");

    // Coffee routes
    app.get("/coffees", async (req, res) => {
      const result = await coffeeCollection.find().toArray();
      res.send(result);
    });

    app.get("/coffees/:id", async (req, res) => {
      const id = req.params.id;
      const result = await coffeeCollection.findOne({ _id: new ObjectId(id) });
      res.send(result);
    });

    app.post("/coffees", async (req, res) => {
      const newCoffee = req.body;
      const result = await coffeeCollection.insertOne(newCoffee);
      res.send(result);
    });

    app.put("/coffees/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const update = { $set: req.body };
      const result = await coffeeCollection.updateOne(filter, update, { upsert: true });
      res.send(result);
    });

    app.delete("/coffees/:id", async (req, res) => {
      const result = await coffeeCollection.deleteOne({ _id: new ObjectId(req.params.id) });
      res.send(result);
    });

    // User routes
    app.get("/users", async (req, res) => {
      const result = await userCollection.find().toArray();
      res.send(result);
    });

    app.get("/users/:id", async (req, res) => {
      const result = await userCollection.findOne({ _id: new ObjectId(req.params.id) });
      res.send(result);
    });

    app.post("/users", async (req, res) => {
      const userProfile = req.body;
      const result = await userCollection.insertOne(userProfile);
      console.log(userProfile)
      res.send(result);
    });

    app.delete("/users/:id", async (req, res) => {
      const result = await userCollection.deleteOne({ _id: new ObjectId(req.params.id) });
      res.send(result);
    });

    // Delete from Firebase
    app.delete("/api/users/:uid", async (req, res) => {
      const uid = req.params.uid;
      try {
        await admin.auth().deleteUser(uid);
        res.status(200).send({ message: "User deleted from Firebase." });
      } catch (error) {
        res.status(500).send({ error: error.message });
      }
    });

    await client.db("admin").command({ ping: 1 });
    console.log("MongoDB connected.");
  } finally {
    // Optional: keep MongoDB open for continuous use
  }
}

run().catch(console.dir);

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
