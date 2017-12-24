function currentYear(){
  return window.location.pathname === '/' || historicYear() === '2018';
}

function historicYear() {
  return _.last(window.location.pathname.split('/'));
}

function standingsOnLoad(){
  setupHideShowClickHandler();
  if(currentYear()){
    loadStandings();
    setInterval(loadStandings, 1000 * 60);
    showDraftLinkToUsers();
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
  addHistoryLinks();
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
  setup('players','Players','.teams .player-container');
  setup('games','Games','.player-game');
  setup('undrafted','Undrafted','.undrafted-container .player-container');
}

function showDraftLinkToUsers() {
  $.getJSON('/userInfo', function(result){
    if(_.keys(result).length > 0){
      $('.log-in form').hide();
      $('.log-in ul').show();
      if(!currentYear()){
        $('.waiver').hide();
      }
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
      $('.teams .player-container').hide();
    }
    if($('.hideshow-games').text() == 'Show Games'){
      $('.player-game').hide();
      $('.current .player-game:last-child').show();
    }
    if(currentYear()){
      $.getJSON('/data/players', (players) => {
        var names = _.flatten(_.map(teams, (t) => _.map(t.players, 'name')));
        var undrafted = _.filter(players, (p) => names.indexOf(p.name) === -1);

        var players = $('#templates .players').clone();
        var sortedPlayers = sortByPoints(_.map(undrafted, (player, idx) => buildPlayer(player, -1)));
        _.each(sortedPlayers, function(player, i){
          players.append(player.html);
        });
        $('.undrafted-container').empty().append(players);
        if($('.hideshow-undrafted').text() == 'Show Undrafted'){
          $('.undrafted-container .player-container').hide();
        } else {
          $('.undrafted-container .player-container').show();
        }
      });
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

function dateFromGameId(gameId){
  return gameId.split('-').last().slice(0,8);
}

function dateStringFromGameId(gameId){
  var dateOfGame = dateFromGameId(gameId);
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
    if(stats.boxscore){
      playerGame.find('.game-link').append($('<a>').attr('href',"http://sports.yahoo.com" + stats.boxscore).text(dateStringFromGameId(stats.boxscore)));
    } else {
      playerGame.find('.game-link').append($('<a>').attr('href',"http://sports.yahoo.com/ncaab" + gameId).text(dateStringFromGameId(gameId)));
    }
    playerGame.find('.base').text(basePointsForGame(stats));
    playerGame.find('.multiplier').text(multiplierForGame(stats).toFixed(2));
    playerGame.find('.game-total').text(gameTotal.toFixed(1));
    _.each(stats, function(value, stat){
      playerGame.find('.' + stat).text(value);
    });
    if(stats.winner){
      playerGame.addClass('winner');
    }
    
    if(shouldAddGame(player, stats)){
      playerContainer.find('.player-games').append(playerGame)
      total += gameTotal
      gameTotals.push(gameTotal);
    }
  });

  var round = index + 1;
  if(player.waived) {
    round += 'w';
  }
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
  if(player.current == true && player.waived !== true){
    playerContainer.addClass('current');
  }

  return {html : playerContainer, points : total, current: player.current, games : gameTotals};
}
