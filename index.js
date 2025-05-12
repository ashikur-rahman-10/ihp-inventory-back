const express = require("express");
const cors = require("cors");
require("dotenv").config();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const app = express();
const port = process.env.PORT || 5000;

app.use(
  cors({
    origin: ["http://localhost:5173", "https://pixventory.web.app"],
  })
);

// app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("server is running.......");
});

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.a46jnic.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    client.connect();
    const usersCollections = client.db("IHP_INV").collection("users");
    const booksCollections = client.db("IHP_INV").collection("books");
    const writersCollections = client.db("IHP_INV").collection("writers");

    // Users Api
        app.post('/users', async (req, res) => {
            const user = req?.body;
            const query = { email: user?.email }
            const existingUser = await usersCollections.findOne(query)
            if (existingUser) {
                return res.send({ message: "user already exist" })
            }
            const result = await usersCollections.insertOne(user);
            res.send(result)
        })

        // Get All Users
        app.get('/users', async (req, res) => {
            const result = await usersCollections.find().toArray()
            res.send(result)
        })

        // Get user by email
        app.get('/users/:email', async (req, res) => {
            const email = req.params.email;
            const filter = { email: email };
            const result = await usersCollections.findOne(filter)
            res.send(result)
        })

        // Post a book
        app.post('/books', VerifyJwt, VerifyAdmin, async (req, res) => {
            const book = req.body;
            const result = await booksCollections.insertOne(book)
            res.send(result)
        })
        // Get all book
        app.get('/all-books', async (req, res) => {
            const result = await booksCollections.find().toArray()
            res.send(result)
        })

        // Get a book by id
        app.get(`/books/:id`, async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await booksCollections.findOne(query);
            res.send(result);
        });
        // Delete a book by id
        app.delete(`/books/:id`, VerifyJwt, VerifyAdmin, async (req, res) => {
            const id = req.params.id;
            // console.log(id);
            const query = { _id: new ObjectId(id) };
            const result = await booksCollections.deleteOne(query);
            res.send(result);
        });
        // Update a book
        app.patch('/books/:id', VerifyJwt, VerifyAdmin, async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) };
            const updatedBook = req.body;
            // const options = { upsert: true };
            const updateDoc = {
                $set: {
                    bookName: updatedBook.bookName,
                    price: updatedBook.price,
                    quantity: updatedBook.quantity,
                    discounts: updatedBook.discounts,
                    category: updatedBook.category,
                    writerName: updatedBook.writerName,
                    publications: updatedBook.publications,
                    descriptions: updatedBook.descriptions,
                    keywords: updatedBook.keywords,
                    bookName_en: updatedBook.bookName_en,
                    buyingPrice: updatedBook.buyingPrice,

                }
            }
            const result = await booksCollections.updateOne(filter, updateDoc)
            res.send(result)

        })

        // Re-stock books
        app.patch('/books/restock/:id', VerifyJwt, VerifyAdmin, async (req, res) => {
            const id = req.params.id;
            const restock = req.body;
            const filter = { _id: new ObjectId(id) };

            const thisBook = await booksCollections.findOne(filter);
            const updateDoc = {
                $set: {
                    quantity: parseInt(thisBook?.quantity) + parseInt(restock?.quantity)
                },
            };

            const result = await booksCollections.updateOne(filter, updateDoc)
            res.send(result)

        })

        

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    
  }
}
run().catch(console.dir);

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
