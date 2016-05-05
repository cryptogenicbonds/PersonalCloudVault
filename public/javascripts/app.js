$.fn.center = function () {
    this.css("position","absolute");
    this.css("top", ( $(window).height() - this.height() ) / 2  + "px");
    this.css("left", ( $(window).width() - this.width() ) / 2 + "px");
    return this;
}

var walletInfo = {'totalBlock': 0};
var walletInfoLoaded = false;

var pages = {
    '#dashboard': 'dashboard.html',
    '#send': 'send.html',
    '#receive': 'receive.html',
    '#book': 'book.html',
    '#settings': 'settings.html'
};

var daemonDown = false;
var timerInformations = null;

function actuallyDown(){
    daemonDown = true;
    $('#background2').html("<div class='white text-center center-block'><h1>Your CBX daemon seems down.</h1><p>If your daemon just updated, it's normal it is just the time it starts... This message will disipear once it's ready</p></div>");
    $('#background2').fadeIn(1);
}

function daemonUp(){
    daemonDown = false;
    $('#background2').fadeOut(300);
}

function onURLChange(){

    reloadGeneralInformations();
    reloadBlockCount();

    var hash = window.location.hash.replace('/', '');

    if(hash == null || hash == '')
        hash = '#dashboard';

    if(hash == '#')
        hash += 'dashboard';

    $('ul#navmenu li').removeClass("active");
    $('ul#navmenu li'+hash).addClass("active");

    var page = pages[hash];

    if(page == null)
        page = pages['#dashboard'];

    $.get(page, function( data ) {
        $('#mainapp').html(data);
    });

    if(timerInformations == null)
        timerInformations = setInterval(function() {
            reloadGeneralInformations();
        }, 5000);
}

function reloadGeneralInformations(){

    getAPI("command=getinfo", function( resp ) {
        var data = resp.response;
        walletInfo = resp.response;
        $('.cbxAvailable').html(formatAmount(data.balance));
        var total = data.stake+data.balance;
        $('.cbxAmount').html(formatAmount(total));
        $('.cbxStake').html(formatAmount(data.stake));

        walletInfoLoaded = true;
    });
}

function reloadBlockCount(){
    getAPI( "command=totalblock", function( data ) {
        if(data.status == 'success') {
            walletInfo.totalBlock = data.response.totalBlock;
            updateProgressBar();
        }
    });
}

function formatAmount(nStr)
{
    nStr += '';
    x = nStr.split('.');
    x1 = x[0];
    x2 = x.length > 1 ? '.' + x[1] : '';
    var rgx = /(\d+)(\d{3})/;
    while (rgx.test(x1)) {
        x1 = x1.replace(rgx, '$1' + ' ' + '$2');
    }
    return x1 + x2;
}

function getAPI(params, callback){
    $.getJSON( "/api/wallet?" + params, function( data ) {
        if(data.status != null && data.status == 'error' && params.indexOf('getinfo') > -1) {
            actuallyDown();
        }else {
            if(params.indexOf('getinfo') > -1) daemonUp();
            callback(data);
        }
    });
}

function displayError(message){
    if(message != "") alert(message);
}

function displaySuccess(message){
    if(message != "") alert(message);
}

function sendCommandFromForm(selector, callback){
    var form = $(selector);

    if(typeof callback === 'undefined' || callback  === null)
        callback = function(){};

    var command = form.find("input[name='command']").val();

    if(command != null){
        var urlParams = "command="+encodeURIComponent(command);
        form.find("input").each(function(index){
            if($(this).attr('name') != "command"){
                urlParams += "&"+encodeURIComponent($(this).attr('name'))+"="+encodeURIComponent($(this).val());
                $(this).val('');
            }
        });

        getAPI(urlParams, function(data){
            if(data.status == 'error'){
                displayError(data.message);
            }else{
                displaySuccess(data.message);
                callback(data);
            }
        });
    }
}

function showPopup(content){
    $('#popup div.content').html(content);
    $('#popup').center();

    $('#background').html('');
    $('#background').fadeIn(5);
    $('#popup').fadeIn(100);
}

function hidePopup(){
    $('#background').fadeOut(5);
    $('#popup').fadeOut(100);
}

function initBackground(selector){
    $(selector).css('background-color', 'rgba(0, 0, 0, 0.5)');
    $(selector).css('z-index', 999998);
    $(selector).css('position', 'fixed');
    $(selector).css('width', $(document).width()+'px');
    $(selector).css('height', $(document).height()+'px');
}

function initPopupCSS(){
    initBackground('#background');
    initBackground('#background2');

    $('#popup').css('background-color', 'white');
    $('#popup').css('position', 'fixed');
    $('#popup').css('border', 'solid 1px black');
    $('#popup').css('border-radius', '5px');
    $('#popup').css('padding', '10px');
    $('#popup').css('z-index', 999999);
}

function updateProgressBar(){
    if(walletInfo.totalBlock - walletInfo.blocks >= 5){
        var percent = walletInfo.blocks / walletInfo.totalBlock;
        percent *= 100;
        if(percent > 99.99)
            percent = 99.99;
        $('#syncProgress div.progress-bar.progress-bar-success.black').css('width', percent+'%');
        $('#syncProgress div.progress-bar.progress-bar-success.black').attr('aria-valuenow', percent);
        $('#syncProgress div.progress-bar.progress-bar-success.black').html('Synchronizing block chain ('+percent.toFixed(2)+'%)');
        $('#syncProgress').fadeIn(1);
    }else
        $('#syncProgress').fadeOut(1);
}

function logout(){
    getAPI('command=logout', function(){
        window.location.replace("/");
    });
}

$(function(){
    $('#syncProgress').fadeOut(1);
    $('#background').fadeOut(1);
    $('#popup').fadeOut(1);
    initPopupCSS();
    onURLChange();

    $(window).on('hashchange', function(e){
        onURLChange();

    });

    setInterval(function() {
        reloadBlockCount();
    }, 10200);
});