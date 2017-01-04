$(document).ready(function () {
     initNavigationBar();
});

function initNavigationBar() {
    // toggle "active" class
    $('li').on('click', function () {
        $('#navigation-bar ul li').removeClass("active");
        $(this).addClass("active");
    });

    // initial partial
    $("#main-content").load("./partials/chart.html", null, function () {
        adjustMainContentWrapper();
        Chart.getInstance().init(); // On Load 
    });

    // ----- links to partials
    $('#chart-btn').on('click', function () {
        $("#main-content").load("./partials/chart.html", null, function () {
            adjustMainContentWrapper();
            Chart.getInstance().init(); // On Load 
        });
    });
    $('#list-btn').on('click', function () {
        $("#main-content").load("./partials/list.html", null, function () {
            List.getInstance().init(); // On Load 
        });
    });
    $('#calculation-btn').on('click', function () {
        $("#main-content").load("./partials/calculation.html", null, function () {

        });
    });
    $('#schedule-btn').on('click', function () {
        $("#main-content").load("./partials/schedule.html", null, function () {

        });
    });
}

function adjustMainContentWrapper(callback) {
    // initial
    setDimensions();

    // window resize
    window.addEventListener('resize', function (event) {
        // nie zadziała bo svg juz wczesniej jest narysowane
    });

    // mobile rotate
    $(window).bind('orientationchange', function (event) {
        // nie zadziała bo svg juz wczesniej jest narysowane
    });

    function setDimensions() {
        // main-content-wrapper dimensions
        //if (window.innerWidth < 1000) { //small screen
        //    $("#main-content").parent().css('width', '100%');
        //} else { // big screen
        //    $("#main-content").parent().css('width', String(-0.025 * window.innerWidth + 120) + '%');
        //}

        // svg dimensions
        if (window.innerHeight < 550) { // mobile
            $("svg").attr("height", $("#main-content").parent().height() * 0.75);
            $("svg").attr("width", $("#main-content").parent().width() * 1);
        } else { // desktop
            $("svg").attr("height", $("#main-content").parent().height() * 0.85);
            $("svg").attr("width", $("#main-content").parent().width() * 1);
        }
    }
}

function removeAds() {
    while ($("body").children().length != 2) {
        $("body").children()[$("body").children().length - 1].remove();
    }
    $.each($('center'), function (name, val) {
        $(val).remove();
    });
}