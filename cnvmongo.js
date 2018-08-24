var db = require('diskdb');
db = db.connect('./db',['ipman','setting','proj','vm']);

const { MongoClient } = require('mongodb');
const uri = 'mongodb://localhost:27017';
const client = await MongoClient.connect(uri, { useNewUrlParser: true, replicaSet: 'rs' });

const db = client.db();

function update_projects()
{
   projs = db.proj.find();
   for (idx = 0;idx < projs.length;idx++){
       console.log(projs[idx].name);
       ex = await db.collection('proj').findOne(id: projs[idx]._id);
       if (ex == nil){
          db.collection('proj').insert(
       }
   return;
}

