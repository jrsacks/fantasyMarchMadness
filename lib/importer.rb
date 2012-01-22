require 'nokogiri'
require 'open-uri'

class Importer
  def initialize
  end

  def game(id)
    box = {:final => false, :players => []}
    begin
      doc = Nokogiri::HTML(open("http://rivals.yahoo.com/ncaa/basketball/boxscore?gid=#{id}"))
      box[:final] = true if doc.css('#ysp-reg-box-line_score .final').length > 0
      doc.css('#ysp-reg-box-game_details-game_stats tbody tr').each do |p|
        idMatch = p.search('a').to_html.match(/[0-9]+/)[0]
        points = p.search('td').last.text.to_i
        box[:players] << {:id => idMatch, :points => points}
      end

    rescue => e
      puts "Caught exception finding points for game #{id}: #{e}"
    end
    box
  end

  def date(id)
    games = []
    begin
      doc = Nokogiri::HTML(open("http://rivals.yahoo.com/ncaa/basketball/scoreboard?d=#{id}"))
      doc.css('td a').each do |td|
        if td.text.include? 'Box Score'
          games << td['href'].match(/[^0-9]*([0-9]*).*/)[1]
        end
      end
    rescue => e
      puts "Caught exception finding games for date #{id}: #{e}"
    end

    games
  end

  def all_teams
    teams = []
    begin
      doc = Nokogiri::HTML(open("http://rivals.yahoo.com/ncaa/basketball/teams"))
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
      doc = Nokogiri::HTML(open("http://rivals.yahoo.com/ncaa/basketball/teams/#{abbrev}/roster"))
      teamname = doc.search("title").first.inner_html.split(' -').first
      doc.search("td a").each do |a|
        if a.to_html.match(/ncaab\/players\//)
          name = a.inner_html.split(', ').reverse.join(' ')
          id = a['href'].match(/[0-9]+/)[0]
          players << {:id => id, :name => name, :team => teamname}
        end
      end
    rescue => e
      puts "Caught exception finding all the players for #{abbrev}: #{e}"
    end
    players
  end
end

