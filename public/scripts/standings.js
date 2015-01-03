function standingsOnLoad(){
  setupHideShowClickHandler();
  if(window.location.pathname === '/'){
    showDraftLinkToUsers();
    loadStandings();
    setInterval(loadStandings, 1000 * 60);
  } else {
    var year = _.last(window.location.pathname.split('/'));
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
    $('.updated').text("Last Updated at: " + (d.getMonth() + 1) + '/' + d.getDate() + '/2012 ' + 
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
  var total = 0;
  var games = 0;
  var teamPlayers = $('#templates .players').clone();

  _.each(sortByPoints(_.map(team.players, buildPlayer)), function(player, i){
    teamPlayers.append(player.html);
    if(i < 8){
      total += player.points;
      games += player.html.find('.player-game.details').length;
    } else {
      player.html.addClass('not-countable');
    }
  });

  var projected = ((total / games) * 18 * 8).toPrecision(4);
  var teamContainer = $('#templates .team-container').clone();
  teamContainer.find('.team-title').text(team.team);
  teamContainer.find('.team-total').text(total);
  teamContainer.append(teamPlayers);
  teamContainer.find('.team.row-fluid').hover(function(){
    $(this).find('.team-title').text(team.name);
    $(this).find('.team-total').text(projected);
  }, function(){
    $(this).find('.team-title').text(team.team);
    $(this).find('.team-total').text(total);
  });

  return {html: teamContainer, points : total};
}

function dateStringFromGameId(gameId){
  var dateOfGame = gameId.split('-').last().slice(0,8);
  return dateOfGame.slice(0,4) + "/" + dateOfGame.slice(4,6) + "/" + dateOfGame.slice(6,8);
}

function buildPlayer(player, index){
  var total = 0;
  var playerContainer = $('#templates .player-container').clone();

  var gameNum = 0;
  _.each(player.stats, function(stats, gameId){
    gameNum += 1;
    var playerGame = $('#templates .player-game.details').clone();
    var gameTotal = stats.points + stats.rebounds + stats.steals + stats.assists + stats.blocks + stats.threes;
    playerGame.find('.game-link').append($('<a>').attr('href',"http://sports.yahoo.com/ncaab" + gameId).text(dateStringFromGameId(gameId)));
    playerGame.find('.game-total').text(gameTotal);
    _.each(stats, function(value, stat){
      playerGame.find('.' + stat).text(value);
    });
    playerContainer.find('.player-games').append(playerGame);
    total += gameTotal
  });

  var round = index + 1;
  playerContainer.find('.player-round').text(round);
  playerContainer.find('.player-total').text(total);
  playerContainer.find('.player-name .name').data('round',round).text(player.name).hover(function(){
    $(this).text(player.team);
  }, function(){
    $(this).text(player.name);
  });
  if(player.current == true){
    playerContainer.addClass('current');
  }

  return {html : playerContainer, points : total, current: player.current};
}
