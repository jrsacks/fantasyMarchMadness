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

  def new_id
    ids = @teams.map { |team| team["id"] }
    ids.max + 1
  end

  def update_game

  end
end
