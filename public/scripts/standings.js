function loadStandings(){
  $.getJSON('/standings', [], function(teams){
    $('.teams').empty();
    _.each(sortByPoints(_.map(teams, buildTeam)), function(team){
      $('.teams').append(team.html);
    });
    var d = new Date();
    var hour = d.getHours();
    if(hour > 12){
      hour = hour - 12;
    }
    $('.updated').text("Last Updated at: " + (d.getMonth() + 1) + '/' + d.getDate() + '/2012 ' + 
                      hour + ':' + d.getMinutes() + ':' + d.getSeconds());
  });
}

function sortByPoints(arr){
  return _.sortBy(arr, function(value){
    return -value.points;
  })
}

function buildTeam(team){
  var total = 0;
  var teamPlayers = $('<ul>').addClass('players');

  _.each(sortByPoints(_.map(team.players, buildPlayer)), function(player){
    teamPlayers.append(player.html);
    total += player.points;
  });

  var ulTeam = $('<ul>').addClass('team').
    append($('<li>').addClass('team-title').text(team.team)).
    append($('<li>').addClass('team-total').text(total)).
    append(teamPlayers);

  return {html: ulTeam, points : total};
}

function buildPlayer(player){
  var total = 0;
  var ulPlayerPoints = $('<ul>').addClass('player-points');

  _.each(player.points, function(points, gameId){
    total += points;
    ulPlayerPoints.append($('<li>').addClass('player-point').text(points));
  });

  ulPlayerPoints.append($('<li>').addClass('player-total').text(total));
  var liPlayer = $('<li>').addClass('player').text(player.name).
    append(ulPlayerPoints);

  if(player.alive == false){
    liPlayer.addClass('lost');
  }
  if(player.current == true){
    liPlayer.addClass('current');
  }

  return {html : liPlayer, points : total};
}
