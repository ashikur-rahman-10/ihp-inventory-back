const express = require("express");
const cors = require("cors");
require("dotenv").config();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(express.json());
app.use(
  cors({
    origin: ["http://localhost:5173", "https://ihp-inv.web.app"],
  })
);

// Default route
app.get("/", (req, res) => {
  res.send("Server is running...");
});

// MongoDB connection URI
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.a46jnic.mongodb.net/?retryWrites=true&w=majority`;

// MongoClient setup
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

// Main function
async function run() {
  try {
    await client.connect();

    const db = client.db("IHP_INV");
    const usersCollection = db.collection("users");
    const booksCollection = db.collection("books");
    const writersCollection = db.collection("writers");

    // POST: Add new user
    app.post("/users", async (req, res) => {
      try {
        const user = req.body;
        if (!user || !user.email) {
          return res.status(400).json({ message: "Invalid user data" });
        }

        const existingUser = await usersCollection.findOne({
          email: user.email,
        });
        if (existingUser) {
          return res.status(409).json({ message: "User already exists" });
        }

        const result = await usersCollection.insertOne(user);
        res.status(201).json(result);
      } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error while adding user" });
      }
    });

    // GET: All users
    app.get("/users", async (req, res) => {
      const result = await usersCollection.find().toArray();
      res.send(result);
    });

    // GET: User by email
    app.get("/users/:email", async (req, res) => {
      const email = req.params.email;
      const result = await usersCollection.findOne({ email });
      res.send(result);
    });

    // POST: Add a book
    app.post("/books", async (req, res) => {
      try {
        const book = req.body;
        if (!book || typeof book !== "object") {
          return res.status(400).json({ message: "Invalid book data" });
        }
        const result = await booksCollection.insertOne(book);
        res.status(201).json(result);
      } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error while adding book" });
      }
    });

    // GET: All books
    app.get("/books", async (req, res) => {
      const result = await booksCollection.find().toArray();
      res.send(result);
    });

    // Get a book by id
    app.get(`/books/:id`, async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await booksCollection.findOne(query);
      res.send(result);
    });

    // Delete a book by id
    app.delete(`/books/:id`, async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await booksCollection.deleteOne(query);
      res.send(result);
    });

    // Update a book
    app.patch("/books/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const updatedBook = req.body;
      // const options = { upsert: true };
      const updateDoc = {
        $set: {
          bookName: updatedBook.bookName,
          price: updatedBook.price,
          quantity: updatedBook.quantity,
          writerName: updatedBook.writerName,
          keywords: updatedBook.keywords,
          buyingPrice: updatedBook.buyingPrice,
        },
      };
      const result = await booksCollection.updateOne(filter, updateDoc);
      res.send(result);
    });

    // Re-stock books
    app.patch("/books/restock/:id",async (req, res) => {
        const id = req.params.id;
        const restock = req.body;
        const filter = { _id: new ObjectId(id) };

        const thisBook = await booksCollection.findOne(filter);
        const updateDoc = {
          $set: {
            quantity:
              parseInt(thisBook?.quantity) + parseInt(restock?.quantity),
          },
        };

        const result = await booksCollection.updateOne(filter, updateDoc);
        res.send(result);
      }
    );

    // POST: Add a writer
    app.post("/writers", async (req, res) => {
      try {
        const writer = req.body;
        if (!writer || typeof writer !== "object") {
          return res.status(400).json({ message: "Invalid writer data" });
        }
        const result = await writersCollection.insertOne(writer);
        res.status(201).json(result);
      } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error while adding writer" });
      }
    });

    // GET: All writers
    app.get("/writers", async (req, res) => {
      const result = await writersCollection.find().toArray();
      res.send(result);
    });

    // Ping MongoDB
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged MongoDB! Successfully connected.");
  } catch (err) {
    console.error("Failed to connect to MongoDB:", err);
  }
}

run().catch(console.dir);

// Start server
app.listen(port, () => {
  console.log(`Server is listening on port ${port}`);
});
