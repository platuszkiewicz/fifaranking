//TODO:
// - style!

var Chart = (function () {
    var chartData = {};     // e.g. {
    //          'England': [
    //                        {'Date': '...', 'Move': '...', 'Rank': '...'},
    //                        {'Date': '...', 'Move': '...', 'Rank': '...'},
    //                          ...
    //                     ],
    //          'Poland': [...]
    //      }
    var teamsSelected = []; // e.g. ["Poland", "England"]

    var preparedData = {}; // contains 'teams' and 'data' ready for drawing SVG

    // init and load data for 'teamName'
    function initChart(teamName) {
        deleteSVG();

        var teamId;

        $.getJSON('./data/teams/_teamsList.json', function (teamsArray) {
            // change 'Name' property to 'text' - select2 requirement
            for (var i = 0; i < teamsArray.length; i++) {
                if (teamsArray[i]['Name'] == teamName) { // get team id
                    teamId = i;
                }
                teamsArray[i].text = teamsArray[i]['Name'];
                delete teamsArray[i].Name;
            }

            $('#sel-chart').select2({
                data: teamsArray,
                multiple: true,
            });

            $("select").on("select2:unselect", function (evt) { // disable showing dropdown after removing a team from select2 (https://github.com/select2/select2/issues/3209)
                if (!evt.params.originalEvent) {
                    return;
                }

                evt.params.originalEvent.stopPropagation();
            });
            // ---------------------------------------------------------- START init for 'teamName'
            $("#sel-chart").val(teamId).trigger("change"); // id for 'teamName'

            teamsSelected = [teamName]; // array of selected teams names
            chartData = {}; // delete line if want saving svg after page changing

            $.getJSON('./data/teams/' + teamName + '.json', function (teamArray) {
                chartData[teamName] = teamArray;
                var preparedDataInit = prepareData(chartData);
                drawSVG(preparedDataInit.teams, preparedDataInit.data);
            });
            // ----------------------------------------------------------- END init for 'teamName'

            $('#sel-chart').on("change", function (event) {
                var selectedValues = $('#sel-chart').val();

                if (selectedValues != null) {
                    teamsSelected = selectedValues.map(function (teamId) {
                        return teamsArray[teamId].text
                    });

                    chartData = {};
                    $.each(teamsSelected, function (idx, team) {
                        $.getJSON('./data/teams/' + team + '.json', function (teamArray) {
                            chartData[team] = teamArray;
                            if (Object.keys(chartData).length == teamsSelected.length) {
                                preparedData = prepareData(chartData);
                                drawSVG(preparedData.teams, preparedData.data);
                            }
                        });
                    });
                } else {
                    deleteSVG();
                }
            });

            $("#btn-clearChart").on('click', function (event) {
                $("#sel-chart").val('').change();
                $("#sel-chart").select2('open');
                deleteSVG();
            });
        });
    }

    // converts 'chartData' to 'preparedData'
    function prepareData(chartData) {
        var teams = [];
        var data = [];

        $.each(chartData, function (team, ranking) {
            // generate "teams"
            var teamsObject = {};
            teamsObject.id = team;
            teamsObject.values = ranking.map(function (rankingElement) {
                // update "data" (szuka po całym "data" obiektu o danym rankId. Jak nie ma - dodaje nowy obiekt. Jak jest - dopisuje do niego)
                if (data.length != 0) {
                    var dataLgh = data.length;
                    var addedDataObject = false;
                    for (var i = 0; i < dataLgh; i++) {
                        var dataObject = data[i];
                        if (dataObject.RankId == rankingElement.RankId) { // znalazłem już dany rankId
                            dataObject[team] = rankingElement.Rank;
                            data[i] = dataObject;
                            addedDataObject = true;
                            break; //break for loop
                        }
                    }
                    if (!addedDataObject) { // tworzę nowy rankId
                        var dataObject_new = {};
                        dataObject_new.RankId = rankingElement.RankId;
                        dataObject_new.date = new Date(rankingElement.Date);
                        dataObject_new[team] = rankingElement.Rank;
                        data.push(dataObject_new);
                    }
                } else { // pierwszy wpis do "data"
                    var dataObject_first = {};
                    dataObject_first.RankId = rankingElement.RankId;
                    dataObject_first.date = new Date(rankingElement.Date);
                    dataObject_first[team] = rankingElement.Rank;
                    data.push(dataObject_first);
                }
                return { date: new Date(rankingElement.Date), rank: rankingElement.Rank }
            });
            teams.push(teamsObject);
        });

        var preparedData = {};
        preparedData.teams = teams;
        preparedData.data = data;
        return preparedData;
    }

    // draws SVG basing on 'preparedData'
    function drawSVG(teams, data) {
        //$('#main-content').find('svg')[0].innerHTML = '';
        deleteSVG();

        for (var i = 0; i < data.length; i++) {
            var obj = data[i];
            delete obj.RankId;
            data[i] = obj;
        }

        var svg = d3.select("svg"),
        margin = { top: 20, right: 85, bottom: 30, left: 50 },
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

        x.domain(d3.extent(data, function (d) { return d.date; }));

        y.domain([
            d3.max(teams, function (c) { return d3.max(c.values, function (d) { return d.rank; }); }),
            d3.min(teams, function (c) { return d3.min(c.values, function (d) { return d.rank; }); })
        ]);

        z.domain(teams.map(function (c) { return c.id; }));

        g.append("g")
            .attr("class", "axis axis--x")
            .attr("transform", "translate(0," + height + ")")
            .call(d3.axisBottom(x))
            .style("font", "12px sans-serif")
          .append("text")
            .attr("transform", "translate(" + 0.99 * width + ",0)")
            .attr("y", -16)
            .attr("dy", "0.71em")
            .attr("fill", "#000")
            .style("font", "12px sans-serif")
            .text("Year");

        g.append("g")
            .attr("class", "axis axis--y")
            .call(d3.axisLeft(y))
            .style("font", "12px sans-serif")
          .append("text")
            .attr("y", -20)
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
            .style("font", "14px sans-serif")
            .style("fill", function (d) { return d.color = z(d.id); })
            .text(function (d) { return d.id; });
    }

    function deleteSVG() {
            $('#main-content').find('svg')[0].innerHTML = "";
            d3.selectAll("svg > *").remove();
    }

    // load other singletons. Other singleton contain some logic which can be packed, i.e. modal
    function Chart() {
        //this.otherSingleton = new OtherSingleton();
    }

    Chart.prototype.init = function (teamName) {
        var that = this;
        // ******** Check navigation panel **************
        if (!$($('#navigation-bar ul li')[0]).hasClass('active')) {
            $('#navigation-bar ul li').removeClass("active");
            $($('#navigation-bar ul li')[0]).addClass('active');
        }
        // ******** ALL ACTION ON SITE GOES HERE *********
        initChart(teamName);
    }


    ///////////////////////////////////////////////////
    // Singleton implementation ///////////////////////
    ///////////////////////////////////////////////////
    var _instance;
    var _static = {
        name: "Chart",
        getInstance: function () {
            if (_instance === undefined) {
                _instance = new Chart();
            }
            return _instance;
        }
    }

    return _static;
}());