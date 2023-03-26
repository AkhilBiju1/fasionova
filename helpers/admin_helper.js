const { mongoose } = require('mongoose');

const { ADMIN_COLLECTION} = require("./collection_helper")
const bcrypt = require('bcrypt')
const promise = require('promise');

const user = {
    name: String,
    email: String,
    pass: String,
    admin: Boolean
}
const adminModel = mongoose.model(ADMIN_COLLECTION, user)

module.exports = {

    dologin: (userData) => {


        return new Promise((resolve, reject) => {

            let loginStatus = false
            let response = {}
            adminModel.findOne({ email: userData.email }, (err, data) => {
                if (err) {

                    console.log(err);
                }
                else {
                    if (data) {
                        bcrypt.compare(userData.pass, data.pass,).then((status) => {
                            if (status) {
                                console.log('success');
                                response.admin = data
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
}