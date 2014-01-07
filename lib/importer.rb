require 'nokogiri'
require 'open-uri'

class Importer
  def initialize
  end

  def game(url)
    box = {:final => false, :players => []}
    begin
      doc = Nokogiri::HTML(open("http://sports.yahoo.com/ncaab#{url}"))
      box[:final] = true if doc.css('.score.winner').length > 0
      doc.css('.data-container table tbody .athlete').each do |player|
        idMatch = player.css('a').attr('href').value.match(/[0-9]+/)[0]
        points = player.parent().css('.points-scored').text.to_i
        box[:players] << {:id => idMatch, :points => points}
      end

    rescue => e
      puts "Caught exception finding points for game #{url}: #{e}"
    end
    box
  end

  def date(id)
    games = []
    begin
      doc = Nokogiri::HTML(open("http://sports.yahoo.com/college-basketball/scoreboard?date=#{id}"))
      doc.css('.game').each do |game|
        games << game.attr('data-url').to_s
      end
    rescue => e
      puts "Caught exception finding games for date #{id}: #{e}"
    end

    games
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
      doc = Nokogiri::HTML(open("http://sports.yahoo.com/ncaab/teams/#{abbrev}/roster"))
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

