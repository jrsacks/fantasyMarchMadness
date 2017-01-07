$LOAD_PATH.unshift(File.dirname(__FILE__))
$LOAD_PATH.unshift(File.join(File.dirname(__FILE__), '..', 'lib'))
require 'scoreboard'

describe "Scoreboard" do 
  let (:teams) {[{'id' => 1, 'team' => "Jeff's Team", 'players' => ["12345"]}]}
  let (:teams_file) { double 'team file' }
  let (:players) { {"12345" => {"name" => "Novak", "team" => "michigan wolverines", "stats" => {"20120121" => {"points" => 15}}, "current" => false}} }
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
    scoreboard.standings.should == [{"team"=>"Jeff's Team", "players"=> [players["12345"]], 'name' => "Jeff's Team"}]
  end

  it "finds player info with waived data" do
    teams[0]["waived"] = ["12345"]
    teams_file.stub(:read).and_return teams.to_json
    scoreboard.standings[0]["players"][0]["waived"].should == true
  end

  it "finds player info with pickup data" do
    teams[0]["pickup"] = ["12345"]
    teams_file.stub(:read).and_return teams.to_json
    scoreboard.standings[0]["players"][0]["pickup"].should == true
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
    updated_players = players.merge({"12346" => {:name => "Eso Akunne", :team => "Michigan Wolverines", :stats => {}, :current => false}})
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
      @final = false
      add_player [{:id => "12346", :name => "D Rose", :team => "Memphis Tigers", :current => false},
        {:id => "12347", :name => "Other", :team => "Memphis Tigers", :current => false}]
      File.should_receive(:open).with(File.expand_path(File.join(File.dirname(__FILE__), '..', 'data', 'players.json')), 'w').and_yield players_file
    end

    after(:each) do 
      scoreboard.update_game("20120122", {:final => @final, :players => [{:id => "12345", :points => 22},
        {:id => "12346", :points => 20}]})
    end

    it "can update points" do 
      players_file.should_receive(:puts) do |player_data|
        data = JSON.parse(player_data)
        data["12345"]["stats"]["20120122"].should == {"id" => "12345", "points" => 22}
        data["12346"]["stats"]["20120122"].should == {"id" => "12346", "points" => 20}
      end
    end

    it "adds in winner status when the game is final" do
      @final = true
      players_file.should_receive(:puts) do |player_data|
        data = JSON.parse(player_data)
        data["12345"]["stats"]["20120122"].should == {"id" => "12345", "points" => 22, "winner" => true}
        data["12346"]["stats"]["20120122"].should == {"id" => "12346", "points" => 20}
      end
    end

    it "sets current to false when the game is final" do
      @final = true
      players_file.should_receive(:puts) do |player_data|
        data = JSON.parse(player_data)
        data["12345"]["current"].should == false
        data["12346"]["current"].should == false
      end
    end

    it "sets current to true when the game is final" do
      @final = false
      players_file.should_receive(:puts) do |player_data|
        data = JSON.parse(player_data)
        data["12345"]["current"].should == true
        data["12346"]["current"].should == true
      end
    end
  end
end
