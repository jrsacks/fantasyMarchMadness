$LOAD_PATH.unshift(File.dirname(__FILE__))
$LOAD_PATH.unshift(File.join(File.dirname(__FILE__), '..', 'lib'))
require 'scoreboard'

describe "Scoreboard" do 
  let (:teams) {[{'id' => 1, 'team' => "Jeff's Team", 'players' => ["12345"]}]}
  let (:teams_file) { double 'team file' }
  let (:players) { {"12345" => {"name" => "Novak", "team" => "michigan wolverines", "points" => {"20120121" => 15}, "alive" => true}} }
  let (:players_file) { double 'players file' }
  let (:scoreboard) { Scoreboard.new}

  before(:each) do
    File.stub(:open).with(File.expand_path(File.join(File.dirname(__FILE__), '..', 'data', 'teams.json'))).and_return teams_file
    File.stub(:open).with(File.expand_path(File.join(File.dirname(__FILE__), '..', 'data', 'players.json'))).and_return players_file
    teams_file.stub(:read).and_return teams.to_json
    players_file.stub(:read).and_return players.to_json
  end

  describe "loading files" do 
    it "can load teams files" do
      File.should_receive(:open).with(File.expand_path(File.join(File.dirname(__FILE__), '..', 'data', 'teams.json'))).and_return teams_file
      teams_file.should_receive(:read).and_return teams.to_json
      scoreboard
    end

    it "can load players file" do
      File.should_receive(:open).with(File.expand_path(File.join(File.dirname(__FILE__), '..', 'data', 'players.json'))).and_return players_file
      players_file.should_receive(:read).and_return players.to_json
      scoreboard
    end
  end

  it "finds player info" do
    scoreboard.standings.should == [{"team"=>"Jeff's Team", "players"=> [players["12345"]] }]
  end

  it "can add a new team" do
    new_team = {"team" => "new team", "players" => []}
    new_team_with_id = new_team.merge({"id" => 2})
    both_teams = teams << (new_team_with_id)
    File.should_receive(:open).with(File.expand_path(File.join(File.dirname(__FILE__), '..', 'data', 'teams.json')), 'w').and_yield teams_file
    teams_file.should_receive(:puts).with both_teams.to_json
    scoreboard.new_team new_team
  end

  it "can update a team" do
    team = teams.first
    team["team"] = "changed name"
    updated_team = team

    File.should_receive(:open).with(File.expand_path(File.join(File.dirname(__FILE__), '..', 'data', 'teams.json')), 'w').and_yield teams_file
    teams_file.should_receive(:puts).with [updated_team].to_json
    scoreboard.new_team updated_team
  end

  it "can add a players" do
    new_players = [{:id => "12346", :name => "Eso Akunne", :team => "Michigan Wolverines"}]
    updated_players = players.merge({"12346" => {:name => "Eso Akunne", :team => "Michigan Wolverines", :points => {}, :alive => true}})
    File.should_receive(:open).with(File.expand_path(File.join(File.dirname(__FILE__), '..', 'data', 'players.json')), 'w').and_yield players_file
    players_file.should_receive(:puts).with updated_players.to_json
    scoreboard.add_players new_players
  end

  describe "updating a game" do
    def add_player(info)
      players_file.stub(:puts)
      File.stub(:open).with(File.expand_path(File.join(File.dirname(__FILE__), '..', 'data', 'players.json')), 'w').and_yield players_file
      scoreboard.add_players info
    end

    before(:each) do 
      add_player [{:id => "12346", :name => "D Rose", :team => "Memphis Tigers"}]
      File.should_receive(:open).with(File.expand_path(File.join(File.dirname(__FILE__), '..', 'data', 'players.json')), 'w').and_yield players_file
    end

    after(:each) do 
      scoreboard.update_game("20120122", {:final => true, :players => [{:id => "12345", :points => 22},
        {:id => "12346", :points => 20}]})
    end

    it "can update points" do 
      players_file.should_receive(:puts) do |player_data|
        data = JSON.parse(player_data)
        data["12345"]["points"]["20120122"].should == 22
        data["12346"]["points"]["20120122"].should == 20
      end
    end

    it "changes alive status" do
      players_file.should_receive(:puts) do |player_data|
        data = JSON.parse(player_data)
        data["12345"]["alive"].should == true
        data["12346"]["alive"].should == false
      end
    end
  end
end
