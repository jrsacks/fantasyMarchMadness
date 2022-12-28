var team = parseInt(window.location.search.split('?')[1], 10);

var userData = {};
var playerData = {};
var standingsData = {};
var teamData = []

function setTeam() {
  var email = userData.email;
  var teamMatch = _.find(teamData, function(teamObj){
    return teamObj.email === email;
  });
  if(teamMatch){
    team = teamMatch.id
  }
}

function playerText(player){
  return player.name + ' (' + player.team + ')';
}

function showTeam(){
    var teamInfo = _.find(teamData, function(teamObj){
        return teamObj.id === team;
    });
    _.each(teamInfo.players, function(playerId){
        var playerInfo = playerData[playerId];
        var player = $('.player.template').clone().removeClass('template');
        player.find('.name').text(playerText(playerInfo));
        player.find('.regular').val(playerInfo.captain || "2023-03-06");
        player.find('.super').val(playerInfo.superCaptain || "2023-03-06");
        player.find('input').change(() => {
            player.find("button").removeClass("btn-success");
        });
        player.find('button').click(() => {
            function valid(val, oldVal){
                var today = new Date().format("{yyyy}-{MM}-{dd}");
                if(val === oldVal){
                    return true;
                }
                if(val < today){
                    console.log('cannot add before today');
                    return false;
                }
                var gameToday = _.find(Object.keys(playerInfo.stats), gameId => {
                    return gameId.match(new Date().format("{yyyy}{MM}{dd}"));
                });
                if(gameToday && val === today){
                    console.log('cannot add today, already in progress');
                    return false;
                }
                if(oldVal < today || (gameToday && oldVal === today ) ){
                    console.log('cannot update, already been captain');
                    return false;
                }
                return true;
            }

            var captain = player.find('.regular').val();
            var superCaptain = player.find('.super').val();
            if(!valid(captain, playerInfo.captain) || !valid(superCaptain, playerInfo.superCaptain)){
                return;
            }

            var data = {
                team,
                timestamp: new Date().getTime(), 
                player : playerId,
                captain,
                superCaptain
            };
            $.ajax({
                type: "POST",
                url: '/updateCaptain',
                data: JSON.stringify(data),
                dataType: "json",
                contentType: "application/json",
            }).always(() => {
                player.find("button").addClass("btn-success");
            });
        });
        $('.players').append(player);
    });
}

$(document).ready(function(){
  $.getJSON('/userInfo', function(result){
    userData = result;
    if(_.keys(userData).length > 0){
      $('.log-in').hide();
      $('.hide').removeClass('hide');
      $.getJSON('/data/players', function(players){
        playerData = players;
        $.getJSON('/data/teams', function(teams){
          teamData = teams;
            if(!team){
                setTeam();
            }
            showTeam();
        });
      });
    }
  });
});
