function loadStandings(){
  $.getJSON('/standings', [], function(teams){
    $('.teams').empty();
    _.each(sortByPoints(_.map(teams, buildTeam)), function(team){
      $('.teams').append(team.html);
    });
    var d = new Date();
    var hour = d.getHours();
    var ampm = 'AM';
    if(hour >= 12){
      hour = hour - 12;
      ampm = 'PM'
    }
    $('.updated').text("Last Updated at: " + (d.getMonth() + 1) + '/' + d.getDate() + '/2012 ' + 
                      hour + ':' + twoDigit(d.getMinutes()) + ':' + twoDigit(d.getSeconds()) + ' ' + ampm);
  });
}

function twoDigit(val){
  if(val < 10){
    return '0' + val;
  }
  return val;
}

function sortByPoints(arr){
  return _.sortBy(arr, function(value){
    return -value.points;
  })
}

function buildTeam(team){
  var total = 0;
  var teamPlayers = $('#templates .players').clone();

  _.each(sortByPoints(_.map(team.players, buildPlayer)), function(player){
    teamPlayers.append(player.html);
    total += player.points;
  });

  var teamContainer = $('#templates .team-container').clone();
  teamContainer.find('.team-title').text(team.team);
  teamContainer.find('.team-total').text(total);
  teamContainer.append(teamPlayers);

  return {html: teamContainer, points : total};
}

function buildPlayer(player){
  var total = 0;
  var playerRow = $('#templates .player').clone();

  var gameNum = 0;
  _.each(player.points, function(points, gameId){
    total += points;
    playerRow.find('.game' + gameNum).append($('<a>').attr('href',"http://rivals.yahoo.com/ncaa/basketball/boxscore?gid=" + gameId).text(points));
    gameNum += 1;
  });

  playerRow.find('.player-total').text(total);
  playerRow.find('.player-name').text(player.name).hover(function(){
    $(this).text(player.team);
  }, function(){
    $(this).text(player.name);
  });

  if(player.alive == false){
    playerRow.addClass('lost');
  }
  if(player.current == true){
    playerRow.addClass('current');
  }

  return {html : playerRow, points : total};
}
