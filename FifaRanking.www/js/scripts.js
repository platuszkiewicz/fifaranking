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
        //initChart();
        Chart.getInstance().init(); // On Load 
    });

    // ----- links to partials
    $('#chart-btn').on('click', function () {
        $("#main-content").load("./partials/chart.html", null, function () {
            //initChart();
            Chart.getInstance().init(); // On Load 
        });
    });
    $('#list-btn').on('click', function () {
        $("#main-content").load("./partials/list.html", null, function () {
            //initList();
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