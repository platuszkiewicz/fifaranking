var Examples = (function () {
    // global variables - just reference as 'globalVariable_1' etc.

    // global functions - just reference as 'func1()' etc.
    function loadCarosuel() {

    }

    // load other singletons. Other singleton contain some logic which can be packed, i.e. modal	
    function Examples() {
        //this.otherSingleton = new OtherSingleton();
    }

    Examples.prototype.init = function (params) {
        var that = this;
        // ******** ALL ACTION ON SITE GOES HERE *********
        loadCarosuel();
    }
    ///////////////////////////////////////////////////
    // Singleton implementation ///////////////////////
    ///////////////////////////////////////////////////
    var _instance;
    var _static = {
        name: "Examples",
        getInstance: function () {
            if (_instance === undefined) {
                _instance = new Examples();
            }
            return _instance;
        }
    }

    return _static;
}());



