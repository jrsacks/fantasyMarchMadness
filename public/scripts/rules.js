function sortedGameScores(players){
  return _.sortBy(_.flatten(_.pluck(players, 'games')), function(g){ return -g;});
}

function teamTotal(players){
  var year = historicYear();
  if(currentYear()){
    return sortedGameScores(players).slice(0,128).sum().toFixed(1);
  } else if(year === '2016' || year === '2017'){
    return sortedGameScores(players).slice(0,144).sum().toFixed(1);
  } else if(year === '2015'){
    return _.pluck(players.slice(0,8), 'points').sum();
  }
}

function projectedTeamInfo(total, players){
  var year = historicYear();
  var games = sortedGameScores(players);
  var avg = (total / games.length).toFixed(1);
  if(currentYear() && games.length > 0){
    if(games.length < 128) {
      return ' (' + games.length + ' - ' + avg + ')';
    } else {
      return ' (' + avg + ' - ' + games.slice(0,128).min().toFixed(1) + ')';
    }
  }
  if(year === '2016' || year === '2017'){
    var min = (games.slice(0,144).min() || 0).toFixed(1);
    if(games.length < 144){
      min = 0;
    }
    return ' (' + avg + ' - ' + min + ')';
  }
  return '';
}

function multiplierForGame(stats){
  if(currentYear()){
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

    if(currentYear()){
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
