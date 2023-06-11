const express = require('express')
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express()
const cors = require('cors');
require('dotenv').config()
const port = process.env.PORT||5000

// middleware
app.use(cors())
app.use(express.json())




const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.ahuevic.mongodb.net/?retryWrites=true&w=majority`;

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
    // Send a ping to confirm a successful connection
      const popularClassCollection = client.db("summerCamp").collection('popularClasses');
      const popularInstructorCollection = client.db("summerCamp").collection('popularInstructors');
      const yogaClassCollection = client.db("summerCamp").collection('yoga-classes');
      const userCollection = client.db("summerCamp").collection('users');
      const cartCollection = client.db("summerCamp").collection('carts');
    
    app.get('/popular-classes',async(req,res)=>{
      const result = await popularClassCollection.find().toArray();
      res.send(result);
    })
    app.get('/popular-instructors',async(req,res)=>{
      const result = await popularInstructorCollection.find().toArray();
      res.send(result);
    })
    app.get('/yoga-classes',async(req,res)=>{
      const result = await yogaClassCollection.find().toArray();
      res.send(result);
    })

   // user create api
      app.post('/users',async(req,res)=>{
      const user = req.body;
      const query = {email: user.email}
      const existingUser = await userCollection.find(query);
      if(existingUser){
        return res.send({message:"user already exist"})
      }
      const result = await userCollection.insertOne(user);
      res.send(result);
    })
    //cart related api
     app.get('/carts', async(req,res)=>{
      const result = await cartCollection.find().toArray();
      res.send(result);
    })
    app.post('/carts', async(req,res)=>{
      const item = req.body;
      const result = await cartCollection.insertOne(item);
      res.send(result);
    })

    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
   // await client.close();
  }
}
run().catch(console.dir);




app.get('/', (req, res) => {
  res.send('Summer Camp App Server is Running')
})

app.listen(port, () => {
  console.log(`Summer Camp app server on port ${port}`)
})