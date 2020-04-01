//线上
let baseUrl = 'http://49.235.64.160';
let socketUrl = baseUrl + ':9191';
//本地
/*    let baseUrl = 'http://127.0.0.1';
    let socketUrl = baseUrl + ':9066';*/

let socket = io(socketUrl, {
    'path': "",
    'reconnection limit': 1000,
    'reconnection delay': Infinity,
    'reopen delay': 3000,
    'max reconnection attempts': 10,
    'reconnection': true
});
socket.open();

//http 请求
let httpUrl = baseUrl + ':9055';

var self = {};

function who(uuid, name) {
    self.uuid = uuid;
    self.name = name;
    socket.emit('registryGroup', JSON.stringify(self));
    console.log(self);
}

//连接
socket.on('connect', function () {
    if (socket.connected) {
        console.log(socket.id);
    }
});
//掉线
socket.on('disconnect', function () {
    alert('你已掉线！请重新登录！');
});
//重连
socket.on('reconnect', function () {
    console.log('重连成功！');
});
//注册结果
socket.on("registryResult", function (data) {
    console.log(data);
    alert(data === 'true' ? self.uuid + '注册成功！' : self.uuid + '注册失败！');
    if (data === 'true') {
        loading();
    }
});
//消息发送结果
var sendFlag = true;
socket.on('messageSendResult', function (data) {
    sendFlag = data.flag;
    console.log(sendFlag ? "消息ID->" + data.msgId + "  发送成功！" : "消息->" + data.msgId + "  发送失败！");
    //找到对应的消息记录并标记是否发送成功
});
//新消息接收
socket.on('messageRecieve', function (data) {
    console.log('来消息了...' + data);
    const news = JSON.parse(data);
    if (news.type === "text") {
        showReceive(news.name, news.time, news.msg);
    } else if (news.type === "img") {
        showReceiveImg(news.name, news.time, news.msg)
    }
});
//退出
socket.on('logout', function (data) {
    alert(data);
});
//上线
socket.on('whoOnline', function (data) {
    console.log('有人上线了 -> ' + data);
    const news = JSON.parse(data);
    onlinePeople(news.uuid, news.name);
});
//下线
socket.on('whoOutOnline', function (data) {
    console.log('有人下线了 -> uuid = ' + data);
    offlinePeople(data);
});
//是否需要再登录
socket.on('needLogin', function (data) {
    const flag = JSON.parse(data).needLogin;
    console.log(data);
    if (flag) {
        loginModal();
    } else {
        self.uuid = JSON.parse(data).uuid;
        self.name = JSON.parse(data).uuid;
        loading();
    }
});

// 登录之后需要初始化的脚本
function loading() {
    // 获取全部在线人
    $.getJSON(httpUrl + "/all", function (data) {
        $.each(data, function (i, item) {
            onlinePeople(item.uuid, item.uuid);
        });
    });
    // 获取历史消息
    $.getJSON(httpUrl + "/historyMsg", function (data) {
        console.log(data);
        $.each(data, function (i, item) {
            if (item.type === "text") {
                if (item.name === self.name) {
                    showReceiveOfMe(item.name, item.time, item.msg);
                } else {
                    showReceive(item.name, item.time, item.msg);
                }
            } else if (item.type === "img") {
                if (item.name === self.name) {
                    showReceiveImgOfMe(item.name, item.time, item.msg);
                } else {
                    showReceiveImg(item.name, item.time, item.msg);
                }
            }
        });
    });
}

// 计算聊天窗口变化
function msgWindow() {
    let sideWidth = $('.side').width();
    let mainWidth = $('.main').width();
    $('.commute').css('width', (mainWidth - sideWidth) + 'px');

    let commuteHeight = $('.commute').height();
    $('.side').css('height', commuteHeight + 'px');
}

//进入首页 必须要做的初始化操作
function init() {
    //计算窗口变化
    msgWindow();
}

init();

// 登录事件
$('#submit').click(function () {
    var name = $.trim($('#username').val());
    if (name === "") {
        alert('登录名不能为空！');
    }
    who(name, name);
    loginModal();
});

// 浏览器大小发生变化
$(window).resize(function () {
    msgWindow();
});

//弹窗登录框
function loginModal() {
    if (self.name === undefined || self.name === "") {
        $('.login-wrap').fadeIn();
    } else {
        $('.login-wrap').fadeOut();
    }
}

// 在线
function onlinePeople(UUID, name) {
    let p = '<div class="online" data-uuid="' + UUID + '">' +
        '<span>' + name + '</span>' +
        '</div>';
    $('.side').append($(p));
}

// 离线
function offlinePeople(name) {
    // 移除旧的数据
    $('.online[data-uuid="' + name + '"]').remove();
}

