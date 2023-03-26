const mongoose = require('mongoose');
mongoose.set('strictQuery', true);
local = "mongodb://127.0.0.1:27017/"
const atls ='mongodb+srv://mern-fasionova-user:myfirstproject.com@cluster0.mdrwgoj.mongodb.net/mern-fasionova-db?retryWrites=true&w=majority'
module.exports= {
    connect : ()=> {
        const url = atls
        database = "shopping"
        
        mongoose.connect(url + database, { useNewUrlParser: true, useUnifiedTopology: true }, (err) => {
            
            if (!err) {
                console.log("connected")
            } else {
                console.log(err);
            }
        })
    }
}

