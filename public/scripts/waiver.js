var team = parseInt(window.location.search.split('?')[1], 10);

var ws;
var userData = {};
var playerData = {};
var standingsData = {};
var teamData = []
function currentYear() { return true;}
function historicYear() { return "";}

function setTeam() {
  var email = userData.emails[0].value;
  var teamMatch = _.find(teamData, function(teamObj){
    return teamObj.email === email;
  });
  if(teamMatch){
    team = teamMatch.id
  }
}

function userFromTeamData() {
  return userData.displayName;
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
  var round = $(emptyCells[0]).data('round');
  if(round < 10){
    if(teamId === team){
      if(!_.include(teamData[teamId - 1].waived, playerId)){
        function click() {
          waive(ws, teamId, playerId);
          $(this).hide();
        }
        $(emptyCells[0]).append($('<button class="pull-right btn btn-success btn-small">').click(click).text('Waive'));
      }
    }
  }
}

function addRowsToTeamTable() {
  _.times(12, function(i){
    var row = $('<tr>').append($('<td>').addClass('round-num').text(i + 1));
    _.each(teamData, function(j){
      row.append($('<td>').data('round', i).width( (100 / teamData.length) + '%'));
    });

    $('.team-row tbody').append(row);
  });

  var maxScore = _.max(_.pluck(teamData, 'score'));
  _.each(teamData, function(teamObj){
    var teamTitle = $('<th>').text(teamObj.team);
    $('#team-list thead tr').append(teamTitle);
    _.each(teamObj.players, function(playerId){
      addPlayer(teamObj.id, playerId);
    });
  });
}

function send(socket, msg) { 
  socket.send(JSON.stringify({
    timestamp: new Date().getTime(), 
    user : userFromTeamData(),
    message: msg
  }));
}

function makePick(socket, team, player) {
  socket.send(JSON.stringify({
    timestamp: new Date().getTime(), 
    team : team,
    player : player,
    type : "pickup"
  }));
}

function waive(socket, team, player) {
  socket.send(JSON.stringify({
    timestamp: new Date().getTime(), 
    team : team,
    player : player,
    type : "waive"
  }));
}

function scrollChat(resize) {
  var lineHeight = 15;
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

function hideShowDraftButtons(){
  $('.draft-button').show();
  $('#team-list thead th').addClass('current-pick');
}

function handleDraftPick(parsed) {
  addPlayer(parsed.team, parsed.player)
  teamData[parsed.team - 1].players.push(parsed.player);
  updatePlayerAutoComplete();
  buildWishList(currentWishList());
  hideShowDraftButtons();
}

function handleMessage(msg) { 
  var parsed = JSON.parse(msg.data);

  if(parsed.message){
    addMessageToChat(parsed);
  }
  if(parsed.type == "pickup"){
    handleDraftPick(parsed);
    addPickToChat(parsed);
    $('.timer').text(0);
  }
}

function playerLink(id){
  return {target: '_blank', href : 'http://rivals.yahoo.com/ncaa/basketball/players/' + id};
}

function draftedPlayers(){
  return _.flatten(_.map(teamData, function(team) { return team.players; }));
}

function buildWishList(ids){
  _.each(draftedPlayers(), function(drafted){
    ids = _.without(ids, drafted);
  });
  var list = $('#player-list tbody');
  list.find('tr').filter(function() { return $(this).attr('class') !== 'template';}).remove();
  _.each(ids, function(thisId){
    var newRow = list.find('.template').clone().removeClass('template');
    newRow.data('id', thisId);
    newRow.find('.name').text(playerText(playerData[thisId])).attr(playerLink(thisId));
    newRow.find('.draft-button').click(function(){
      makePick(ws, team, thisId);
    });
    newRow.find('.icon-remove').click(function(){
      buildWishList(_.without(currentWishList(), thisId));
    });
    newRow.find('.icon-arrow-up').click(function(){
      var wishList = currentWishList();
      var indexOf = wishList.indexOf(thisId);
      if(indexOf > 0){
        wishList[indexOf] = wishList[indexOf - 1];
        wishList[indexOf - 1] = thisId;
        buildWishList(wishList);
      }
    });
    newRow.find('.icon-arrow-down').click(function(){
      var wishList = currentWishList();
      var indexOf = wishList.indexOf(thisId);
      if(indexOf >= 0 && indexOf < (wishList.length - 1)){
        wishList[indexOf] = wishList[indexOf + 1];
        wishList[indexOf + 1] = thisId;
        buildWishList(wishList);
      }
    });
    list.append(newRow);
  });
  hideShowDraftButtons();
  $.ajax({
    type: "POST",
    url: '/wishlist',
    data: JSON.stringify(currentWishList()),
    dataType: "json",
    contentType: "application/json"
  });
}

function currentWishList(){
  return $('#player-list tr').map(function(){ return $(this).data('id'); }).toArray();
}

function updatePlayerAutoComplete(){
  var drafted = draftedPlayers();
  var undrafted = _.filter(playerData, function(player, id){
    return !_.contains(drafted, id);
  });
  $('#player-search').unautocomplete().autocomplete(_.map(undrafted, playerText), {matchContains : true, max : 20});
  $('#player-search').result(function(){
    var thisId = idFromName($(this).val());
    buildWishList(_.uniq(currentWishList().concat(thisId)));
    $(this).val('');
  });
}

$(document).ready(function(){
  ws = new ReconnectingWebSocket('wss://' + window.location.hostname + ':5679');
  ws.onmessage = handleMessage;

  $('#chat-text').keypress(function (e){
    if(e.keyCode.toString() == 13) {
      send(ws, $(this).val());
      $(this).val('');
    }
  });

  $.getJSON('/userInfo', function(result){
    userData = result;
    if(_.keys(userData).length > 0){
      $('.log-in').hide();
      $('.hide').removeClass('hide');
      $.get('/data/chat', function(chatMessages){
        _.each(_.without(chatMessages.split('\n'), ''), function(message){
          addMessageToChat(JSON.parse(message));
        });
      });
      $.getJSON('/data/players', function(players){
        playerData = players;
        $.getJSON('/data/teams', function(teams){
          teamData = teams;
          $.getJSON('/standings', [], function(standings){
            _.each(standings, function(t, i){ 
              var players = _.map(t.players, function(player){
                var playerGames = _.filter(player.stats, s => shouldAddGame(player, s));
                return {games: _.map(playerGames, pointsForGame)};
              });
              teamData[i].score = teamTotal(players);
            });
            setTeam();
            addRowsToTeamTable();
            hideShowDraftButtons();
            updatePlayerAutoComplete()
            $.getJSON('/wishlist', buildWishList);
          });
        });
      });
    }
  });

  $(window).resize(function(){scrollChat(true);});
  setInterval(function(){
    var lastVal = parseInt($('.timer').text(),10);
    $('.timer').text(lastVal + 1);
  }, 1000);

});