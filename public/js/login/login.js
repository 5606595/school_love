/**
 * Created by jorten on 16/7/18.
 */
$('button').click(function(eve) {
    console.log($("#name").val())
    eve.preventDefault();
    $.ajax({
        url: '/login',
        method: 'get',
        data: {
            name: $("#name").val()
        },
        success: function(res) {
            if(res === 'false') {
                alert('用户不存在')
            } else {
                alert('登录成功');
                location.href = '/'
            }
        }
    })
})