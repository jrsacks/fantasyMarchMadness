require 'json'
require 'set'

class Scoreboard
  attr_reader :teams, :players

  def initialize(path='data')
    @team_file = File.expand_path(File.join(File.dirname(__FILE__), '..', path, 'teams.json'))
    @player_file = File.expand_path(File.join(File.dirname(__FILE__), '..', path, 'players.json'))
    @teams = JSON.parse File.open(@team_file).read
    @players = JSON.parse File.open(@player_file).read
  end

  def standings
    #FIXME cache this?  may not matter
    @teams.map do |team|
      players = team["players"].map do |id| 
        p = @players[id] 
        p["waived"] = true if (team["waived"] || []).include?(id)
        p["pickup"] = true if (team["pickup"] || []).include?(id)
        p
      end
      {"team" => team["team"], "players" => players, "name" => team["name"] || team["team"]}
    end
  end
  
  def captain(player_id, date, super_date)
    @players[player_id]['captain'] = date
    @players[player_id]['superCaptain'] = super_date
    File.open(@player_file, 'w') { |f| f.puts @players.to_json  }
  end

  def new_team(team_data)
    if team_data["id"]
      @teams.each do |team|
        team.merge! team_data if team_data["id"] == team["id"]
      end
    else
      team_data["id"] = new_id
      @teams << team_data
    end
    File.open(@team_file, 'w') { |f| f.puts @teams.to_json  }
  end

  def new_player_on_team(team_id, player_id)
    @teams.each do |team|
      players = team['players']
      players << player_id if team["id"] == team_id
      team.merge!({'players' => players})
    end
    File.open(@team_file, 'w') { |f| f.puts @teams.to_json  }
  end

  def waive_player_on_team(team_id, player_id)
    @teams.each do |team|
      waived = team['waived'] || []
      waived << player_id if team["id"] == team_id
      team.merge!({'waived' => waived})
    end
    File.open(@team_file, 'w') { |f| f.puts @teams.to_json  }
  end

  def pickup_player_on_team(team_id, player_id)
    @teams.each do |team|
      pickup = team['pickup'] || []
      pickup << player_id if team["id"] == team_id
      team.merge!({'pickup' => pickup})
    end
    File.open(@team_file, 'w') { |f| f.puts @teams.to_json  }
  end

  def new_team_name(team_id, name)
    @teams.each do |team|
      team['team'] = name if team["id"] == team_id
    end
    File.open(@team_file, 'w') { |f| f.puts @teams.to_json  }
  end

  def add_players(new_players)
    new_players.each do |player|
      full_player_info = {player[:id] => {"name" => player[:name], "team" => player[:team], "stats" => {}, "current" => false}}
      @players.merge! full_player_info
    end
    File.open(@player_file, 'w') { |f| f.puts @players.to_json  }
  end

  def new_id
    ids = @teams.map { |team| team["id"] }
    (ids.max || 0)+ 1
  end
  
  def change_current(players)
    players.each do |player|
      if @players[player[:id]]
        @players[player[:id]]["current"] = false
      end
    end
  end

  def find_winner(players)
    teams = Hash.new { |h,k| h[k] = 0 }
    players.each do |player|
      if @players[player[:id]]
        team = @players[player[:id]]["team"]
        teams[team] += player[:points]
      end
    end
    teams.key(teams.values.max)
  end

  def update_game(game_id, box_score)
    winner = ''
    winner = find_winner(box_score[:players]) if box_score[:final]
    teams =  Set.new
    teams << winner
    boxscore = ""
    box_score[:players].each do |player|
      if @players[player[:id]]
        @players[player[:id]]["current"] = true
        player[:winner] = true if @players[player[:id]]["team"] == winner
        teams << @players[player[:id]]["team"]
        @players[player[:id]]["stats"].merge!({game_id => player})
        boxscore = player[:boxscore]
      end
    end
    @players.each do |id, player|
      if teams.include?(player["team"])
        unless player["stats"].has_key?(game_id)
          player["stats"][game_id] = {:boxscore => boxscore}
        end
      end
    end
    if box_score[:final]
      change_current box_score[:players]
    end
    File.open(@player_file, 'w') { |f| f.puts @players.to_json  }
  end
end
