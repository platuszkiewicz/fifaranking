// TODO:
// - fixedHeader
// - clear searchBox
// - prepare last id to initTable(id)

var List = (function () {
    // global variables - just reference as 'globalVariable_1' etc.
    var dataTable = null;

    var rankingDate = null;

    var lastRankingId = -1;

    var LIST_PARAMS = {
        id: null,
        lastId: null,
        isLastId: null
    };

    // global functions - just reference as 'func1()' etc.
    function initList() {
    }

    function fillSelects_list(callbackOnlyOnInit, rankingId) {
        // fill years
        $.getJSON('./data/rankings/_rankingsList.json', function (dataString) {
            // get year-data
            var years = [];
            var rankingIdYear = -1;
            for (var i = 0; i < dataString.length; i++) {
                var year = moment(dataString[i].Date).year();
                if ($.inArray(year, years) == -1) {
                    years.push(year);
                }
                if (dataString[i].Id == rankingId) {
                    rankingIdYear = moment(dataString[i].Date).year();
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
            if (rankingId) {
                $("#sel-year").val(rankingIdYear);
            } else {
                $("#sel-year option:last").attr("selected", "selected");
            }

            // on year change
            $('#sel-year').on('change', function () {
                $('#sel-month').find('option')
                            .remove()
                            .end()
                ;
                fillMonths(true, null);// on year change fill months and select first month
            });

            fillMonths(false, rankingId); // on initialization fill months and select last ranking Id

            $('#sel-month').on("change", function () {
                reloadTable($(this).val());
            });

            callbackOnlyOnInit();
        });
    }

    function fillMonths(selectFirst, rankingId) { // @selectFirst: if true - select first; if false - select last
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
            if (!rankingId) {
                selectFirst == true ? $("#sel-month")[0].selectedIndex = 0 : $("#sel-month option:last").attr("selected", "selected");
                LIST_PARAMS.id = $('#sel-month').val();
                disableToggleOnLast();
            } else {
                $("#sel-month").val(rankingId);
                LIST_PARAMS.id = $('#sel-month').val();
                disableToggleOnLast();
            }
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
                { "data": "Name", render(data) { return '<img src="data/flags/' + data + '.png" class="flag">' + data; } },
                { "data": "TotalPoints", "orderable": false },
                { "data": "PreviousPoints", "orderable": false },
                {
                    "data": "MovePosition", render(data) {
                        var html;
                        if (data > 0) {
                            html = '<img src="ico/128_green_up.png" class="arrow">' + '+' + data;
                        } else if (data < 0) {
                            html = '<img src="ico/128_red_down.png" class="arrow">' + data;//+ '–' + data * (-1);
                        } else {
                            html = data;
                        }
                        return html;
                    },
                }
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
            console.log("Reload table for id=" + id);
        }, null);
    }

    function setupListNavigation() {
        disableToggleOnLast();
        $('#btn-list-previous').click(function () {
            LIST_PARAMS.id = Number(LIST_PARAMS.id) -1;
            LIST_PARAMS.isLastId = false;
            reloadTable(LIST_PARAMS.id);

            if ($("#sel-month option:first")[0].selected == true) {
                $('#sel-year option:selected').prev().attr('selected','selected');
                fillMonths(false, LIST_PARAMS.id); // @selectFirst: if true - select first; if false - select last
            } else {
                $("#sel-month").val(Number($("#sel-month").val())-1);
            }

            disableToggleOnLast();
        });

        $('#btn-list-next').click(function () {
            if (!LIST_PARAMS.isLastId) {
                LIST_PARAMS.id = Number(LIST_PARAMS.id) + 1;
                LIST_PARAMS.isLastId = LIST_PARAMS.lastId == LIST_PARAMS.id ? true : false;
                reloadTable(LIST_PARAMS.id);

                //if ($("#sel-month option:last")[0].selected == true) {
                //    $("#sel-year option:last").attr("selected", 'selected');
                //    fillMonths(false, LIST_PARAMS.id); // @selectFirst: if true - select first; if false - select last     
                //} else {
                //    $("#sel-month").val(Number($("#sel-month").val()) + 1);
                //}

                disableToggleOnLast();
            }
        });

        $('#btn-list-last').click(function () {
            if (!LIST_PARAMS.isLastId) {
                reloadTable(LIST_PARAMS.lastId);

                // przełaczenie select

                disableToggleOnLast();
            }
        });
    }

    function disableToggleOnLast() {
        LIST_PARAMS.isLastId = LIST_PARAMS.lastId == LIST_PARAMS.id ? true : false;
        if (LIST_PARAMS.isLastId) {
            $('#btn-list-next').attr("disabled", true);
            $('#btn-list-last').attr("disabled", true);
        } else {
            $('#btn-list-next').attr("disabled", false);
            $('#btn-list-last').attr("disabled", false);
        }
    }

    // load other singletons. Other singleton contain some logic which can be packed, i.e. modal
    function List() {
        //this.otherSingleton = new OtherSingleton();
    }

    List.prototype.init = function (id) {
        var that = this;

        // ******** Check navigation panel **************
        if (!$($('#navigation-bar ul li')[1]).hasClass('active')) {
            $('#navigation-bar ul li').removeClass("active");
            $($('#navigation-bar ul li')[1]).addClass('active');
        }

        $.getJSON('./data/rankings/_rankingsList.json', function (data) {
            LIST_PARAMS.lastId = data[data.length - 1].Id;
            LIST_PARAMS.id = id ? id : LIST_PARAMS.lastId;
            LIST_PARAMS.isLastId = (LIST_PARAMS.id == LIST_PARAMS.lastId) ? true : false;

            // ******** ALL ACTION ON SITE GOES HERE *********
            fillSelects_list(function () {
                initTable(LIST_PARAMS.id); // imidately after init is reload, so...
                setupListNavigation(LIST_PARAMS);
            }, LIST_PARAMS.lastId);

            //if (!id) { // open from navigation menu
            //    $.getJSON('./data/rankings/_rankingsList.json', function (data) {
            //        var latestId = data[data.length - 1].Id;
            //        fillSelects_list(function () {
            //            initTable(latestId); // imidately after init is reload, so...
            //            setupListNavigation(latestId, true);
            //        }, latestId);
            //    });
            //} else { // open from "schedule"
            //    fillSelects_list(function () {
            //        initTable(id); // imidately after init is reload, so...
            //        setupListNavigation(id, isLastId(id));
            //    }, id);
            //}
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