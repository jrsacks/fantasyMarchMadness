function buildTeamPage(){
  $.getJSON('/data/players', [], function(players){
    var autocompleteData = _.map(players, playerText);

    $.getJSON('/data/teams', [], function(teams){
      var selector = $('<select>');
      selector.append($('<option>').text('Select team to edit:').attr('selected', true));

      _.each(teams, function(team){
        selector.append($('<option>').val(team.id).text(team.team));
      });

      selector.change(function(){
        var teamID = $(this).val();
        var team = _.find(teams, function(t){return t.id == teamID;});
        displayTeam(team, players, autocompleteData);
      });

      $('body').append(selector);
      $('body').append($('<ul>').attr('id', 'team-form'));
    });
  });
}

function displayTeam(team, players, autoComplete){
  var form = $('#team-form');
  form.empty();
  form.append(teamName(team));

  _.each(team.players, function(id){
    form.append(playerInput(players[id], id, autoComplete));
  });
  
  form.append(addPlayerButton(autoComplete));
  form.append(saveTeamButton(team, players));
}

function playerText(player){
  return player.name + ' (' + player.team + ')';
}

function playerInput(player, id, autoComplete){
  var input = $('<input>').addClass('autocomplete player-id').val(playerText(player)).attr('pid', id);
  input.autocomplete(autoComplete, {matchContains : true, max : 20});
  return $('<li>').append(input);
}

function teamName(team){
  return $('<li>').append(
    $('<input>').attr('id', 'team-name').val(team.team));
}

function saveTeamButton(team, players){
  return $('<li>').append(
    $('<button>').text('Save Team').click(_.bind(postTeamData, this, team, players)));
}

function addPlayerButton(autoComplete){
  return $('<li>').append(
    $('<button>').text('Add Player').click(function(){
      var newInput = playerInput({name : '', team : ''}, '', autoComplete);
      newInput.find('input').val('');
      $(this).parent().before(newInput);
  }));
}

function postTeamData(team, players){
    var data = team;
    data.team = $('#team-name').val();
    data.players = _.compact(_.map($('.player-id'), function(elem){
      return _.find(_.keys(players), function(id){
        return playerText(players[id]) == $(elem).val();
      });
    }));
    $.post('team', JSON.stringify(data), function(){window.location.reload()});
}
