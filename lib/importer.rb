require 'nokogiri'
require 'open-uri'
require 'json'

class Importer
  def game(url)
    box = {:final => false, :players => []}
    begin
      data = JSON.parse(open("https://api-secure.sports.yahoo.com/v1/editorial/s/boxscore/#{url}").read)
      box[:final] = true if data["service"]["boxscore"]["game"]["status_type"] === "status.type.final"
      boxscore = data["service"]["boxscore"]["game"]["navigation_links"]["boxscore"]["url"]
      data["service"]["boxscore"]["player_stats"].each do |k, val|
        stats = val["ncaab.stat_variation.2"]
        threes = stats["ncaab.stat_type.30"].split('-')
        free_throws = stats["ncaab.stat_type.29"].split('-')
        box[:players] << {
          :id => k,
          :points => stats["ncaab.stat_type.13"].to_i,
          :threes => threes[0],
          :threes_attempted => threes[1],
          :rebounds => stats["ncaab.stat_type.16"].to_i,
          :assists => stats["ncaab.stat_type.17"].to_i,
          :steals => stats["ncaab.stat_type.18"].to_i,
          :blocks => stats["ncaab.stat_type.19"].to_i,
          :turnovers => stats["ncaab.stat_type.20"].to_i,
          :fouls => stats["ncaab.stat_type.22"].to_i,
          :fts => free_throws[0],
          :fts_attempted => free_throws[1],
          :boxscore => boxscore
        }
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
      doc = Nokogiri::HTML(open("https://sports.yahoo.com/ncaa/basketball/teams"))
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
      id_data = JSON.parse(open("https://sports.yahoo.com/site/api/resource/sports.alias;expected_entity=team;id=%2Fncaab%2Fteams%2F#{abbrev}%2F").read)
      team_id = id_data["teamdefault_league"].keys.first
      data = JSON.parse(open("https://sports.yahoo.com/site/api/resource/sports.team.roster;id=#{team_id}").read)
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

