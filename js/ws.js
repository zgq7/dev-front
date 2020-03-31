    /**
 * Created by Administrator on 2019/8/13.
 */
var webSocket = null;
if ('webSocket' in window) {
    webSocket = new WebSocket("ws://localhost:8022/ws/wserver/1?pp=1");

    //打开新连接
    webSocket.onopen = function () {
    };

    //关闭当前连接
    webSocket.onclose = function () {
        console.log("close");
    };

    //来新消息时
    webSocket.onmessage = function (recieveMsg) {
        //console.log(recieveMsg);
        document.getElementById("id").innerText = recieveMsg.data;
    };

    //websocket连接出现错误时
    webSocket.onerror = function () {
        console.log("error");
    };

    //页面关闭时
    window.onbeforeunload = function () {
        webSocket.close();
    }

} else {
    alert("not support websocket !")
}

//socket
function send() {
    let obj = {};
    obj.msgId = "0";
    obj.sessionId = document.getElementById("dd").value;
    obj.content = document.getElementById("ss").value;

    webSocket.send(JSON.stringify(obj));
}