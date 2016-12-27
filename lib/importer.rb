require 'nokogiri'
require 'open-uri'
require 'json'

class Importer
  def initialize
  end

  def game(url)
    box = {:final => false, :players => []}
    begin
      data = JSON.parse(open("https://api-secure.sports.yahoo.com/v1/editorial/s/boxscore/#{url}").read)
      box[:final] = true if data["service"]["boxscore"]["game"]["status_type"] === "status.type.final"
      data["service"]["boxscore"]["player_stats"].each do |k, val|
        points = val["ncaab.stat_variation.2"]["ncaab.stat_type.13"].to_i
        box[:players] << {:id => k.split('.').last, :points => points}
      end
    rescue => e
      puts "Caught exception finding points for game #{url}: #{e}"
    end
    box
  end

  def date(id)
    begin
      data = JSON.parse(open("https://api-secure.sports.yahoo.com/v1/editorial/s/scoreboard?leagues=ncaab&date=#{id}").read)
      return data["games"].keys
    rescue => e
      puts "Caught exception finding games for date #{id}: #{e}"
      return []
    end
  end

  def all_teams
    teams = []
    begin
      doc = Nokogiri::HTML(open("http://sports.yahoo.com/ncaa/basketball/teams"))
      doc.search("a").each do |line|
        if line.to_html.match(/ncaab\/teams\//)
          teams << line.to_html.match(/ncaab\/teams\/(.*)\"/)[1]
        end
      end
    rescue => e
      puts "Caught exception finding all the teams: #{e}"
    end
    teams
  end

  def players_on_team(abbrev)
    players = []
    begin
      id_data = JSON.parse(open("http://sports.yahoo.com/site/api/resource/sports.alias;expected_entity=team;id=%2Fncaab%2Fteams%2F#{abbrev}%2F").read)
      team_id = id_data["teamdefault_league"].keys.first
      data = JSON.parse(open("http://sports.yahoo.com/site/api/resource/sports.team.roster;id=#{team_id}").read)
      teamname = data["team"]["full_name"]
      data["players"].each do |k, val|
        players << {:id => k, :name => val["display_name"], :team => teamname}
      end
    rescue => e
      puts "Caught exception finding all the players for #{abbrev}: #{e}"
    end
    players
  end
end

