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
        initChart();
    });

    // ----- links to partials
    $('#chart-btn').on('click', function () {
        $("#main-content").load("./partials/chart.html", null, function () {
            initChart();
        });
    });
    $('#list-btn').on('click', function () {
        $("#main-content").load("./partials/list.html", null, function () {
            initList();
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

//#region LIST   
// TODO: 
// - fixedHeader
// - clear searchBox
// - prepare last id to initTable(id)

function initList() {
    fillSelects_list(function () {
        initTable(268);
    });  
}

function fillSelects_list(callbackOnlyOnInit) {
    // fill years
    $.getJSON('./data/rankings/_rankingsList.json', function (dataString) {
        // get year-data
        var years = [];
        for (var i = 0; i < dataString.length; i++) {
            var year = moment(dataString[i].Date).year();
            if ($.inArray(year, years) == -1) {
                years.push(year);
            }
        }
        // fill year-select
        $.each(years, function (index, value) {
            $('#sel-year')
                        .append($("<option></option>")
                        .attr("value", value)
                        .text(value));
        });
        // select year-select
        $("#sel-year option:last").attr("selected", "selected");

        // on year change
        $('#sel-year').on('change', function () {
            $('#sel-month').find('option')
                        .remove()
                        .end()
            ;
            fillMonths(true);// on year change fill months and select first month
        });

        fillMonths(false); // on initialization fill months and select lastmonth
        
        $('#sel-month').on("change", function () {
            reloadTable($(this).val());
        });

        callbackOnlyOnInit();
    });    
}

function fillMonths(selectFirst) { // if true - select first; if false - select last
    $.getJSON('./data/rankings/_rankingsList.json', function (dataString) {
        var months = [];
        // get months-data available for year
        for (var i = 0; i < dataString.length; i++) {
            var year = moment(dataString[i].Date).year();
            if (year == $('#sel-year').val()) {
                var ranking = {};
                ranking.month = moment.months()[moment(dataString[i].Date).month()];
                ranking.id = dataString[i].Id;
                if ($.inArray(ranking.month, months) == -1) {
                    months.push(ranking);
                }
            }
        }

        // fill select with months
        $.each(months, function (index, value) {
            $('#sel-month')
                        .append($("<option></option>")
                        .attr("month", value.month)
                        .attr("value", value.id)
                        .text(value.month));
        });

        // after initialization or year change select first/last month
        selectFirst == true ? $("#sel-month")[0].selectedIndex = 0 : $("#sel-month option:last").attr("selected", "selected");
        reloadTable($("#sel-month").val());  // and load data for this month
    });
}

var dataTable = null;

var rankingDate = null;

var lastRankingId = -1;

function initTable(id) {
    console.log("initTable for id="+id);
    dataTable = $('#ranking-list').DataTable({
        search: true,
        info: false,
        iDisplayLength: 25,
        fixedHeader: true,
        lengthMenu: [[10, 25, 50, 100, -1], [10, 25, 50, 100, "All"]],
        ajax: {
            "url": "data/rankings/"+id+".json",
            "dataSrc": "Teams"
        },
        columns: [
            { "data": "Rank" },
            { "data": "Name" },
            { "data": "TotalPoints", "orderable": false },
            { "data": "PreviousPoints", "orderable": false },
            { "data": "MovePosition" },
        ]
    });

    $.getJSON('./data/rankings/'+198+'.json', function (dataString) {
        rankingDate = moment(dataString.Date).format("D MMMM YYYY");
        $('#list-name').text('Date of publication: ' + rankingDate);
    });
}

function reloadTable(id) {
    dataTable.ajax.url("data/rankings/" + id + ".json").load(function (jsonResponse) {
        rankingDate = moment(jsonResponse.Date).format("D MMMM YYYY");
        $('#list-name').text('Date of publication: ' + rankingDate);
    }, null);
}

//#endregion

//#region CHART
function initChart() {
    $.getJSON('./data/teams/_teamsList.json', function (teamsArray) {
        // change 'Name' property to 'text' - select2 requirement
        for (var i = 0; i < teamsArray.length; i++) {
            teamsArray[i].text = teamsArray[i]['Name'];
            delete teamsArray[i].Name;
        }

        $('#sel-chart').select2({
            data: teamsArray,
            multiple: true,
        });
        // ---------------------------------------------------------- START init for Poland 
        $("#sel-chart").val(151).trigger("change"); // id for Poland

        var teamsSelected = ["Poland"]; // array of selected teams names

        var chartData = {};

        $.getJSON('./data/teams/' + 'Poland' + '.json', function (teamArray) {
            chartData['Poland'] = teamArray;
        });
        // ----------------------------------------------------------- END init for Poland
        $('#sel-chart').on("change", function (event) {
            var selectedValues = $('#sel-chart').val();
            teamsSelected = selectedValues.map(function (teamId) {
                return teamsArray[teamId].text
            });

            chartData = {};
            $.each(teamsSelected, function (idx, team) {
                $.getJSON('./data/teams/'+ team +'.json', function (teamArray) {
                    chartData[team] = teamArray;
                });
            });

            console.log(teamsSelected);
            console.log(chartData);
        });

        console.log(teamsSelected);
        console.log(chartData);

        var teams = [];
        var data = [];

        drawSVG(teams, data);

        //addTeam();
        //removeTeam();
    });
}

function drawSVG(teams, data) {
    var svg = d3.select("svg"),
    margin = { top: 20, right: 80, bottom: 30, left: 50 },
    width = svg.attr("width") - margin.left - margin.right,
    height = svg.attr("height") - margin.top - margin.bottom,
    g = svg.append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    var x = d3.scaleTime().range([0, width]),
        y = d3.scaleLinear().range([height, 0]),
        z = d3.scaleOrdinal(d3.schemeCategory10);

    var line = d3.line()
        .curve(d3.curveBasis)
        .x(function (d) { return x(d.date); })
        .y(function (d) { return y(d.rank); });

    polandArr = polandArr.map(function (data) {
        return { date: new Date(data.Date), rank: data.Rank}
    });

    englandArr = englandArr.map(function (data) {
        return { date: new Date(data.Date), rank: data.Rank }
    });

    teams.push({ 'id': 'Poland', 'values': polandArr });
    teams.push({ 'id': 'England', 'values': englandArr });


    $.each(polandArr, function (index, value) {
        data.push({ 'Poland': value.rank, 'England': englandArr[index].rank, 'date': new Date(value.date) });
    });

    x.domain(d3.extent(data, function (d) { return d.date; }));

    y.domain([
        d3.max(teams, function (c) { return d3.max(c.values, function (d) { return d.rank; }); }),
        d3.min(teams, function (c) { return d3.min(c.values, function (d) { return d.rank; }); })
    ]);

    z.domain(teams.map(function (c) { return c.id; }));

    g.append("g")
        .attr("class", "axis axis--x")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(x));

    g.append("g")
        .attr("class", "axis axis--y")
        .call(d3.axisLeft(y))
      .append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", 6)
        .attr("dy", "0.71em")
        .attr("fill", "#000")
        .text("Position");

    var team = g.selectAll(".team")
      .data(teams)
      .enter().append("g")
        .attr("class", "team");

    team.append("path")
        .attr("class", "line")
        .attr("d", function (d) { return line(d.values); })
        .style("stroke", function (d) { return z(d.id); });

    team.append("text")
        .datum(function (d) { return { id: d.id, value: d.values[d.values.length - 1] }; })
        .attr("transform", function (d) { return "translate(" + x(d.value.date) + "," + y(d.value.rank) + ")"; })
        .attr("x", 3)
        .attr("dy", "0.35em")
        .style("font", "10px sans-serif")
        .text(function (d) { return d.id; });

    console.log(teams);
    console.log(data);
}

//#endregion   

