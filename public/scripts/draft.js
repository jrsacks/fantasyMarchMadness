var team = parseInt(window.location.search.split('?')[1], 10);

var ws;
var playerData = {};
var teamData = []

function userFromTeamData() {
  return teamData[team - 1].team;
}

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

function addPlayer(teamId, playerId){
  var teamList = $('#team-list tbody tr').map(function(){ return $(this).find('td')[teamId]; });
  var emptyCells = teamList.filter(function() { return $(this).text() === ''; });
  $(emptyCells[0]).append($('<a>').attr(playerLink(playerId)).text(playerData[playerId].name));
}

function addRowsToTeamTable() {
  _.times(10, function(i){
    var row = $('<tr>').append($('<td>').addClass('round-num').text(i + 1));
    _.each(teamData, function(i){
      row.append($('<td>').width( (100 / teamData.length) + '%'));
    });

    $('.team-row tbody').append(row);
  });

  _.each(teamData, function(teamObj){
    var teamTitle = $('<th>').text(teamObj.team);
    if(teamObj.id === team){
      teamTitle = $('<th>').append($('<input>').addClass('input-small').val(teamObj.team).change(function(){
        renameTeam(ws, $(this).val());
      }));
    }
    $('#team-list thead tr').append(teamTitle);
    _.each(teamObj.players, function(playerId){
      addPlayer(teamObj.id, playerId);
    });
  });
}

function renameTeam(socket, newName) {
  socket.send(JSON.stringify({
    timestamp: new Date().getTime(), 
    team: team,
    newName: newName,
    type : "rename"
  }));
}

function send(socket, msg) { 
  socket.send(JSON.stringify({
    timestamp: new Date().getTime(), 
    userId : team,
    user : userFromTeamData(),
    message: msg
  }));
}

function makePick(socket, team, player) {
  socket.send(JSON.stringify({
    timestamp: new Date().getTime(), 
    team : team,
    player : player,
    type : "pick"
  }));
}

function scrollChat(resize) {
  var lineHeight = 14;
  if(!resize && ($('.chat div').length - 1) * lineHeight - $('.chat').scrollTop() > $('.chat').height()){
    console.log('no scroll');
  }
  else {
    $('.chat').scrollTop(lineHeight * ($('.chat div').length + 2)); 
  }
}

function addMessageToChat(parsed) {
  var msgDate = new Date(parsed.timestamp);
  $('.chat').append($('<div>')
    .append($('<span>').addClass('chat-timestamp').text(msgDate.getHours() % 12 + ':' + twoDigit(msgDate.getMinutes()) + ':' + twoDigit(msgDate.getSeconds())))
    .append($('<span>').text(parsed.user + ': ' + parsed.message)));

  scrollChat();
}

function addPickToChat(parsed) {
  var msgDate = new Date(parsed.timestamp);
  $('.chat').append($('<div>')
    .append($('<span>').addClass('chat-timestamp').text(msgDate.getHours() % 12 + ':' + twoDigit(msgDate.getMinutes()) + ':' + twoDigit(msgDate.getSeconds())))
    .append($('<span>').addClass('pick-announcement').text(playerText(playerData[parsed.player]) + " Selected By: " + teamData[parsed.team - 1].team)));

  scrollChat();
}

function removeFromWishList(playerId){
  var player = playerText(playerData[playerId]);
  $('.draft-player').filter(function(){return $(this).text() == player;}).parent().remove()
}

function nextPick(){
  var taken = draftedPlayers().length;
  var teams = teamData.length;
  var round = Math.floor(taken / teams);
  if(taken == teams*10){
    return teams + 1;
  }
  if(round % 2 === 0){
    return 1 + (taken % teams);
  }
  return teams - (taken % teams);
}

function hideShowDraftButtons(){
  $('.draft-button').hide();
  if(nextPick() == team){
    $('.draft-button').show();
  }
  $('#team-list thead th').removeClass('current-pick');
  $($('#team-list thead th')[nextPick()]).addClass('current-pick');
}

function handleDraftPick(parsed) {
  addPlayer(parsed.team, parsed.player)
  teamData[parsed.team - 1].players.push(parsed.player);
  updatePlayerAutoComplete();
  removeFromWishList(parsed.player);
  hideShowDraftButtons();
}

function updateTeamName(parsed) {
  if(parsed.team !== team){
    $($('#team-list thead th')[parsed.team]).text(parsed.newName);
  }
}

function handleMessage(msg) { 
  var parsed = JSON.parse(msg.data);

  if(parsed.message){
    addMessageToChat(parsed);
  }
  if(parsed.type == "pick"){
    handleDraftPick(parsed);
    addPickToChat(parsed);
  }
  if(parsed.type == "rename"){
    updateTeamName(parsed);
  }
}

function playerLink(id){
  return {target: '_blank', href : 'http://rivals.yahoo.com/ncaa/basketball/players/' + id};
}

function draftedPlayers(){
  return _.flatten(_.map(teamData, function(team) { return team.players; }));
}

function updatePlayerAutoComplete(){
  var drafted = draftedPlayers();
  var undrafted = _.filter(playerData, function(player, id){
    return !_.contains(drafted, id);
  });
  $('#player-search').unautocomplete().autocomplete(_.map(undrafted, playerText), {matchContains : true, max : 20});
  $('#player-search').result(function(){
    var playerNameText = $(this).val();
    var newRow = $('#player-list tbody .template').clone().removeClass('template');
    newRow.find('.name').text(playerNameText).attr(playerLink(idFromName($(this).val())));
    newRow.find('.draft-button').click(function(){
      makePick(ws, team, idFromName($(this).closest('tr').find('.name').text()));
      $('.draft-button').hide();
    });
    newRow.find('.icon-remove').click(function(){
      newRow.remove();
    });
    
    $('#player-list tbody tr').filter(function(){
      return $(this).find('.name').text() === playerNameText;
    }).remove();

    $('#player-list tbody').prepend(newRow);
    $(this).val('');
    hideShowDraftButtons();
  });
}

$(document).ready(function(){
  ws = new ReconnectingWebSocket('ws://' + window.location.hostname + ':4568');
  ws.onmessage = handleMessage;

  $('#chat-text').keypress(function (e){
    if(e.keyCode.toString() == 13) {
      send(ws, $(this).val());
      $(this).val('');
    }
  });

  $.getJSON('/data/players', function(players){
    playerData = players;
    $.getJSON('/data/teams', function(teams){
      teamData = teams;
      addRowsToTeamTable();
      updatePlayerAutoComplete()
    });
  });

  $(window).resize(function(){scrollChat(true);});

  setTimeout(function(){
    send(ws, 'Hello');
    $('#player-search').val('Blake McLimans (Michigan Wolverines)').trigger('result');
  }, 500);
});
