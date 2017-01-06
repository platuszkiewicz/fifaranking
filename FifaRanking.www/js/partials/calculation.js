var CalculationMethod = (function () {
    // global variables - just reference as 'globalVariable_1' etc. 

    // global functions - just reference as 'func1()' etc.

    // load other singletons. Other singleton contain some logic which can be packed, i.e. modal	
    function CalculationMethod() {
        //this.otherSingleton = new OtherSingleton();
    }

    CalculationMethod.prototype.init = function (params) {
        var that = this;
        // ******** ALL ACTION ON SITE GOES HERE *********
        katex.render("Match \\space points = (Match \\space result)*(Match \\space status)*(Opposition \\space strength)*(Regional \\space strength)*100", document.getElementById('formula'));
        katex.render("Oppostion \\space strength = (200-opponent \\space ranking \\space position)/100",document.getElementById('oppositionStrength'))
    }
    ///////////////////////////////////////////////////
    // Singleton implementation ///////////////////////
    ///////////////////////////////////////////////////
    var _instance;
    var _static = {
        name: "CalculationMethod",
        getInstance: function () {
            if (_instance === undefined) {
                _instance = new CalculationMethod();
            }
            return _instance;
        }
    }

    return _static;
}());



