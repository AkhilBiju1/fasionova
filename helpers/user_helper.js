const { mongoose } = require('mongoose');
const { mv } = require('express-fileupload')
const { USER_COLLECTION, YOUR_KEY_ID, YOUR_KEY_SECRET, ORDER_COLLECTION, CART_COLLECTION, PRODUCT_COLLECTION } = require("./collection_helper")
const bcrypt = require('bcrypt')
const promise = require('promise');
const { response } = require('express');
const Razorpay = require('razorpay');
var { validatePaymentVerification } = require('razorpay/dist/utils/razorpay-utils');
var { productModel } = require('../helpers/product-helper')
//payment gate

var instance = new Razorpay({
    key_id: YOUR_KEY_ID,
    key_secret: YOUR_KEY_SECRET,
});


const order = {
    deliveryDetails: {
        firstname: String,
        lastname: String,
        mobile: Number,
        address: String,
        pincode: Number
    },
    user: { type: mongoose.Schema.Types.ObjectId, ref: USER_COLLECTION },
    paymentMethod: String,
    products: [
        {
            item: { type: mongoose.Schema.Types.ObjectId, ref: PRODUCT_COLLECTION },
            quantity: Number
        }
    ],
    total: Number,
    status: String,
    date: String,
    dateandtime: Date
}
const orderModel = mongoose.model(ORDER_COLLECTION, order)

const user = {
    name: String,
    email: String,
    pass: String,
    admin: Boolean
}
const userModel = mongoose.model(USER_COLLECTION, user)
ObjectId = { type: mongoose.Schema.Types.ObjectId }
const cartObj = {
    user: { type: mongoose.Schema.Types.ObjectId },
    products: [
        {
            item: { type: mongoose.Schema.Types.ObjectId, ref: PRODUCT_COLLECTION },
            quantity: Number
        }
    ]

}
const cartModel = mongoose.model(CART_COLLECTION, cartObj)