// 显示已发送
function showSend() {
    console.log(self);
    let uuid = self.uuid;
    let name = self.name;
    let time = dateFormat('YYYY-mm-dd HH:MM', new Date());
    let content = $.trim($('#msg').val());
    if (content === "") {
        return;
    }
    let model = {};
    model.type = 'text';
    model.msg = content;
    model.msgId = generateUUID();
    model.uuid = uuid;
    model.time = new Date();
    model.name = name;
    socket.emit('messageSendGroup', JSON.stringify(model));
    //发送成功才显示聊天内容
    if (sendFlag) {
        let html = '<div class="view-right-wrap">' +
            '<div class="view-right">' +
            '<div class="view-name">' +
            '<span>' + time + ' </span>' +
            '<span>' + name + '</span>' +
            '</div>' +
            '<div class="view-content"><span>' + content + '</span></div>' +
            '</div>' +
            '</div>';
        $('#view').append($(html));
    }
    //清空文本框内容
    $("#msg").val("");
    // 滚动到最下面
    $('.view').scrollTop($('.view').prop("scrollHeight"));
}

// 显示已接收
function showReceive(name, time, content) {
    let html = '<div class="view-left">' +
        '<div class="view-name">' +
        '<span>' + name + ' </span>' +
        '<span>' + time + '</span>' +
        '</div>' +
        '<div class="view-content"><span>' + content + '</span></div>' +
        '</div>';
    $('#view').append($(html));
    // 滚动到最下面
    $('.view').scrollTop($('.view').prop("scrollHeight"));
}

function showReceiveOfMe(name, time, content) {
    let html = '<div class="view-right-wrap">' +
        '<div class="view-right">' +
        '<div class="view-name">' +
        '<span>' + time + ' </span>' +
        '<span>' + name + '</span>' +
        '</div>' +
        '<div class="view-content"><span>' + content + '</span></div>' +
        '</div>' +
        '</div>';
    $('#view').append($(html));
    // 滚动到最下面
    $('.view').scrollTop($('.view').prop("scrollHeight"));
}

// 文本框回车发消息
$('#msg').keyup(function (event) {
    if (event.keyCode === 13) {
        showSend();
    }
});

// 上传图片
$('#file').change(function () {
    var formData = new FormData();
    formData.append("file", $("#file")[0].files[0]);
    $.ajax({
        url: 'http://49.235.64.160:9055/fileUp',
        type: 'post',
        data: formData,
        contentType: false,
        processData: false,
        success: function (data) {
            console.log();
            if (data["code"] == 200) {
                showSendImg(data["path"]);
            } else {
                console.log(res);
            }
        }
    });
    $("#file").val('');
});

function showSendImg(path) {
    let uuid = self.uuid;
    let name = self.name;
    let time = dateFormat('YYYY-mm-dd HH:MM', new Date());
    let model = {};
    model.type = 'img';
    model.msg = path;
    model.msgId = generateUUID();
    model.uuid = uuid;
    model.time = new Date();
    model.name = name;
    socket.emit('messageSendGroup', JSON.stringify(model));
    //发送成功才显示聊天内容
    if (sendFlag) {
        let html = '<div class="view-right-wrap">' +
            '<div class="view-right">' +
            '<div class="view-name">' +
            '<span>' + time + ' </span>' +
            '<span>' + name + '</span>' +
            '</div>' +
            '<div class="view-content"><img src="' + path + '"/></div>' +
            '</div>' +
            '</div>';
        $('#view').append($(html));
    }
    // 滚动到最下面
    $('.view').scrollTop($('.view').prop("scrollHeight"));
}

// 显示已接收图片
function showReceiveImg(name, time, img) {
    let html = '<div class="view-left">' +
        '<div class="view-name">' +
        '<span>' + name + ' </span>' +
        '<span>' + time + '</span>' +
        '</div>' +
        '<div class="view-content"><img src="' + img + '"/></div>' +
        '</div>';
    $('#view').append($(html));
    // 滚动到最下面
    $('.view').scrollTop($('.view').prop("scrollHeight"));
}

function showReceiveImgOfMe(name, time, img) {
    let html = '<div class="view-right-wrap">' +
        '<div class="view-right">' +
        '<div class="view-name">' +
        '<span>' + time + ' </span>' +
        '<span>' + name + '</span>' +
        '</div>' +
        '<div class="view-content"><img src="' + img + '"/></div>' +
        '</div>' +
        '</div>';
    $('#view').append($(html));
    // 滚动到最下面
    $('.view').scrollTop($('.view').prop("scrollHeight"));
}


// -------------------------------------------------------------------


function dateFormat(fmt, date) {
    let ret;
    const opt = {
        "Y+": date.getFullYear().toString(),        // 年
        "m+": (date.getMonth() + 1).toString(),     // 月
        "d+": date.getDate().toString(),            // 日
        "H+": date.getHours().toString(),           // 时
        "M+": date.getMinutes().toString(),         // 分
        "S+": date.getSeconds().toString()          // 秒
        // 有其他格式化字符需求可以继续添加，必须转化成字符串
    };
    for (let k in opt) {
        ret = new RegExp("(" + k + ")").exec(fmt);
        if (ret) {
            fmt = fmt.replace(ret[1], (ret[1].length === 1) ? (opt[k]) : (opt[k].padStart(ret[1].length, "0")))
        }
    }
    return fmt;
}

//获取msgId -> UUID
function generateUUID() {
    var d = new Date().getTime();
    if (window.performance && typeof window.performance.now === "function") {
        d += performance.now(); //use high-precision timer if available
    }
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = (d + Math.random() * 16) % 16 | 0;
        d = Math.floor(d / 16);
        return (c == 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });
}
