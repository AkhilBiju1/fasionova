const { mongoose } = require('mongoose');
const fs = require("fs")
const { mv } = require('express-fileupload')
const { PRODUCT_COLLECTION } = require("./collection_helper")
const promise = require('promise');
const { response } = require('express');
var product = {
    name: String,
    type: String,
    category: String,
    price: Number,
    description: String,
    disprice: Number,
    size: String,
    off: Number,
    gender: String
}
const productModel = mongoose.model(PRODUCT_COLLECTION, product)

module.exports = {
    productModel,
    addProducts: (body, Image) => {


        return new Promise(async (resolve, reject) => {
            const data = new productModel({
                name: body.Name,
                type: body.type,
                category: body.Category,
                price: body.Price,
                description: body.Description,
                disprice: body.disprice,
                size:body.size,
                off: body.off,
                gender: body.gender
            })
            val = await data.save();

            await Image.mv('./public/product-images/' + val._id + '.png', (err) => {
                if (!err) {
                    console.log("image uploaded");
                }
                else {
                    console.log(err);
                }
            })
            resolve(val)

        })


    },

    deleteProduct: (id) => {
        return new Promise(async (resolve, reject) => {

            fs.unlink('./public/product-images/' + id + '.png', (err) => {
                if (!err) {
                    console.log(err
                    );
                }
            })
            productModel.findOneAndDelete(({ _id: id }), (err, val) => {
                response.val = val
                resolve(val)
            })

        })


    },
    getProductDetails: (id) => {
        return new Promise((resolve, reject) => {
            productModel.findById(id, function (err, docs) {
                if (err) {
                    console.log(err);
                }
                else {
                    resolve(docs)
                }
            });
        })

    },
    updateProduct: (proId, proBody, proImg) => {
        return new Promise((resolve, reject) => {
            prc = parseInt(proBody.Price)
            console.log(prc);

            disprc = parseInt(proBody.disprice)
            console.log(disprc);
            let offf = (100 / prc) * (prc - disprc);
            let offer = parseInt(offf)
            console.log(offer);
            console.log(proId);
            productModel.findOne({ _id: proId }).then(async (product) => {
                  
                        console.log(product);
                            product.name = proBody.Name
                            product.type = proBody.type
                            product.category = proBody.Category
                            product.price = proBody.Price
                            product.description = proBody.Description
                            product.disprice = proBody.disprice
                            product.off = offer
                            product.size = proBody.size

                        await product.save();
                        proImg.mv('./public/product-images/' + proId + '.png',)
                        resolve()
                  
                 
                })

            

        })
    },
}
