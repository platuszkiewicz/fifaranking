var Schedule = (function () {
    // global variables - just reference as 'globalVariable_1' etc.
    var DATA = [
        { id: 309, date: moment(new Date(2021, 1, 18)) }, // 0 - January, 1 - February...
        { id: 310, date: moment(new Date(2021, 3, 7)) },
        { id: 311, date: moment(new Date(2021, 4, 27)) },
        { id: 312, date: moment(new Date(2021, 7, 12)) },
        { id: 313, date: moment(new Date(2021, 8, 16)) },
        { id: 314, date: moment(new Date(2021, 9, 21)) },
        { id: 315, date: moment(new Date(2021, 10, 25)) },
        { id: 316, date: moment(new Date(2021, 11, 16)) },
    ];

    // global functions - just reference as 'func1()' etc.
    function createList(data) {
        var $ul = $('ul.list-group');
        $.each(data, function (idx, val) {
            var $li = new $('<li>');
            if (val.date > moment()) { // ----------------------------------------------future
                $li.text(moment(val.date).format('D') + ' ' + moment(val.date).format('MMMM'));
            } else {                   // ----------------------------------------------past
                var $a = new $('<a>');
                $a.attr("href", "#");
                $a.text(moment(val.date).format('D') + ' ' + moment(val.date).format('MMMM'));
                $a.click(function () { // load List
                    $.ajax({
                        url: "data/rankings/" + val.id + ".json",
                        type: 'HEAD',
                        error: function () {
                            //file not exists
                            alert("This ranking wasn't yet provided");
                        },
                        success: function () {
                            //file exists
                            $("#main-content").load("./partials/list.html", null, function () {
                                setTimeout(function () {
                                    removeAds();
                                }, 400);
                                List.getInstance().init(val.id);
                            });
                        }
                    });


                });
                $a.appendTo($li);
            }

            $li.addClass('list-group-item');
            $li.appendTo($ul);
        });
    }

    // load other singletons. Other singleton contain some logic which can be packed, i.e. modal	
    function Schedule() {
        //this.otherSingleton = new OtherSingleton();
    }

    Schedule.prototype.init = function (params) {
        var that = this;
        // ******** ALL ACTION ON SITE GOES HERE *********

        $.each(DATA, function (idx, val) { // appends to DATA wheter ranking is in the future or in the past
            if (val.date > moment()) { // future
                val.past = false;
            } else { // past
                val.past = true;
            }
        });

        createList(DATA);
    }
    ///////////////////////////////////////////////////
    // Singleton implementation ///////////////////////
    ///////////////////////////////////////////////////
    var _instance;
    var _static = {
        name: "Schedule",
        getInstance: function () {
            if (_instance === undefined) {
                _instance = new Schedule();
            }
            return _instance;
        }
    }

    return _static;
}());



