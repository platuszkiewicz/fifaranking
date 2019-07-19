var Schedule = (function () {
    // global variables - just reference as 'globalVariable_1' etc.
    var DATA = [
        { id: 293, date: moment(new Date(2019, 1, 7)) },
        { id: 294, date: moment(new Date(2019, 3, 4)) },
        { id: 295, date: moment(new Date(2019, 5, 14)) },
        { id: 296, date: moment(new Date(2019, 6, 25)) },
        { id: 298, date: moment(new Date(2019, 8, 19)) },
        { id: 299, date: moment(new Date(2019, 9, 24)) },
        { id: 300, date: moment(new Date(2019, 10, 28)) },
        { id: 301, date: moment(new Date(2019, 11, 19)) },
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



