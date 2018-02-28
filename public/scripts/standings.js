function standingsOnLoad(){
  setupHideShowClickHandler();
  addHistoryLinks();
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

function displayHistoryByTeam(){
  $.getJSON('/standings/historic', function(standings){
    var builtStandings = _.reduce(standings, function(memo, teams, year){
      memo[year] = sortByPoints(_.map(teams, function(team){
        return _.extend({name : team.name}, buildTeam(team));
      }));
      return memo;
    }, {});

    var teams = _.uniq(_.flatten(_.map(standings, function(s){ return _.pluck(s, 'name')}))).sort();
    _.each(teams, function(team){
      var teamContainer = $('#templates .history-container').clone();
      teamContainer.find('.history-name').text(team);

      _.each(builtStandings, function(standing, year){
        var thisTeam = _.find(standing, function(s){ return s.name === team;});
        if (thisTeam){
          var row = $("#templates .history.row").clone();
          var place = _.indexOf(standing, thisTeam) + 1;
          row.find('.history-year').text(year);
          row.find('.history-points').text(thisTeam.points);
          row.find('.history-place').text(place);
          teamContainer.append(row);
        }
      });

      var row = $("#templates .history.row").clone();
      row.find('.history-year').text("Avg:");
      var points = teamContainer.find('.history-points').map(function(){ return parseInt($(this).text(), 10);}).toArray();
      var place = teamContainer.find('.history-place').map(function(){ return parseInt($(this).text(), 10);}).toArray();
      row.find('.history-points').text(points.average().round(2));
      row.find('.history-place').text(place.average().round(2));
      teamContainer.append(row);

      $('.teams').append(teamContainer);
    });
  });
}

function addHistoryLinks(){
  $.getJSON('/data/years', function(years){
    _.each(years.sort().reverse(), function(year){
      $('.history-links').append(
        $('<li>').append(
          $('<a>').attr('href', '/history/' + year).text(year)));
    });
    $('.history-links').append($('<li>').addClass('divider')).append(
      $('<li>').append($('<a>').attr('href', '/history/Team').text('By Team')));
    if(window.location.pathname === '/history/Team'){
      $('.hideshow').hide();
      displayHistoryByTeam();
    }
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
  teamContainer.find('.team-alive').text(numAlive);
  teamContainer.find('.team-title').text(team.team);
  teamContainer.find('.badge-warning').text(numCurrent);
  teamContainer.find('.badge-important').text((10 - numAlive));
  teamContainer.find('.team-total').text(total);
  teamContainer.append(teamPlayers);
  teamContainer.find('.team.row').hover(function(){
    $(this).find('.team-title').text(team.name);
  }, function(){
    $(this).find('.team-title').text(team.team);
  });

  return {html: teamContainer, points : total};
}

function buildPlayer(player, index){
  var total = 0;
  var playerRow = $('#templates .player').clone();

  var gameNum = 0;
  _.each(player.points, function(points, gameId){
    total += points;
    playerRow.find('.game' + gameNum).append($('<a>').attr('href',"http://sports.yahoo.com/ncaab/" + gameId).text(points));
    gameNum += 1;
  });

  var round = index + 1;
  playerRow.find('.player-round').text(round);
  playerRow.find('.player-total').text(total);
  playerRow.find('.player-name .name').data('round',round).text(player.name).hover(function(){
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
