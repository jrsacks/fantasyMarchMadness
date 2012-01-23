require 'json'

class Scoreboard
  def initialize
    @team_file = File.expand_path(File.join(File.dirname(__FILE__), '..', 'data', 'teams.json'))
    @player_file = File.expand_path(File.join(File.dirname(__FILE__), '..', 'data', 'players.json'))
    @teams = JSON.parse File.open(@team_file).read
    @players = JSON.parse File.open(@player_file).read
  end

  def standings
    #FIXME cache this?  may not matter
    @teams.map do |team|
      players = team["players"].map { |id| @players[id] }
      {"team" => team["team"], "players" => players}
    end
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
    File.open(@team_file).puts @teams.to_json
  end

  def add_players(new_players)
    new_players.each do |player|
      full_player_info = {player[:id] => {"name" => player[:name], "team" => player[:team], "points" => {}, "alive" => true}}
      @players.merge! full_player_info
    end
    File.open(@player_file).puts @players.to_json 
  end

  def new_id
    ids = @teams.map { |team| team["id"] }
    ids.max + 1
  end

  def find_loser(players)
    teams = Hash.new { |h,k| h[k] = 0 }
    players.each do |player|
      team = @players[player[:id]]["team"]
      teams[team] += player[:points]
    end
    teams.key(teams.values.min)
  end

  def kill_players(players)
    loser = find_loser(players)

    players.each do |player|
      team = @players[player[:id]]["team"]
      @players[player[:id]]["alive"] = false if team == loser
    end
  end

  def update_game(game_id, box_score)
    kill_players(box_score[:players]) if box_score[:final]
    box_score[:players].each do |player|
      @players[player[:id]]["points"].merge!({game_id => player[:points]})
    end
    File.open(@player_file).puts @players.to_json 
  end
end
