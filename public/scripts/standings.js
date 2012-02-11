function loadStandings(){
  $.getJSON('/standings', [], function(teams){
    _.each(teams, function(team){
      var teamTotal = 0;
      var ulTeam = $('<ul>').addClass('team');
      var teamPlayers = $('<ul>').addClass('players');
      ulTeam.append($('<li>').addClass('team-title').text(team.team));

      _.each(team.players, function(player){
        var liPlayer = $('<li>').addClass('player').text(player.name);
        var ulPlayerPoints = $('<ul>').addClass('player-points');
        var total = 0;

        _.each(player.points, function(points, gameId){
          total += points;
          ulPlayerPoints.append($('<li>').addClass('player-point').text(points));
        });

        ulPlayerPoints.append($('<li>').addClass('player-total').text(total));
        liPlayer.append(ulPlayerPoints);
        teamPlayers.append(liPlayer);
        teamTotal += total;
      });

      ulTeam.append($('<li>').addClass('team-total').text(teamTotal));
      ulTeam.append(teamPlayers);
      $('.teams').append(ulTeam);
    });
  });
}
