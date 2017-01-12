var Schedule = (function () {
    // global variables - just reference as 'globalVariable_1' etc.
    var DATA = [
        { id: 270, date: moment(new Date(2017, 0, 12)) },
        { id: 271, date: moment(new Date(2017, 1, 9)) },
        { id: 272, date: moment(new Date(2017, 2, 9)) },
        { id: 273, date: moment(new Date(2017, 3, 6)) },
        { id: 274, date: moment(new Date(2017, 4, 4)) },
        { id: 275, date: moment(new Date(2017, 5, 1)) },
        { id: 276, date: moment(new Date(2017, 6, 6)) },
        { id: 277, date: moment(new Date(2017, 7, 10)) },
        { id: 278, date: moment(new Date(2017, 8, 14)) },
        { id: 279, date: moment(new Date(2017, 9, 19)) },
        { id: 280, date: moment(new Date(2017, 10, 23)) },
        { id: 281, date: moment(new Date(2017, 11, 21)) },
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



