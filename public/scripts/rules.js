function sortedGameScores(players){
  return _.sortBy(_.flatten(_.pluck(players, 'games')), function(g){ return -g;});
}

function best16perPlayer(players){
  return _.flatten(_.map(players, player => {
      var gamesToCount = 16;
      if(player.player.waived || player.player.pickup){
          gamesToCount = 8;
      }
      return _.sortBy(player.games, g => -g).slice(0, gamesToCount);
  }));
}

function teamTotal(players){
  var year = historicYear();
  if(currentYear()){
    return sortedGameScores(players).slice(0,144).sum().toFixed(1);
  } else if(year === '2021'){
    return best16perPlayer(players).sum().toFixed(1);
  } else if(year === '2018'){
    return sortedGameScores(players).slice(0,128).sum().toFixed(1);
  } else if(year === '2016' || year === '2017' || year === '2019' || year === '2020' || year === '2022' || year === '2023'){
    return sortedGameScores(players).slice(0,144).sum().toFixed(1);
  } else if(year === '2015'){
    return _.pluck(players.slice(0,8), 'points').sum();
  }
}

function projectedTeamInfo(total, players){
  var year = historicYear();
  var games = sortedGameScores(players);
  if(currentYear()){
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

function multiplierFor2024(stats, captain, superCaptain, name){
  var dateOfGame = stats.boxscore.split('-').last().slice(0,8);
  var gameDate  = dateOfGame.slice(0,4) + "-" + dateOfGame.slice(4,6) + "-" + dateOfGame.slice(6,8);
  var multiplier = 1;
  if(dateOfGame > "20240311"){
      multiplier = 1.5;
  }
  if(captain && captain == gameDate){
      multiplier *= 2;
  }
  if(superCaptain && superCaptain == gameDate){
      multiplier *= 3;
  }

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
    multiplier *= 1.5
  } else if (overEight == 2){
    multiplier *= 1.2
  }

  if(stats.fts_attempted >= 4){
    var percent = (stats.fts / stats.fts_attempted);
    if(percent < 0.3){
      multiplier = 0;
    } else if (percent < 0.5 ) {
      multiplier *= 0.7;
    } else if (percent > 0.9 ) {
      multiplier *= 1.5;
    } else if (percent > 0.8 ) {
      multiplier *= 1.2;
    }
  }

  if(stats.turnovers >= 6){
    multiplier = 0;
  } else if (stats.turnovers == 5){
    multiplier *= 0.4;
  } else if (stats.turnovers == 4){
    multiplier *= 0.7;
  }

  if(stats.threes_attempted >= 4){
    var percent = (stats.threes / stats.threes_attempted);
    if(percent < 0.15){
      multiplier *= 0.5;
    } else if (percent < 0.25 ) {
      multiplier *= 0.75;
    } else if (percent > 0.75 ) {
      multiplier *= 2;
    } else if (percent > 0.5 ) {
      multiplier *= 1.5;
    }
  }
  if(name === "Zach Edey"){
      multiplier = Math.max(1.0, multiplier);
  }
  return multiplier;
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

function multiplierFor2023(stats, captain, superCaptain){
  var dateOfGame = stats.boxscore.split('-').last().slice(0,8);
  var gameDate  = dateOfGame.slice(0,4) + "-" + dateOfGame.slice(4,6) + "-" + dateOfGame.slice(6,8);
  var multiplier = 1;
  if(captain && captain == gameDate){
      multiplier *= 2;
  }
  if(superCaptain && superCaptain == gameDate){
      multiplier *= 3;
  }

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
    multiplier *= 1.5
  } else if (overEight == 2){
    multiplier *= 1.2
  }

  if(stats.fts_attempted >= 4){
    var percent = (stats.fts / stats.fts_attempted);
    if(percent < 0.3){
      multiplier = 0;
    } else if (percent < 0.5 ) {
      multiplier *= 0.7;
    } else if (percent > 0.9 ) {
      multiplier *= 1.5;
    } else if (percent > 0.8 ) {
      multiplier *= 1.2;
    }
  }

  if(stats.turnovers >= 6){
    multiplier = 0;
  } else if (stats.turnovers == 5){
    multiplier *= 0.4;
  } else if (stats.turnovers == 4){
    multiplier *= 0.7;
  }

  if(stats.threes_attempted >= 4){
    var percent = (stats.threes / stats.threes_attempted);
    if(percent < 0.15){
      multiplier *= 0.5;
    } else if (percent < 0.25 ) {
      multiplier *= 0.75;
    } else if (percent > 0.75 ) {
      multiplier *= 2;
    } else if (percent > 0.5 ) {
      multiplier *= 1.5;
    }
  }
  return multiplier;
}

function multiplierFor2022(stats, captain){
  var dateOfGame = stats.boxscore.split('-').last().slice(0,8);
  var gameDate  = dateOfGame.slice(0,4) + "-" + dateOfGame.slice(4,6) + "-" + dateOfGame.slice(6,8);
  var multiplier = 1;
  if(captain && captain == gameDate){
      multiplier *= 2;
  }

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
    multiplier *= 1.5
  } else if (overEight == 2){
    multiplier *= 1.2
  }

  if(stats.fts_attempted >= 4){
    var percent = (stats.fts / stats.fts_attempted);
    if(percent < 0.3){
      multiplier = 0;
    } else if (percent < 0.5 ) {
      multiplier *= 0.7;
    } else if (percent > 0.9 ) {
      multiplier *= 1.5;
    } else if (percent > 0.8 ) {
      multiplier *= 1.2;
    }
  }

  if(stats.turnovers >= 6){
    multiplier = 0;
  } else if (stats.turnovers == 5){
    multiplier *= 0.4;
  } else if (stats.turnovers == 4){
    multiplier *= 0.7;
  }

  if(stats.threes_attempted >= 4){
    var percent = (stats.threes / stats.threes_attempted);
    if(percent < 0.15){
      multiplier *= 0.5;
    } else if (percent < 0.25 ) {
      multiplier *= 0.75;
    } else if (percent > 0.75 ) {
      multiplier *= 2;
    } else if (percent > 0.5 ) {
      multiplier *= 1.5;
    }
  }
  return multiplier;
}

