$(document).ready(function () {
    // *** *** *** Uncomment to recalculate all (rankings, teams) *** *** ***

    //$.ajax({
    //    url: "/parser?action=recalculateAll",
    //    type: "POST",
    //    data: {},
    //    success: function (data) {

    //    },
    //    error: function (jqXHR, textStatus, errorThrown) {
    //        alert("Error! Status: " + textStatus + ", " + errorThrown);
    //    }
    //});

    // *** *** *** Uncomment to update with last ranking (rankings, teams) *** *** ***

    $.ajax({
        url: "/parser?action=updateWithLast",
        type: "POST",
        data: {},
        success: function (data) {
            var response = JSON.parse(data);
            console.log(response.Value);
        },
        error: function (jqXHR, textStatus, errorThrown) {
            alert("Error! Status: " + textStatus + ", " + errorThrown);
        }
    });
});