$("button").click(function() {
    $.ajax({
        url: "/login",
        method: "GET",
        success: function(res) {
            alert(res);
            location.href = "/"
        }
    });
});
