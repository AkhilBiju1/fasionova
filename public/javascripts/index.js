$(document).ready(function () {
    $('.owl-carousel').owlCarousel({
        "autoplaySpeed": 2000,
        
        "loop": true,
        "autoplay": true,
        responsiveClass: true,
       
        responsive: {
            0: {
                items: 1,
                loop: true,
                dots: false
               

            },
            600: {
                items: 1,
                dots: true,
                loop: true
            },
            1000: {
                items: 1,
               
                loop: true
            }
        }
    });
});

$(document).ready(function () {
    $('#table').DataTable();
    $("#myClick").on("click", function () {
        var value = $('#myinput').val().toLowerCase();
        $("#myTable #mytr").filter(function () {
            $(this).toggle($(this).text().toLowerCase().indexOf(value) > -1)
        });
    });

   
});
