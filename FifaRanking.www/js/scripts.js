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
            List.getInstance().init(); // On Load
        });
    });
    $('#calculation-btn').on('click', function () {
        $("#main-content").load("./partials/calculation.html", null, function () {
            CalculationMethod.getInstance().init(); // On Load
        });
    });
    $('#schedule-btn').on('click', function () {
        $("#main-content").load("./partials/schedule.html", null, function () {
        });
    });
}

function adjustSVG(partial) {
    var mainContentWrapperFACTORS = { smallHEIGHT: 0.75, smallWIDTH: 1, bigHEIGHT: 0.83, bigWIDTH: 1 };

    //switch(partial) {
    //    case "chart":
    //        mainContentWrapperFACTORS.smallHEIGHT = 0.75;
    //        mainContentWrapperFACTORS.bigHEIGHT = 0.85;
    //        break;
    //    case "list":

    //        break;
    //    case "calculationMethod":
    //        mainContentWrapperFACTORS.smallWIDTH = 0.75;
    //        mainContentWrapperFACTORS.bigWIDTH = 0.6;
    //        break;
    //    case "schedule":

    //        break;
    //    default:
    //        console.log("adjustMainContentWrapper unknown parameter: "+ partial);
    //}

    // main-content-wrapper dimensions
    if (window.innerHeight < 550) { // mobile
        $("svg").attr("height", $("#main-content").parent().height() * mainContentWrapperFACTORS.smallHEIGHT);
        $("svg").attr("width", $("#main-content").parent().width() * mainContentWrapperFACTORS.smallWIDTH);
    } else { // desktop
        $("svg").attr("height", $("#main-content").parent().height() * mainContentWrapperFACTORS.bigHEIGHT);
        $("svg").attr("width", $("#main-content").parent().width() * mainContentWrapperFACTORS.bigWIDTH);
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