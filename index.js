const express = require('express')
const app = express()
const cors = require('cors');
const jwt = require('jsonwebtoken');
require('dotenv').config()
const stripe = require("stripe")(process.env.PAYMENT_SECRET_KEY);
const port = process.env.PORT||5000
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
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
      const paymentCollection = client.db("summerCamp").collection('payments');
    
      


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

     //user related api
    app.get('/users',async(req,res)=>{
      const result = await userCollection.find().toArray();
      res.send(result);
    })
    
    //user update for making Admin
      app.patch('/users/admin/:id',async(req,res)=>{
      const id = req.params.id;
      const filter = {_id: new ObjectId(id)};
         const updateDoc = {
      $set: {
        role:'admin'
      },
    };
    const result = await userCollection.updateOne(filter, updateDoc);
    res.send(result);
    })
    //user update for making Instructor
      app.patch('/users/instructor/:id',async(req,res)=>{
      const id = req.params.id;
      const filter = {_id: new ObjectId(id)};
         const updateDoc = {
      $set: {
        role:'instructor'
      },
    };
    const result = await userCollection.updateOne(filter, updateDoc);
    res.send(result);
    })

   // user create api
      app.post('/users',async(req,res)=>{
      const user = req.body;
      console.log(user)
      const query = {email: user.email}
      const existingUser = await userCollection.findOne(query);
      console.log(existingUser)
      if(existingUser){
        return res.send({message:"user already exist"})
      }
      const result = await userCollection.insertOne(user);
      console.log(result);
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

    //for delete cart one by one
    app.delete('/carts/:id',async(req,res)=>{
      const id = req.params.id;
      const query = {_id : new ObjectId(id)}
      const result = await cartCollection.deleteOne(query);
      res.send(result);
    })

    // payment method api
     //create-payment-intent
    app.post('/create-payment-intent',async(req,res)=>{
      const {price} = req.body;
      const amount = parseInt(price*100);
      const paymentIntent = await stripe.paymentIntents.create({
        amount : amount,
        currency: "usd",
        payment_method_types:['card']

      });
      res.send({clientSecret: paymentIntent.client_secret});
    })
    app.post('/payments', async(req,res)=>{
      const payment = req.body;
      const insertResult = await paymentCollection.insertOne(payment);
      const query = {_id: {$in:payment.cartItems.map(id => new ObjectId(id))}}
      const deleteResult = await cartCollection.deleteMany(query);
      res.send({insertResult,deleteResult});
    })

    //user payment history

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