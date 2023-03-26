var express = require('express');
var router = express.Router();
var { productModel } = require('../helpers/product-helper')
var { addToCart, updateOrder, getdeals, getorderProduct, changePaymentStatus, placeOrder, generateRazorpay, verifyPayment, getOrder, getCarTotal, getCartProductList, getCartProduct, countCartQuantity, deleteCart, getCartCount, signupUser, dologin } = require('../helpers/user_helper')

const verifyLogin = (req, res, next) => {
  if (req.session.userLoggedin) {
    next()
  }
  else {
    res.redirect('/login')
  }
}
const ajaxVerifyLogin = (req, res, next) => {
   if (req.session.userLoggedin) {
    next()
   } else {
     res.json({user: false})
   }

}
/* GET home page. */
router.get('/', async function (req, res, next) {
  let user = req.session.user
  loggedin = req.session.userLoggedin
  console.log(user);


  if (user) {
    var cartCount = await getCartCount(user._id)
  }

      res.render('user/index', {user, cartCount });
  
});
router.get('/products', async (req, res) => {
  let user = req.session.user
  loggedin = req.session.userLoggedin
  if (user) {
    var cartCount = await getCartCount(user._id)
  }
  productModel.find(async (err, products) => {
    if (!err) {
      res.render('user/view-product', { products,searchbar :true, user, cartCount });
    }
  })

})
router.get('/login', (req, res, next) => {
  if (req.session.userLoggedin) {
    res.redirect('/')
  } else {
    res.render('user/login', { "loginErr": req.session.userLoginErr })
    req.session.userLoginErr = false
  }

})


router.get('/signup', (req, res) => {
  res.render("user/signup")
})



router.post('/signup', (req, res) => {

  signupUser(req.body).then((response) => {
    if (response) {
      req.session.userLoggedin = true
      req.session.user = response.user
      res.redirect('/')
    } else {
      res.render('user/signup',  { userExist: true })
    }
   
  })
})


router.post('/login', (req, res) => {
  dologin(req.body).then((response) => {
    if (response.status) {
      req.session.userLoggedin = true
      req.session.user = response.user
      res.redirect('/')
    }
    else {
      req.session.userLoginErr = 'invalid email or password'
      res.redirect('/login')
    }
  })
})
router.get('/logout', (req, res) => {
  req.session.user = null
  req.session.userLoggedin=false
  res.redirect('/')
})
router.get('/cart',verifyLogin, async (req, res) => {
  let user = req.session.user
  if (user) {
    var cartCount = await getCartCount(user._id)
  }

 getCartProduct(req.session.user._id).then((response) => {
  
    products = response.products;
    total = response.total

    res.render('user/cart', { products, user: req.session.user, cartCount, total })
  })



})


router.get('/add-to-cart/:id', ajaxVerifyLogin, (req, res) => {

  addToCart(req.params.id, req.session.user._id).then((response) => {
    res.json({ count: response })
  })
})
router.post('/change-product-quantity', async (req, res) => {

  count = await countCartQuantity(req.body.product, req.body.count, req.session.user._id)
  let response = []
  response = await getCartProduct(req.session.user._id)

  res.json({ count: count, total: response.total })
})


router.get('/delete-product/:id', async (req, res) => {

  products = await deleteCart(req.session.user._id, req.params.id)
  let response = []
  response = await getCartProduct(req.session.user._id)
  res.json({ products: products, total: response.total })
})


router.get('/cart-count', async (req, res) => {
  let user = req.session.user

  if (user) {
    await getCartCount(user._id).then((response) => {
      res.json({ count: response })
    })
  }

})
router.get('/place-order', verifyLogin, async(req, res) => {
  
 cart = await getCartProduct(req.session.user._id)
  count = await getCartCount(req.session.user._id)
  res.render('user/place-order', { user: req.session.user ,cart,count})
})
router.post("/place-order",async (req, res) => {
  
  if (req.body.firstname === '' || req.body.secondname === '' || req.body.address === '' || req.body.pincode === '' || req.body.mobile === '') {
   res.json({empty:true})
  }

  else {
    products = await getCartProductList(req.session.user._id)
    let totalPrice = await getCarTotal(req.session.user._id)
    placeOrder(req.body, products, totalPrice).then((orderId) => {
      if (req.body.paymentMethod === 'COD') {
     
        res.json({ codSuccess: true, empty: false })
      } else {
        
        generateRazorpay(orderId, totalPrice).then((order) => {

          res.json({ order:order, empty: false })
        })
      }
     
    })
  }
})
router.get('/order', verifyLogin, async (req, res) => {
  order = await getOrder(req.session.user._id)
  
  let user = req.session.user
  if (user) {
    var cartCount = await getCartCount(user._id)
  }

  res.render('user/orders', { user: req.session.user, order,cartCount })
})
router.post('/verify-payment',(req, res) => {
  console.log(req.body);
  verifyPayment(req.body).then((response) => {
    changePaymentStatus(req.body['order[receipt]']).then(() => {
      console.log('payment successfull');
      res.json({status: true})
    })
  }).catch((err) => {
    console.log(err);
    res.json({ status: false })
  })
})
router.get('/order-product/:id',verifyLogin, (req, res) => {
  console.log(req.params.id);
  getorderProduct(req.params.id).then((order) => {
    res.render('user/ordered-product', { user: req.session.user,order})
  })
})

router.get('/deals/:category/:price', async (req, res) => {

  products =await getdeals(req.params)
  res.render('user/view-product',{products})
})


router.post('/update-payment', (req, res) => {
 
  console.log(req.body);
  updateOrder(req.body).then((order) => {
    if (req.body.paymentMethod === 'COD') {
      res.json({ codSuccess: true })
    } else {
      generateRazorpay(order._id, order.total).then((order) => {
        
        res.json({ order: order, empty: false })
      })
     }
  })
 
  
})
router.get('/profile', verifyLogin, (req, res) => {
  res.render('user/user', {user:req.session.user})
})

module.exports = router;
