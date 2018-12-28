function sortedGameScores(players){
  return _.sortBy(_.flatten(_.pluck(players, 'games')), function(g){ return -g;});
}

function teamTotal(players){
  var year = historicYear();
  if(year === '2018'){
    return sortedGameScores(players).slice(0,128).sum().toFixed(1);
  } else if(currentYear() || year === '2016' || year === '2017'){
    return sortedGameScores(players).slice(0,144).sum().toFixed(1);
  } else if(year === '2015'){
    return _.pluck(players.slice(0,8), 'points').sum();
  }
}

function projectedTeamInfo(total, players){
  var year = historicYear();
  var games = sortedGameScores(players);
  if(currentYear() && games.length > 0){
    var n = 144;
    if(games.length < n) {
      var avg = (total / games.length).toFixed(1);
      return ' (' + games.length + ' - ' + avg + ')';
    } else {
      var avg = (total / n).toFixed(1);
      return ' (' + avg + ' - ' + games.slice(0,n).min().toFixed(1) + ')';
    }
  } else {
    var n = 144;
    if(year === '2018'){
      n = 128;
    }
    var min = (games.slice(0,n).min() || 0).toFixed(1);
    var avg = (total / n).toFixed(1);
    if(games.length < n){
      min = 0;
    }
    return ' (' + avg + ' - ' + min + ')';
  }
  return '';
}

function multiplierFor2018(stats){
  var multiplier = 1;

  if(stats.winner){
    multiplier *= 1.4
  }
  if(stats.fouls === 5){
    multiplier *= 0.7;
  }

  var overTen = _.filter([stats.points, stats.rebounds, stats.steals, stats.assists, stats.blocks, stats.threes], s => s >= 10).length;

  if(overTen > 2) {
    multiplier *= 2;
  } else if (overTen === 2){
    multiplier *= 1.1
  }

  if(stats.fts_attempted >= 10 && stats.fts === stats.fts_attempted){
    multiplier *= 1.2
  }

  if(stats.fts_attempted >= 5 && ((stats.fts / stats.fts_attempted) < 0.5)){
    multiplier *= 0.7
  }

  if(stats.turnovers >= 10){
    multiplier *= 0.5;
  }

  if(stats.threes_attempted >= 5 && stats.threes === stats.threes_attempted){
    multiplier *= 1.5
  }

  return multiplier;
}

function multiplierFor2019(stats){
  var multiplier = 1;

  if(stats.winner){
    multiplier *= 1.4
  }
  if(stats.fouls === 5){
    multiplier *= 0.7;
  }

  var overEight = _.filter([stats.points, stats.rebounds, stats.steals, stats.assists, stats.blocks, stats.threes], s => s >= 8).length;
  var overTen = _.filter([stats.points, stats.rebounds, stats.steals, stats.assists, stats.blocks, stats.threes], s => s >= 10).length;

  if(overEight > 2) {
    multiplier *= 2;
  } else if (overTen === 2){
    multiplier *= 1.2
  }

  if(stats.fts_attempted >= 7 && ( (stats.fts / stats.fts_attempted) >= 0.9)){
    multiplier *= 1.2
  }

  if(stats.fts_attempted >= 5 && ((stats.fts / stats.fts_attempted) < 0.5)){
    multiplier *= 0.7
  }

  if(stats.fts_attempted >= 5 && ( (stats.fts / stats.fts_attempted) < 0.3)){
    multiplier = 0;
  }


  if(stats.turnovers >= 6){
    multiplier *= 0.5;
  }

  if(stats.threes_attempted >= 4 && ( (stats.threes / stats.threes_attempted) >= 0.8)){
    multiplier *= 1.5
  }

  return multiplier;
}

function multiplierForGame(stats){
  if(currentYear()){
    return multiplierFor2019(stats);
  } else if(historicYear() === '2018'){
    return multiplierFor2018(stats);
  } else if(historicYear() === '2016' || historicYear() === '2017'){
    return stats.winner ? 1.4 : 1.0;
  } else {
    return 1;
  }
}

function basePointsForGame(stats){
  return (stats.points + stats.rebounds + stats.steals + stats.assists + stats.blocks + stats.threes);
}
function pointsForGame(stats){
  return basePointsForGame(stats) * multiplierForGame(stats);
}

function dateFromGameId(gameId){
  return gameId.split('-').last().slice(0,8);
}

function dateStringFromGameId(gameId){
  var dateOfGame = dateFromGameId(gameId);
  return dateOfGame.slice(0,4) + "/" + dateOfGame.slice(4,6) + "/" + dateOfGame.slice(6,8);
}

function shouldAddGame(player, stats){
  if(player.waived || player.pickup){
    var waiveDate = "";

    if(historicYear() === "2018"){
      waiveDate = "20180129";
      if(player.team.match(/Nebraska/) || player.team.match(/Michigan/)){
        waiveDate = "20180126";
      }
      if(player.team.match(/Illinois/) || player.team.match(/Wisconsin/) || player.team.match(/Northwestern/)){
        waiveDate = "20180131";
      }
    }

    if(historicYear() === "2017"){
      waiveDate = "20170130";
      if(player.team.match(/Maryland/) || player.team.match(/Wisconsin/)){
        waiveDate = "20170201";
      }
    }

    var dateOfGame = dateStringFromGameId(stats.boxscore).replace(/\//g, '');
    if( (player.waived && dateOfGame < waiveDate) ||
       (player.pickup && dateOfGame > waiveDate)) {
      return true;
    }
  } else {
    return true;
  }
}
