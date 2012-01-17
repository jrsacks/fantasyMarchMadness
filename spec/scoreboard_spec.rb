$LOAD_PATH.unshift(File.dirname(__FILE__))
$LOAD_PATH.unshift(File.join(File.dirname(__FILE__), '..', 'lib'))

require 'scoreboard'

describe "Scoreboard" do
  let (:scoreboard) { Scoreboard.new }
  before(:each) do 
    scoreboard.stub(:puts)
  end

  describe 'finding the points scored for all players in a game' do
    let (:gameId) { "201201160200" } 
    let (:url) { "http://rivals.yahoo.com/ncaa/basketball/boxscore?gid=#{gameId}" }

    describe 'finding out if a game is fine' do
      it 'can find a game that is final' do
        scoreboard.stub(:open).with(url).and_return('<div id="ysp-reg-box-line_score"><span class="final">Final</span></div>')
        scoreboard.game(gameId)[:final].should == true
      end

      it 'can find a game that is not final' do
        scoreboard.stub(:open).with(url).and_return('')
        scoreboard.game(gameId)[:final].should == false
      end
    end

    it "finds the points for each player" do 
      scoreboard.stub(:open).with(url).and_return('<div id="ysp-reg-box-game_details-game_stats"><tbody><tr class="odd">
                                                  <td class="player title"> <a href="/ncaab/players/12345">J. Bowman</a></td>
                                                  <td>36</td>
                                                  <td>9-18</td>
                                                  <td>3-5</td>
                                                  <td>1-3</td>
                                                  <td>1</td>
                                                  <td>4</td>
                                                  <td>8</td>
                                                  <td>1</td>
                                                  <td>1</td>
                                                  <td>0</td>
                                                  <td>4</td>
                                                  <td>22</td>
                                                  </tr></tbody></div>') 
      scoreboard.game(gameId)[:players].should == [{:id => 12345, :points => 22}]
    end

    it "handles errors and returns empty array" do
      scoreboard.stub(:open).and_raise "Exception"
      scoreboard.game(gameId).should == {:final => false, :players => []}
    end
  end

  describe 'finding boxscore ids' do
    it "finds all boxscore ids for a given date" do 
      scoreboard.should_receive(:open).with('http://rivals.yahoo.com/ncaa/basketball/scoreboard?d=2012-01-16')
        .and_return('<td><a href="/ncaab/boxscore?gid=201201160200" class="yspmore">Box Score</a></td>')
      scoreboard.date('2012-01-16').should == ["201201160200"]
    end
    
    it "handles errors and returns empty array" do
      scoreboard.stub(:open).and_raise "Exception"
      scoreboard.date('2012-01-16').should == []
    end
  end

  describe 'finding all the teams' do
    it 'finds all team abbreviations' do
      scoreboard.should_receive(:open).with('http://rivals.yahoo.com/ncaa/basketball/teams')
        .and_return('<a href="/ncaab/teams/aca">Albany</a>')
      scoreboard.all_teams.should == ['aca']
    end

    it "handles errors and returns empty array" do
      scoreboard.stub(:open).and_raise "Exception"
      scoreboard.all_teams.should == []
    end
  end

  describe 'finding all the players on a team' do
    it 'finds all players for abbreviations' do
      scoreboard.should_receive(:open).with('http://rivals.yahoo.com/ncaa/basketball/teams/max/roster')
        .and_return('<title>Michigan Wolverines - Roster</title><td><a href="/ncaab/players/12345">Akunne, Eso</a></td>')
      scoreboard.players_on_team('max').should == [{:id => 12345, :name => "Eso Akunne", :team => "Michigan Wolverines"}]
    end

    it "handles errors and returns empty array" do
      scoreboard.stub(:open).and_raise "Exception"
      scoreboard.players_on_team('max').should == []
    end
  end 
end
