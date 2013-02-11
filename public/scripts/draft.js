var colors = ["Red", "Maroon", "Yellow", "Olive","Lime","Green","Aqua","Teal","Blue","Navy","Fuchsia","Purple"];
var playerData = {};

function idFromName(name) {
  return _.find(_.keys(playerData), function(playerId){
    return playerText(playerData[playerId]) === name;
  });
}

function playerText(player){
  return player.name + ' (' + player.team + ')';
}

function twoDigit(val){
  if(val < 10){
    return '0' + val;
  }
  return val;
}

function addRowsToTeamTable() {
  _.times(10, function(i){
    var row = $('<tr>').append($('<td>').text(i + 1));
    _.times(12, function(i){
      row.append($('<td>'));
    });
    $('.team-row tbody').append(row);
  });
}

function send(socket, msg) { 
  socket.send(JSON.stringify({
    timestamp: new Date().getTime(), 
    userId : new Date().getTime() % 12,
    user : window.location.search.split('?')[1], 
    message: msg
  }));
}

function scrollChat() {
  if(($('.chat div').length - 1) * 30 - $('.chat').scrollTop() > $('.chat').height()){
    console.log('no scroll');
  }
  else {
    $('.chat').scrollTop(9999); // 30 * num rows?
  }
}

function addMessageToChat(parsed) {
  var msgDate = new Date(parsed.timestamp);
  $('.chat').append($('<div>')
    .append($('<span>').addClass('chat-timestamp').text(msgDate.getHours() % 12 + ':' + twoDigit(msgDate.getMinutes()) + ':' + twoDigit(msgDate.getSeconds())))
    .append($('<span>').text(parsed.user + ': ').css('color',colors[parsed.userId]))
    .append($('<span>').text(parsed.message)));

  scrollChat();
}

function handleDraftPick(parsed) {
}

function handleMessage(msg) { 
  var parsed = JSON.parse(msg.data);

  if(parsed.message){
    addMessageToChat(parsed);
  }
  if(parsed.draft){
    handleDraftPick(parsed);
  }
}

$(document).ready(function(){
  $.getJSON('/data/players', function(players){
    playerData = players;
    $('#player-search').autocomplete(_.map(players, playerText), {matchContains : true, max : 20});
    $('#player-search').result(function(){
      var newRow = $('#player-list tbody .template').clone().removeClass('template');
      newRow.find('.name').text($(this).val()).attr({target: '_blank', href : 'http://rivals.yahoo.com/ncaa/basketball/players/' + idFromName($(this).val())});
      newRow.find('.icon-remove').click(function(){
        newRow.remove();
      });
      $('#player-list tbody').prepend(newRow);
      $(this).val('');
    });
  });

  addRowsToTeamTable();

  var ws = new ReconnectingWebSocket('ws://' + window.location.hostname + ':4568');
  ws.onmessage = handleMessage;

  $('#chat-text').keypress(function (e){
    if(e.keyCode.toString() == 13) {
      send(ws, $(this).val());
      $(this).val('');
    }
  });

  setTimeout(function(){
    send(ws, 'Chat Room');
    $('#player-search').val('Trey Burke (Michigan Wolverines)').trigger('result');
  }, 500);
});
