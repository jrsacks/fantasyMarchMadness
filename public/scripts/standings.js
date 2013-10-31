function standingsOnLoad(){
  setupHideShowClickHandler();
  addHistoryLinks();
  if(window.location.pathname === '/'){
    showDraftLinkToUsers();
    loadStandings();
    setInterval(loadStandings, 1000 * 60);
  } else {
    var year = _.last(window.location.pathname.split('/'));
    loadStandings(year);
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
  });
}

function setupHideShowClickHandler(){
  $('.hideshow').click(function(){
    if($(this).text() == 'Hide Players'){
      $(this).text('Show Players');
      $('.players').hide();
    }
    else {
      $(this).text('Hide Players');
      $('.players').show();
    }
  });
}

function showDraftLinkToUsers() {
  $.getJSON('/userInfo', function(result){
    result;
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
    if($('.hideshow').text() == 'Show Players'){
      $('.players').hide();
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
  var teamPlayers = $('#templates .players').clone();
  var numAlive = 0;
  var numCurrent = 0;

  _.each(sortByPoints(_.map(team.players, buildPlayer)), function(player){
    if(player.alive){ numAlive = numAlive + 1; }
    if(player.current){ numCurrent = numCurrent + 1; }
    teamPlayers.append(player.html);
    total += player.points;
  });

  var teamContainer = $('#templates .team-container').clone();
  teamContainer.find('.badge-success').text(numAlive);
  teamContainer.find('.badge-warning').text(numCurrent);
  teamContainer.find('.badge-important').text((10 - numAlive));
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

  return {html : playerRow, points : total, alive: player.alive, current: player.current};
}