module.exports = {

    signupUser: (userData) => {
        return new Promise(async (resolve, reject) => {

            userModel.findOne({ email: userData.email },async (err, user) => {
                if (!err) {
                    if (user === null) {
                        userData.pass = await bcrypt.hash(userData.pass, 10)
                        const data = new userModel({
                            name: userData.name,
                            email: userData.email,
                            pass: userData.pass,
                            admin: false
                        })

                        let user_data = await data.save();
                        response.user =user_data
                        resolve(response)
                    } else {
                        resolve()
                    }

                }
            })
        })


    },



    dologin: (userData) => {


        return new Promise((resolve, reject) => {

            let loginStatus = false
            let response = {}
            userModel.findOne({ email: userData.email }, (err, data) => {
                if (err) {

                    console.log(err);
                }
                else {
                    if (data) {
                        bcrypt.compare(userData.pass, data.pass,).then((status) => {
                            if (status) {
                                console.log('success');
                                response.user = data
                                response.status = true
                                resolve(response)
                            }
                            else {
                                console.log('failed');

                                resolve({ status: false })
                            }
                        })
                    } else {
                        resolve({ status: false })
                        console.log('login failed');
                    }
                }
            })
        })
    },

    addToCart: (proId, userId) => {
        return new Promise(async (resolve, reject) => {
            cartModel.findOne({ user: userId }, (async (err, data) => {

                if (data) {
                    console.log(data);
                    let proexist = data.products.findIndex(product => product.item == proId)

                    if (proexist != -1) {
                        let count = data.products[proexist].quantity + 1
                        data.products[proexist].quantity = count
                        await data.save();
                        count = data.products.length
                        console.log(count);
                        resolve(count)

                    } else {
                        await cartModel.updateOne({ user: userId },
                            {
                                "$push": {
                                    products: [{
                                        item: proId,
                                        quantity: 1
                                    }]
                                }
                            },
                            { "new": true, "upsert": true },

                        );
                        cartModel.findOne({ user: userId }, (err, cart) => {
                            count = cart.products.length
                            console.log(count);
                            resolve(count)
                        })


                    }


                }
                else {
                    const data = new cartModel({
                        user: userId,
                        products: [{
                            item: proId,
                            quantity: 1
                        }]

                    })

                    await data.save();
                    let count = data.products.length
                    resolve(count)
                }

            }))
        })
    },
    getCartProduct: (userId) => {
        return new Promise(async (resolve, reject) => {
            cartModel.findOne({ user: userId }).populate('products.item').exec(async (err, cart) => {
                let totalPrice = 0
                if (cart) {

                    cart.products.forEach(product => {
                        totalPrice = totalPrice + (product.item.price * product.quantity)

                    });
                    response.products = cart.products
                    response.total = totalPrice
                    resolve(response)
                } else {

                    let data = new cartModel({
                        user: userId,
                        products: []

                    })
                    await data.save()
                    response.products = data.products
                    response.total = totalPrice
                    resolve(response)
                }
            })
        })

    },
    getCarTotal: (userId) => {
        return new Promise(async (resolve, reject) => {
            cartModel.findOne({ user: userId }).populate('products.item').exec(async (err, cart) => {
                let totalPrice = 0
                if (cart) {

                    await cart.products.forEach(product => {
                        totalPrice = totalPrice + (product.item.price * product.quantity)

                    });


                    resolve(totalPrice)
                }
            })
        })

    },
    getCartCount: (userId) => {
        return new Promise(async (resolve, reject) => {
            let count = 0
            let cart = await cartModel.findOne({ user: userId })
            if (cart) {
                count = cart.products.length

                resolve(count)
            } else {
                resolve(count = null)
            }
        })
    },
    countCartQuantity: (proId, count, userId,) => {
        return new Promise(async (resolve, reject) => {
            cartModel.findOne({ user: userId }, (async (err, data) => {

                if (data) {

                    let proexist = data.products.findIndex(product => product._id == proId)

                    if (proexist != -1) {

                        count = parseInt(count)
                        Quantity = data.products[proexist].quantity = data.products[proexist].quantity + count

                        await data.save();
                        resolve(Quantity)




                    }

                }

            }))
        })
    },
    deleteCart: (userId, proId) => {

        return new Promise((resolve, reject) => {
            cartModel.findOne({ user: userId }).then(async (cart) => {
                cart.products.pull({ _id: proId });
                await cart.save().then(() => {
                    resolve(cart.products)
                });
            });
        })
    },
    placeOrder: (order, products, totalPrice) => {
        return new Promise(async (resolve, reject) => {

            let status = order.paymentMethod === 'COD' ? 'Placed' : 'Pending'
            let Orderobj = new orderModel({
                deliveryDetails: {
                    firstname: order.firstname,
                    lastname: order.secondname,
                    mobile: order.mobile,
                    address: order.address,
                    pincode: order.pincode
                },
                user: order.userId,
                paymentMethod: order.paymentMethod,
                products: products,
                total: totalPrice,
                status: status,
                date: new Date().toLocaleDateString(),
                dateandtime: new Date()
            })
            await Orderobj.save()
            await cartModel.deleteOne({ user: order.userId });
            resolve(Orderobj._id)
        })
    },
    getCartProductList: (userId) => {
        return new Promise(async (resolve, reject) => {
            let cart = await cartModel.findOne({ user: userId })
            resolve(cart.products)
        })
    },
    getOrder: (userId) => {
        return new Promise((resolve, reject) => {
            orderModel.find({ user: userId }, (err, orders) => {


                resolve(orders)


            })
        })

    },
    generateRazorpay: (orderId, totalPrice) => {

        return new Promise(async (resolve, reject) => {
            var options = await {
                "amount": totalPrice * 100,
                "currency": "INR",
                "receipt": '' + orderId,
            }
            instance.orders.create(options, (err, order) => {
                console.log("new order " + JSON.stringify(order));
                resolve(order)
            })

        })
    },
    verifyPayment: (details) => {
        return new Promise((resolve, reject) => {
            validate = validatePaymentVerification({ "order_id": details['payment[razorpay_order_id]'], "payment_id": details['payment[razorpay_payment_id]'] }, details['payment[razorpay_signature]'], YOUR_KEY_SECRET)
            if (validate === true) {
                resolve()
            } else {
                reject()
            }

        })
    },
    changePaymentStatus: (orderId) => {
        return new Promise((resolve, reject) => {
            orderModel.findOne({ _id: orderId }).then(async (order) => {
                order.status = 'Placed'
                await order.save().then(() => {
                    resolve()
                });
            });
        })
    },
    getorderProduct: (orderId) => {
        return new Promise((resolve, reject) => {
            orderModel.findOne({ _id: orderId }).populate('products.item').exec(async (err, order) => {

                resolve(order)
            })


        })
    },
    getAllOrder: () => {
        return new Promise((resolve, reject) => {
            orderModel.find((err, orders) => {
                resolve(orders)
            })
        })
    },
    getdeals: (product) => {
        return new Promise((resolve, reject) => {

            price = parseInt(product.price);

            if (product.category === 'kids') {
                productModel.find({ gender: 'kid', disprice: { $lte: price } }, async (err, products) => {
                    if (!err) {
                        resolve(products)
                    }
                })
            } else {
                productModel.find({ disprice: { $lte: price }, category: product.category }, async (err, products) => {
                    if (!err) {
                        resolve(products)
                    }
                })
            }
        })
    },
    updateOrder: (orderup) => {
        return new Promise((resolve, reject) => {
            orderModel.findOne({ _id: orderup.orderid }).then(async (order) => {
                order.paymentMethod = orderup.paymentMethod;
                if (orderup.paymentMethod === 'COD') {
                    order.status = 'Placed'
                } else {
                    order.status - 'Pending'
                }
                await order.save();

                resolve(order);
            });
        })
    },
    updatestatus: (orderId) => {
        return new Promise((resolve, reject) => {
            orderModel.findOne({ _id: orderId }).then(async (order) => {
                if (order.status === 'Placed') {
                    order.status = 'Out for delivary'
                } else if (order.status === 'Out for delivary') {
                    order.status = 'Delivered'
                }
                await order.save();

                resolve();
            });
        })
    },
    getAllUser: () => {
        return new Promise((resolve, reject) => {
            userModel.find((err, user) => {

                if (!err) {
                    resolve(user)
                }
            })
        })
    }
}