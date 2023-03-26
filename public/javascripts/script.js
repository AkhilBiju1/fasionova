
function addToCart(proId) {

    $.ajax({
        url: '/add-to-cart/' + proId,
        method: 'get',
        success: (response) => {

            if (response.user===false) {

                location.href = '/login'

            } else {
                if (response.count == 1) {
                    $('#cart').html(`Cart   <sup><span class="badge mb-2 "
                            style = " font-size:10px; color: #1b4d86; background-color:#ffffff ;border-radius:40% 40% 40% 0;!important"
                            id = "cart-count" >`+response.count+`</span ></sup > `)
                }
                else {
                    $('#cart-count').html(response.count)
                }  

            }

        }
    })


}
function changeQuantity(proId, count) {


    $.ajax({
        url: '/change-product-quantity',
        data: {
            product: proId,
            count: count
        },
        method: 'post',
        success: (response) => {

            $('#' + proId).html(response.count)
            $("#totalprice").html('Total : Rs. ' + response.total)
            if (response.count === 1) {
                $('#decri' + proId).prop('disabled', true);

            }
            else {
                $('#decri' + proId).prop('disabled', false);
            }

        }
    })

}
function deleteProduct(proId, name, image) {
    Swal.fire({
        title: name,

        imageUrl: '/product-images/' + image + '.png',
        imageHeight: 100,

        showCloseButton: true,

        background: '#fff url(/images/trees.png)',
        confirmButtonColor: '#3085d6',

        confirmButtonText: 'remove'
    }).then(async (result) => {
        if (result.isConfirmed) {
            await $.ajax({
                url: '/delete-product/' + proId,
                method: 'get',
                success: (response) => {

                    if (response) {
                        $("#totalprice").html('Total : Rs. ' + response.total)
                        $('#div' + proId).remove();

                    }

                }
            })
            $.ajax({
                url: '/cart-count',
                method: 'get',
                success: (response) => {

                    if (response) {

                        $('#cart-count').html(response.count)
                        if (response.count == 0) {
                            $('#cart-count').remove()
                            $('#oldtable').hide()
                            $('#emptydiv').html(` <table style="height: calc(100vh - 56px); width: 100%;">
                    <tbody>
                        <tr>
                           
                            <td class="align-middle"><h4 style="text-align: center;color: #6e6e6e87;" >Cart is empty</h4></td>
                           
                        </tr>
                    </tbody>
                </table>`)
                        }
                    }

                }
            })

        }
    })
}

// Example starter JavaScript for disabling form submissions if there are invalid fields
(function () {
    'use strict'

    window.addEventListener('load', function () {
        // Fetch all the forms we want to apply custom Bootstrap validation styles to
        var forms = document.getElementsByClassName('needs-validation')


        // Loop over them and prevent submission
        Array.prototype.filter.call(forms, function (form) {
            form.addEventListener('submit', function (event) {
                if (form.checkValidity() === false) {
                    event.preventDefault()
                    event.stopPropagation()
                }
                form.classList.add('was-validated')
            }, false)
        })
    }, false)
}())

$('#chackout-form').submit((event) => {

    event.preventDefault()
    $('#msg').prop('hidden', true)
    $.ajax({
        url: '/place-order',
        method: 'post',
        data: $("#chackout-form").serialize(),
        success:async (response) => {
            if (response.empty === true) {
                
                $('#msg').prop('hidden',false)
            } else {
               
                if (response.codSuccess === true) {
                   
                 await  Swal.fire({
                       title: 'Order Placed',
                       icon: 'success',
                       confirmButtonColor: '#3085d6',

                       confirmButtonText: 'Ok'
                 })
                   location.href = '/order'

                } else {
                   
                    await RazorpayPayment(response.order)
                    
               }
            }
          
           
        }
    })
})
updateorder = (id) => {
    console.log(id);

    $('.option' + id).prop('hidden', false)
    $('.button' + id).prop('hidden', true)
}

$('#payment-conform').submit((e) => {
    e.preventDefault();

    $.ajax({

        url: '/update-payment',
        method: 'post',
        data: $("#payment-conform").serialize(),
        success: async (response) => {
            if (response.codSuccess === true) {
                location.reload();
            } else {
                console.log(response.order);
                await RazorpayPayment(response.order)
            }
        }
    })
})
RazorpayPayment = (order) => {
    console.log('RazorpayPayment');
    console.log(order);
    var options = {
        "key": "rzp_test_qXkO3fiK9SDNX8", // Enter the Key ID generated from the Dashboard
        "amount": order.amount, // Amount is in currency subunits. Default currency is INR. Hence, 50000 refers to 50000 paise
        "currency": "INR",
        "name": "Eshopping", //your business name
        "description": "Test Transaction",
        "image": "https://example.com/your_logo",
        "order_id": order.id, //This is a sample Order ID. Pass the `id` obtained in the response of Step 1
        "handler": function (response) {
          
           
            verifyPayment(response, order);
        },
        "prefill": {
            "name": "Gaurav Kumar", //your customer's name
            "email": "gaurav.kumar@example.com",
            "contact": "9000090000"
        },
        "notes": {
            "address": "Razorpay Corporate Office"
        },

        "theme": {
            "color": "#1b4d86"
        }
    };
    var rzp1 = new Razorpay(options);
    rzp1.on('payment.failed', function (response) {
        alert(response.error.code);
        alert(response.error.description);
        alert(response.error.source);
        alert(response.error.step);
        alert(response.error.reason);
        alert(response.error.metadata.order_id);
        alert(response.error.metadata.payment_id);
    });
    rzp1.open();
}


verifyPayment = (payment,order) => {
   console.log('verifypayment');
    $.ajax({
        url: '/verify-payment',
        method: 'post',
        data: {
            payment,
            order
        },
        success:async (response) => {
           if (response.status) {
              
               location.href = '/order'
           } else {
               alert('false')
           }



        }
        
    })
}
