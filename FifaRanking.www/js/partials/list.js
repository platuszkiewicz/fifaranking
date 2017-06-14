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
                fillMonths(true, null, true);// on year change fill months and select first month
                $(this).blur();
            });

            fillMonths(false, rankingId, false); // on initialization fill months and select last ranking Id

            $('#sel-month').on("change", function () {
                LIST_PARAMS.id = $(this).val();
                LIST_PARAMS.isLastId = LIST_PARAMS.lastId == LIST_PARAMS.id ? true : false;
                reloadTable($(this).val());
                $(this).blur();
            });

            callbackOnlyOnInit();
        });
    }

    function fillMonths(selectFirst, rankingId, withReloadTable ) {   // @selectFirst: if true - select first; if false - select last
                                                                      // @rankingId - initial selection for month
                                                                      // @withReloadTable - function also reloads table
                                                                      // NOTE: function requires previously set year !
        // delete all months in select
        $('#sel-month').find('option') 
            .remove()
            .end()
        ;
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
            
            if (!rankingId) { // after initialization or year change select first/last month
                selectFirst == true ? $("#sel-month option:first").attr("selected", "selected"): $("#sel-month option:last").attr("selected", "selected");
                LIST_PARAMS.id = $('#sel-month').val();
                disableToggleOnLast();
            } else { // set specific month 
                $("#sel-month").val(rankingId);
                LIST_PARAMS.id = $('#sel-month').val();
                disableToggleOnLast();
            }
            if (withReloadTable) {
                reloadTable($("#sel-month").val());  // and load data for this month
            }
        });
    }

    function initTable(id, rankingDate) {
        console.log("InitTable for id=" + id);
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
            "dom": 'rlfrtip', // the "r" is for the "processing" message
            "language": {
                "processing": "<span class='glyphicon glyphicon-refresh glyphicon-refresh-animate'></span>"
            }, // you can put text or html here in the language.processing setting.
            "processing": true, // you have to set this to true as well
            columns: [
                { "data": "Rank" },
                { "data": "Name", render(data) { return '<img src="data/flags/' + data + '.png" class="flag"><p class="team-in-list">' + data+'</p>'; } },
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

        $('#list-name').text('Date of publication: ' + rankingDate);

        $('#ranking-list tbody').on('click', 'tr', function () { // append click to team name
            var data = dataTable.row(this).data();
            $("#main-content").load("./partials/chart.html", null, function () {
                adjustSVG();
                setTimeout(function () {
                    removeAds();
                }, 400);
                Chart.getInstance().init(data.Name);
            });
        });

        if (mobileCheck()||window.innerWidth<600) { // if mobile hide column "PreviousPoints"
            dataTable.column(3).visible(false);
        }

    }

    function reloadTable(id) {
        $('#main-content-wrapper').addClass('loading');
        dataTable.ajax.url("data/rankings/" + id + ".json").load(function (jsonResponse) {
            rankingDate = moment(jsonResponse.Date).format("D MMMM YYYY");
            $('#list-name').text('Date of publication: ' + rankingDate);
            $('#main-content-wrapper').removeClass('loading');
            console.log("Reload table for id=" + id);
        }, null);
    }

    function setupListNavigation() {
        disableToggleOnLast();
        $('#btn-list-previous').click(function () { // ------------------ *** PREVIOUS
            LIST_PARAMS.id = Number(LIST_PARAMS.id) - 1;
            LIST_PARAMS.isLastId = false;
            
            if ($("#sel-month option:first")[0].selected == true) { // if first month in year
                $('#sel-year option:selected').prev().prop('selected', 'selected'); // skip to previous year
                fillMonths(false, LIST_PARAMS.id, true); // and select last month, reload table
            } else {
                reloadTable(LIST_PARAMS.id);
                $("#sel-month").val(Number($("#sel-month").val()) -1);
            }
            $("#btn-list-previous").blur();
            disableToggleOnLast();
        });

        $('#btn-list-next').click(function () { // --------------------- *** NEXT
            if (!LIST_PARAMS.isLastId) {
                LIST_PARAMS.id = Number(LIST_PARAMS.id) + 1;
                LIST_PARAMS.isLastId = LIST_PARAMS.lastId == LIST_PARAMS.id ? true : false;

                if ($("#sel-month option:last")[0].selected == true) { // if last month in year
                    $('#sel-year option:selected').next().prop('selected', 'selected'); // skip to next year
                    fillMonths(true, LIST_PARAMS.id, true); // and select first month, reload table
                } else {
                    reloadTable(LIST_PARAMS.id);
                    $("#sel-month").val(Number($("#sel-month").val()) + 1);

                }
                $("#btn-list-next").blur();
                disableToggleOnLast();
            }
        });

        $('#btn-list-last').click(function () { // ------------------ *** LAST
            if (!LIST_PARAMS.isLastId) {
                LIST_PARAMS.id = LIST_PARAMS.lastId;
                LIST_PARAMS.isLastId = true;

                $('#sel-year option:last').prop('selected', 'selected'); // skip to last year
                fillMonths(false, LIST_PARAMS.lastId, true);

                $("#btn-list-last").blur();
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

        // ******** Set params ***********
        $.getJSON('./data/rankings/_rankingsList.json', function (data) {
            LIST_PARAMS.lastId = data[data.length - 1].Id;
            LIST_PARAMS.id = id ? id : LIST_PARAMS.lastId;
            LIST_PARAMS.isLastId = (LIST_PARAMS.id == LIST_PARAMS.lastId) ? true : false;

            // ******** ALL ACTION ON SITE GOES HERE *********
            fillSelects_list(function () {
                var rankingDate = moment(data[LIST_PARAMS.id - 1].Date).format("D MMMM YYYY");
                initTable(LIST_PARAMS.id, rankingDate); // imidately after init is reload, so...
                setupListNavigation(LIST_PARAMS);
            }, LIST_PARAMS.id);
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