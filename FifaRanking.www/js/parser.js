$(document).ready(function () {
    // *** *** *** Uncomment to recalculate all (rankings, teams) *** *** ***
    // REMEMBER: delete data/rankings and data/teams content
    recaluculateAll();

    // *** *** *** Uncomment to update with last ranking (rankings, teams) *** *** ***
    //updateWithLast();

});

function recaluculateAll() {
    $.ajax({
        url: "/parser?action=recalculateAll",
        type: "POST",
        data: {},
        success: function (data) {

        },
        error: function (jqXHR, textStatus, errorThrown) {
            alert("Error! Status: " + textStatus + ", " + errorThrown);
        }
    });
}

function updateWithLast() {
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
}