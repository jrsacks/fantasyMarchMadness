$LOAD_PATH.unshift(File.dirname(__FILE__))
$LOAD_PATH.unshift(File.join(File.dirname(__FILE__), '..', 'lib'))

require 'importer'

describe "importer" do
  let (:importer) { Importer.new }
  before(:each) do 
    importer.stub(:puts)
  end

  describe 'finding the points scored for all players in a game' do
    let (:game_url) { "/ncaab/michigan-wolverines-florida-gators-201303310210/" } 
    let (:url) { "http://sports.yahoo.com/ncaab#{game_url}" }

    describe 'finding out if a game is fine' do
      it 'can find a game that is final' do
        importer.stub(:open).with(url).and_return('<span class="score winner">105</span>')
        importer.game(game_url)[:final].should == true
      end

      it 'can find a game that is not final' do
        importer.stub(:open).with(url).and_return('')
        importer.game(game_url)[:final].should == false
      end
    end

    it "finds the points for each player" do 
      importer.stub(:open).with(url).and_return('<div class="data-container"><table><tbody><tr><th class="athlete"><a href="/ncaab/players/122889/">Isaiah Reeves</a></th><td class="ncaab-stat-type-13 points-scored" title="Points Scored">6</td></tr></tbody></table></div>') 
      importer.game(game_url)[:players].should == [{:id => "122889", :points => 6, :threes => 0, :assists => 0, :rebounds => 0, :steals => 0, :blocks => 0}]
    end

    it "handles errors and returns empty array" do
      importer.stub(:open).and_raise "Exception"
      importer.game(game_url).should == {:final => false, :players => []}
    end
  end

  describe 'finding boxscore ids' do
    it "finds all boxscore ids for a given date" do 
      importer.should_receive(:open).with('http://sports.yahoo.com/college-basketball/scoreboard?date=2013-03-31')
        .and_return('<tr class="game" data-url="/ncaab/michigan-wolverines-florida-gators-201303310210/"></tr>')
      importer.date('2013-03-31').should == ["/ncaab/michigan-wolverines-florida-gators-201303310210/"]
    end
    
    it "handles errors and returns empty array" do
      importer.stub(:open).and_raise "Exception"
      importer.date('2012-01-16').should == []
    end
  end

  describe 'finding all the teams' do
    it 'finds all team abbreviations' do
      importer.should_receive(:open).with('http://sports.yahoo.com/ncaa/basketball/teams')
        .and_return('<a href="/ncaab/teams/aca">Albany</a>')
      importer.all_teams.should == ['aca']
    end

    it "handles errors and returns empty array" do
      importer.stub(:open).and_raise "Exception"
      importer.all_teams.should == []
    end
  end

  describe 'finding all the players on a team' do
    it 'finds all players for abbreviations' do
      importer.should_receive(:open).with('http://sports.yahoo.com/ncaab/teams/max/roster')
        .and_return('<title>Michigan Wolverines - Roster</title><td><a href="/ncaab/players/12345">Akunne, Eso</a></td>')
      importer.players_on_team('max').should == [{:id => "12345", :name => "Eso Akunne", :team => "Michigan Wolverines"}]
    end

    it "handles errors and returns empty array" do
      importer.stub(:open).and_raise "Exception"
      importer.players_on_team('max').should == []
    end
  end 
end
