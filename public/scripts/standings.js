function currentYear(){
  return window.location.pathname === '/';
}

function historicYear() {
  return _.last(window.location.pathname.split('/'));
}

function teamTotal(players){
  if(currentYear()){
    return sortedGameScores(players).slice(0,144).sum().toFixed(1);
  } else {
    if(historicYear() === '2015'){
      return _.pluck(players.slice(0,8), 'points').sum();
    }
  }
}

function sortedGameScores(players){
  return _.sortBy(_.flatten(_.pluck(players, 'games')), function(g){ return -g;});
}

function projectedTeamInfo(total, players){
  if(currentYear()){
    var games = sortedGameScores(players);
    var avg = (total / games.length).toFixed(1);
    var min = games.slice(0,144).min().toFixed(1);
    if(games.length < 144){
      min = 0;
    }
    return ' (' + min + ')';
  }
  return '';
}

function pointsForGame(stats){
  var baseScore = (stats.points + stats.rebounds + stats.steals + stats.assists + stats.blocks + stats.threes)
  if(currentYear()){
    var multiplier = 1;
    if(stats.winner){
      multiplier = 1.4;
    }
    return (multiplier * baseScore);
  } else {
    if(historicYear() === '2015'){
      return baseScore;
    }
  }
}

function standingsOnLoad(){
  addHistoryLinks();
  setupHideShowClickHandler();
  if(currentYear()){
    showDraftLinkToUsers();
    loadStandings();
    setInterval(loadStandings, 1000 * 60);
  } else {
    var year = historicYear();
    if (year.match(/20/)){
      loadStandings(year);
    }
    $('.year').text(year);
    $('.updated').hide();
    $('.history-links').prepend(
      $('<li>').append(
        $('<a>').attr('href', '/').text('This Year')));
  }
}

function addHistoryLinks(){
  $.getJSON('/data/years', function(years){
    _.each(years.sort().reverse(), function(year){
      $('.history-links').append(
        $('<li>').append(
          $('<a>').attr('href', '/history/' + year).text(year)));
    });
    //$('.history-links').append($('<li>').addClass('divider')).append(
    //  $('<li>').append($('<a>').attr('href', '/history/Team').text('By Team')));
    if(window.location.pathname === '/history/Team'){
      $('.hideshow').hide();
      displayHistoryByTeam();
    }
  });
}

function setupHideShowClickHandler(){
  function setup(suffix, text, selector){
    $('.hideshow-' + suffix).click(function(){
      if($(this).text() == 'Hide ' + text){
        $(this).text('Show ' + text);
        $(selector).hide();
        $('.current .player-game:last-child').show();
      }
      else {
        $(this).text('Hide ' + text);
        $(selector).show();
      }
    });
  }
  setup('players','Players','.player-container');
  setup('games','Games','.player-game');
}

function showDraftLinkToUsers() {
  $.getJSON('/userInfo', function(result){
    if(_.keys(result).length > 0){
      $('.log-in form').hide();
      $('.log-in ul').show();
    }
  });
}

function loadStandings(year){
  var path = '/standings';
  if(year){
    path += '/' + year;
  }
  $.getJSON(path, [], function(teams){
    $('.teams').empty();
    _.each(sortByPoints(_.map(teams, buildTeam)), function(team){
      $('.teams').append(team.html);
    });
    var d = new Date();
    var hour = d.getHours();
    var ampm = 'AM';
    if (hour == 0){
      hour = 12;
    } else if (hour == 12){
      ampm = 'PM';
    }else if( hour > 12){
      hour = hour - 12
      ampm = 'PM';
    }
    $('.updated').text("Last Updated at: " + (d.getMonth() + 1) + '/' + d.getDate() + '/' + (d.getYear() + 1900) + ' ' + 
                      hour + ':' + twoDigit(d.getMinutes()) + ':' + twoDigit(d.getSeconds()) + ' ' + ampm);
    if($('.hideshow-players').text() == 'Show Players'){
      $('.player-container').hide();
    }
    if($('.hideshow-games').text() == 'Show Games'){
      $('.player-game').hide();
      $('.current .player-game:last-child').show();
    }
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
  var teamPlayers = $('#templates .players').clone();

  var sortedPlayers = sortByPoints(_.map(team.players, buildPlayer));
  _.each(sortedPlayers, function(player, i){
    teamPlayers.append(player.html);
  });

  var total = teamTotal(sortedPlayers);
  var teamContainer = $('#templates .team-container').clone();
  teamContainer.find('.team-title').text(team.team);
  teamContainer.find('.team-total').text(total + projectedTeamInfo(total, sortedPlayers));
  teamContainer.append(teamPlayers);
  teamContainer.find('.team.row-fluid').hover(function(){
    $(this).find('.team-title').text(team.name);
  }, function(){
    $(this).find('.team-title').text(team.team);
  });

  return {html: teamContainer, points : total};
}

function dateStringFromGameId(gameId){
  var dateOfGame = gameId.split('-').last().slice(0,8);
  return dateOfGame.slice(0,4) + "/" + dateOfGame.slice(4,6) + "/" + dateOfGame.slice(6,8);
}

function buildPlayer(player, index){
  var gameTotals = [];
  var total = 0;
  var playerContainer = $('#templates .player-container').clone();

  var gameNum = 0;
  _.each(player.stats, function(stats, gameId){
    gameNum += 1;
    var playerGame = $('#templates .player-game.details').clone();
    var gameTotal = pointsForGame(stats);
    playerGame.find('.game-link').append($('<a>').attr('href',"http://sports.yahoo.com/ncaab" + gameId).text(dateStringFromGameId(gameId)));
    playerGame.find('.game-total').text(gameTotal.toFixed(1));
    _.each(stats, function(value, stat){
      playerGame.find('.' + stat).text(value);
    });
    if(stats.winner){
      playerGame.addClass('winner');
    }
    playerContainer.find('.player-games').append(playerGame);
    total += gameTotal
    gameTotals.push(gameTotal);
  });

  var round = index + 1;
  playerContainer.find('.player-round').text(round);
  var numberOfGames = playerContainer.find('.details').length;
  var average = (total / (numberOfGames || 1)).toFixed(1);
  playerContainer.find('.player-total').text(total.toFixed(1) + " (" + average + ")");
  var nameText = player.name + " (" + numberOfGames + ")";
  playerContainer.find('.player-name .name').data('round',round).text(nameText).hover(function(){
    $(this).text(player.team);
  }, function(){
    $(this).text(nameText);
  });
  if(player.current == true){
    playerContainer.addClass('current');
  }

  return {html : playerContainer, points : total, current: player.current, games : gameTotals};
}