function multiplierFor2021(stats){
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
    multiplier *= 1.5
  } else if (overEight == 2){
    multiplier *= 1.2
  }

  if(stats.fts_attempted >= 4){
    var percent = (stats.fts / stats.fts_attempted);
    if(percent < 0.3){
      multiplier = 0;
    } else if (percent < 0.5 ) {
      multiplier *= 0.7;
    } else if (percent > 0.9 ) {
      multiplier *= 1.5;
    } else if (percent > 0.8 ) {
      multiplier *= 1.2;
    }
  }

  if(stats.turnovers >= 6){
    multiplier = 0;
  } else if (stats.turnovers == 5){
    multiplier *= 0.4;
  } else if (stats.turnovers == 4){
    multiplier *= 0.7;
  }

  if(stats.threes_attempted >= 3){
    var percent = (stats.threes / stats.threes_attempted);
    if(percent < 0.15){
      multiplier *= 0.5;
    } else if (percent < 0.25 ) {
      multiplier *= 0.75;
    } else if (percent > 0.75 ) {
      multiplier *= 2;
    } else if (percent > 0.5 ) {
      multiplier *= 1.5;
    }
  }
  return multiplier;
}

function multiplierFor2020(stats){
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
    multiplier *= 1.5
  } else if (overEight == 2){
    multiplier *= 1.2
  }

  if(stats.fts_attempted >= 4){
    var percent = (stats.fts / stats.fts_attempted);
    if(percent < 0.3){
      multiplier = 0;
    } else if (percent < 0.5 ) {
      multiplier *= 0.7;
    } else if (percent > 0.9 ) {
      multiplier *= 1.5;
    } else if (percent > 0.8 ) {
      multiplier *= 1.2;
    }
  }

  if(stats.turnovers >= 6){
    multiplier = 0;
  } else if (stats.turnovers == 5){
    multiplier *= 0.4;
  } else if (stats.turnovers == 4){
    multiplier *= 0.7;
  }

  if(stats.threes_attempted >= 3){
    var percent = (stats.threes / stats.threes_attempted);
    if(percent < 0.15){
      multiplier *= 0.5;
    } else if (percent < 0.25 ) {
      multiplier *= 0.75;
    } else if (percent > 0.75 ) {
      multiplier *= 1.5;
    } else if (percent > 0.5 ) {
      multiplier *= 1.25;
    }
  }
  return multiplier;
}

