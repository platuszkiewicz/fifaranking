// TODO: 
// - fixedHeader
// - clear searchBox
// - prepare last id to initTable(id)

var List = (function () {
    // global variables - just reference as 'globalVariable_1' etc. 
    var dataTable = null;

    var rankingDate = null;

    var lastRankingId = -1;

    // global functions - just reference as 'func1()' etc.
    function initList() {

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

    function initTable(id) {
        console.log("initTable for id=" + id);
        dataTable = $('#ranking-list').DataTable({
            search: true,
            info: false,
            iDisplayLength: 25,
            fixedHeader: true,
            lengthMenu: [[10, 25, 50, 100, -1], [10, 25, 50, 100, "All"]],
            ajax: {
                "url": "data/rankings/" + id + ".json",
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

        // by default: table fill with newest ranking. Uncomment below to start with ranking with specific Id

        //$.getJSON('./data/rankings/' + 198 + '.json', function (dataString) {
        //    rankingDate = moment(dataString.Date).format("D MMMM YYYY");
        //    $('#list-name').text('Date of publication: ' + rankingDate);
        //});
    }

    function reloadTable(id) {
        dataTable.ajax.url("data/rankings/" + id + ".json").load(function (jsonResponse) {
            rankingDate = moment(jsonResponse.Date).format("D MMMM YYYY");
            $('#list-name').text('Date of publication: ' + rankingDate);
            console.log("reload table for id=" + id);
        }, null);
    }

    // load other singletons. Other singleton contain some logic which can be packed, i.e. modal	
    function List() {
        //this.otherSingleton = new OtherSingleton();
    }

    List.prototype.init = function (params) {
        var that = this;
        // ******** ALL ACTION ON SITE GOES HERE *********
        fillSelects_list(function () {
            initTable(269); // imidately after init is reload, so...
        });
    }


    ///////////////////////////////////////////////////
    // Singleton implementation ///////////////////////
    ///////////////////////////////////////////////////
    var _instance;
    var _static = {
        name: "List",
        getInstance: function () {
            if (_instance === undefined) {
                _instance = new List();
            }
            return _instance;
        }
    }

    return _static;
}());



