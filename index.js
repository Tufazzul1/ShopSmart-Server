const express = require('express');
const app = express();
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());


const uri = `mongodb+srv://${process.env.DB_NAME}:${process.env.DB_PASS}@cluster0.6qre6yi.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

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

    const productCollections = client.db("Shop-Smart").collection("Products");


    app.get('/all-products', async (req, res) => {
      const size = parseInt(req.query.size) || 10;
      const page = parseInt(req.query.page) || 1;
      const filter = req.query.filter;
      const filter1 = req.query.filter1;
      const sort = req.query.sort;
      const search = req.query.search;
      const priceRange = req.query.price_range;

      // Build the query object
      let query = search ? { productName: { $regex: search, $options: 'i' } } : {};
      if (filter) query.category = filter;
      if (filter1) query.brandName = filter1;

      // Handle price range filter

      try {
        // Fetch surveys and total count
        const [products, totalCount] = await Promise.all([
          productCollections.find(query).sort(sortOptions).skip((page - 1) * size).limit(size).toArray(),
          productCollections.countDocuments(query)
        ]);

        res.send({ products, totalCount });
      } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).send({ error: 'Internal Server Error' });
      }
    });

    //  Sort 
    let sortOptions = {};
    if (sort) {
      switch (sort) {
        case 'asc':
          sortOptions.price = 1;
          break;
        case 'dsc':
          sortOptions.price = -1;
          break;
        case 'newest':
          sortOptions.creation_date = -1;
          break;
        default:
          break;
      }
    }

    // Get all surveys data count from db
    app.get('/products-count', async (req, res) => {
      const filter = req.query.filter;
      const filter1 = req.query.filter1;
      const search = req.query.search;
      const priceRange = req.query.price_range; // New parameter

      // Build the query object
      let query = search ? { product_name: { $regex: search, $options: 'i' } } : {};
      if (filter) query.category = filter;
      if (filter1) query.brand_name = filter1;

      // Handle price range filter
      if (priceRange) {
        const [minPrice, maxPrice] = priceRange.split('-').map(Number);
        query.price = { $gte: minPrice, $lte: maxPrice };
      }

      try {
        const count = await productCollections.countDocuments(query);
        res.send({ count });
      } catch (error) {
        console.error('Error fetching products count:', error);
        res.status(500).send({ error: 'Internal Server Error' });
      }
    });


    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {

  }
}
run().catch(console.dir);



app.get('/', (req, res) => {
  res.send('Welcome...');
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});