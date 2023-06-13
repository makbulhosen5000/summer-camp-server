require('dotenv').config()
const express = require('express')
const app = express()
const jwt = require('jsonwebtoken');
const cors = require('cors');

const stripe = require("stripe")(process.env.PAYMENT_SECRET_KEY);
const port = process.env.PORT||5000
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
// middleware
app.use(cors())
app.use(express.json())


const verifyJWT = (req,res,next) =>{
    const authorization = req.headers.authorization;

    if(!authorization){
      return res.status(401).send({error:true, message:'unauthorized access'})
    }
    // bearer token
    const token = authorization.split(' ')[1];

    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET,(err,decoded)=>{
      if(err){
        return res.status(401).send({error:true, message:"unauthorized access"})
      }
      req.decoded = decoded;
      next();
    })
}



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

    //JWT 
    app.post('/jwt',(req,res)=>{
      const user = req.body;
      const token = jwt.sign(user,process.env.ACCESS_TOKEN_SECRET,{ expiresIn: '1h' })
      res.send({token})
    })
    
     //user related api
    app.get('/users',async(req,res)=>{
      const result = await userCollection.find().toArray();
      res.send(result);
    })

    //for delete user
      app.delete('/users/:id',async(req,res)=>{
      const id = req.params.id;
      const query = {_id : new ObjectId(id)}
      const result = await userCollection.deleteOne(query);
      res.send(result);
    })
    //checking user is admin or not
    //security layer: verifyJWT
    //email same
    //check admin
      app.get('/users/admin/:email',verifyJWT,async(req,res)=>{
      const email = req.params.email;
      const query = {email:email}
      if(req.decoded.email !== email){
        res.send({admin:false})
      }
      const user =  await userCollection.findOne(query);
      const result = {admin:user?.role === 'admin'}
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
      const query = {email: user.email}
      const existingUser = await userCollection.findOne(query);
      if(existingUser){
        return res.send({message:"user already exist"})
      }
      const result = await userCollection.insertOne(user);
      res.send(result);
    })
    
    
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


    //cart related api
     //cart collection api
    app.get('/carts',verifyJWT, async(req,res)=>{
      const email = req.query.email;
      if(!email){
        res.send([]);
      }
      const decodedEmail = req.decoded.email;
      if(email !== decodedEmail){
        return res.status(403).send({error: true, message:'forbidden access'})
      }
      const query = {email:email};
      const result = await cartCollection.find(query).toArray();
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
      const deleteResult = await cartCollection.deleteOne(query);
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