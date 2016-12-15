$(document).ready(function () {
    $.ajax({
        url: "/parser?action=getLatestRanking",
        type: "POST",
        data: {},
        success: function (data) {
            // console.log(data);
        },
        error: function (jqXHR, textStatus, errorThrown) {
            alert("Error! Status: " + textStatus + ", " + errorThrown);
        }
    });

    $.ajax({
        url: "/parser?action=getTeamList",
        type: "POST",
        data: {},
        success: function (data) {
            // console.log(data);
        },
        error: function (jqXHR, textStatus, errorThrown) {
            alert("Error! Status: " + textStatus + ", " + errorThrown);
        }
    });
});