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
        adjustSVG();
        Chart.getInstance().init(); // On Load
    });

    // ----- links to partials
    $('#chart-btn').on('click', function () {
        $("#main-content").load("./partials/chart.html", null, function () {
            adjustSVG();
            Chart.getInstance().init(); // On Load
        });
    });
    $('#list-btn').on('click', function () {
        $("#main-content").load("./partials/list.html", null, function () {
            setTimeout(function () {
                removeAds();
            }, 400);
            List.getInstance().init(); // On Load
        });
    });
    $('#calculation-btn').on('click', function () {
        $("#main-content").load("./partials/calculation.html", null, function () {
            setTimeout(function () {
                removeAds();
            }, 400);
            CalculationMethod.getInstance().init(); // On Load
        });
    });
    $('#schedule-btn').on('click', function () {
        $("#main-content").load("./partials/schedule.html", null, function () {
            setTimeout(function () {
                removeAds();
            }, 400);
        });
    });
}


function adjustSVG(partial) {
    var mainContentWrapperFACTORS = { smallHEIGHT: 0.5, smallWIDTH: 1, normalHEIGHT: 0.82, normalWIDTH: 1, hugeHEIGHT: 1.10, hugeWIDTH: 1 };

    //console.log(mainContentWrapperFACTORS);
    //console.log("window", window.innerHeight, window.innerWidth);
    //console.log("main-content-wrapper", $("#main-content").parent().height(), $("#main-content").parent().width());

    // main-content-wrapper dimensions
    if (window.innerHeight < 550) { // mobile
        $("svg").attr("height", $("#main-content").parent().height() * mainContentWrapperFACTORS.smallHEIGHT);
        $("svg").attr("width", $("#main-content").parent().width() * mainContentWrapperFACTORS.smallWIDTH);
    } else if (window.innerHeight > 780) { // BIG desktop
        $("svg").attr("height", $("#main-content").parent().height() * mainContentWrapperFACTORS.hugeHEIGHT);
        $("svg").attr("width", $("#main-content").parent().width() * mainContentWrapperFACTORS.hugeWIDTH);
    } else { // NORMAL desktop
        $("svg").attr("height", $("#main-content").parent().height() * mainContentWrapperFACTORS.normalHEIGHT);
        $("svg").attr("width", $("#main-content").parent().width() * mainContentWrapperFACTORS.normalWIDTH);
    }
    console.log("svg", $("svg").attr("height"), $("svg").attr("width"));
}

function removeAds() {
    while ($("body").children().length != 2) {
        $("body").children()[$("body").children().length - 1].remove();
    }
    $.each($('center'), function (name, val) {
        $(val).remove();
    });
}