function multiplierForGame(stats, captain, superCaptain, name){
  if(currentYear()){
    return multiplierFor2024(stats, captain, superCaptain, name);
  } else if(historicYear() === '2023'){
    return multiplierFor2023(stats, captain, superCaptain);
  } else if(historicYear() === '2022'){
    return multiplierFor2022(stats, captain);
  } else if(historicYear() === '2021'){
    return multiplierFor2021(stats);
  } else if(historicYear() === '2020'){
    return multiplierFor2020(stats);
  } else if(historicYear() === '2019'){
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
function pointsForGame(stats, captain, superCaptain, name){
  return (basePointsForGame(stats) * multiplierForGame(stats, captain, superCaptain, name)) || 0;
}

function dateFromGameId(gameId){
  return gameId.split('-').last().slice(0,8);
}

function dateStringFromGameId(gameId){
  var dateOfGame = dateFromGameId(gameId);
  return dateOfGame.slice(0,4) + "/" + dateOfGame.slice(4,6) + "/" + dateOfGame.slice(6,8);
}

function shouldAddGame(player, stats, gameIndex){
  var year = historicYear();
  if(year === "2016" || year === "2015"){
    return true;
  }
  var dateOfGame = dateStringFromGameId(stats.boxscore).replace(/\//g, '');
  if(currentYear()){
      if(player.team.match(/Illinois/) || player.team.match(/Northwestern/) || player.team.match(/Wisconsin/) || player.team.match(/Rutgers/)){
          if(gameIndex == 0){
              return false;
          }
      }
  }
  if(year == '2023'){
      if(player.team.match(/Ohio State/) || player.team.match(/Michigan W/) || player.team.match(/Iowa/) || player.team.match(/Northwestern/)){
          if(gameIndex == 0){
              return false;
          }
      }
  }

  if(year == "2022"){
      if(player.team.match(/Maryland/) || player.team.match(/Northwestern/)){
          if(gameIndex == 0){
              return false;
          }
      }
  }

  if(player.waived || player.pickup){
    var waiveDate = "";
    if(historicYear() === "2023"){
        if(player.team.match(/Ohio State/) || player.team.match(/Michigan W/) || player.team.match(/Iowa/) || player.team.match(/Northwestern/)){
            return (player.waived && gameIndex <= 9) || (player.pickup && gameIndex > 9);
        } else {
            return (player.waived && gameIndex <= 8) || (player.pickup && gameIndex > 8);
        }
    }
    if(historicYear() === "2022"){
        if(player.team.match(/Maryland/) || player.team.match(/Northwestern/)){
            return (player.waived && gameIndex <= 9) || (player.pickup && gameIndex > 9);
        } else {
            return (player.waived && gameIndex <= 8) || (player.pickup && gameIndex > 8);
        }
    }
    if(historicYear() === "2021"){
      return (player.waived && gameIndex <= 9) || (player.pickup && gameIndex > 9);
    }
    if(historicYear() === "2020"){
      waiveDate = "20200203";
      if(player.team.match(/Maryland/) || player.team.match(/Michigan/) || player.team.match(/Ohio State/) || player.team.match(/Penn State/)){
        waiveDate = "20200205";
      }
    }

    if(historicYear() === "2019"){
      waiveDate = "20190204";
      if(player.team.match(/Maryland/)){
        waiveDate = "20190131";
      }
      if(player.team.match(/Ohio/)){
        waiveDate = "20190207";
      }
      if( (player.waived && dateOfGame <= waiveDate) || (player.pickup && dateOfGame > waiveDate)) {
        return true;
      } else {
        return false;
      }
    }

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

    if( (player.waived && dateOfGame < waiveDate) ||
       (player.pickup && dateOfGame > waiveDate)) {
      return true;
    }
  } else {
    return true;
  }
}
