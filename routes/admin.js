var express = require('express');
var router = express.Router();
var { addProducts, productModel, deleteProduct, getProductDetails, updateProduct } = require('../helpers/product-helper')
var { dologin } = require('../helpers/admin_helper')
var { getAllOrder, getAllUser, updatestatus, getorderProduct }=require('../helpers/user_helper');
const { response } = require('express');
const verifyLogin = (req, res, next) => {
  if (req.session.adminLoggedin) {
    next()
  }
  else {
    res.redirect('/admin/admin-login')
  }
}

/* GET users listing. */
router.get('/', verifyLogin, function (req, res, next) {
  
  productModel.find((err, val) => {
    if (err) {
      console.log(err);
    }
    else {
     
      res.render('admin/view-products', { val, admin_details: req.session.admin, admin: true });

    }
  })
})

  
router.get('/add-product', function (req, res) {
  res.render("admin/add-product",{admin : true})
})



router.post('/add-product', async (req, res) => {
  addProducts(req.body, req.files.Image).then((response) => {
    res.redirect('/admin/add-product')
    

  })



})
router.get("/deleteproduct/:id", (req, res) => {
  let product_id = req.params.id
  console.log(product_id);
  deleteProduct(product_id).then((response)=>{
    res.redirect('/admin')
    
  })

})
router.get('/edit-product/:id', (req, res) => {
  getProductDetails(req.params.id).then((product) => {
    console.log(product);
    res.render("admin/edit-product", { product, admin: true })
     
  })
 
 
})
router.post('/edit-product/:id', (req, res,) => {
 
  
  updateProduct(req.params.id,req.body,req.files.Image).then((response) => {
    res.redirect('/admin')
    
  })
 
})


router.get('/admin-login', (req, res, ) => {
 
  if (req.session.adminLoggedin) {
    
    res.redirect('/admin')
  } else {
    
    res.render('admin/login', { "loginErr": req.session.adminLoginErr, admin:true})
    
  }

})
router.post("/login", (req, res) => {
  dologin(req.body).then((response) => {
    if (response.status) {
      req.session.adminLoggedin = true
      req.session.admin = response.admin
      res.redirect('/admin')
    }
    else {
      req.session.adminLoginErr = 'invalid email or password'
      res.redirect('/admin/admin-login')
    }
  })
})
router.get('/logout', (req, res) => {
  req.session.admin = null
  req.session.adminLoggedin = false
  res.redirect('/')
})

router.get('/all-order',verifyLogin, (req, res) => {
  getAllOrder().then((response) => {
    res.render('admin/orders', { order: response, admin_details: req.session.admin, admin: true })
  })
})
router.get('/order-product/:id', (req, res) => {
  getorderProduct(req.params.id).then((order) => {
    res.render('admin/ordered-product', { order: order, admin_details: req.session.admin, admin: true })
  })
})
router.get('/update-order/:id', (req, res) => {
  updatestatus(req.params.id).then(() => {
    console.log( 'hereeee');
    res.redirect('/admin/all-order')
  })
})
router.get('/all-user', (req, res) => {
  getAllUser().then((response) => {
    res.render('admin/user', { user: response, admin_details: req.session.admin, admin: true })
  })
})
module.exports = router;
