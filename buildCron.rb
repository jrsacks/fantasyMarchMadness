#!/usr/bin/env ruby

require 'nokogiri'
require 'open-uri'

teams = [
  "illinois-fighting-illini",
  "indiana-hoosiers",
  "iowa-hawkeyes",
  "maryland-terrapins",
  "michigan-state-spartans",
  "michigan-wolverines",
  "minnesota-golden-gophers",
  "nebraska-cornhuskers",
  "northwestern-wildcats",
  "ohio-state-buckeyes",
  "penn-state-nittany-lions",
  "purdue-boilermakers",
  "rutgers-scarlet-knights",
  "wisconsin-badgers"
]

date = ARGV[0] || Time.now.to_s.split(' ').first
doc = Nokogiri::HTML(open("http://sports.yahoo.com/college-basketball/scoreboard/?conf=3&date=#{date}"))
doc.css(".game").each do |game|
  conf_teams = teams.select { |t| game.attr("data-url").match(t) }
  if conf_teams.length == 2
    time = game.css('.time').text
    gid = game.attr("data-url").gsub("/ncaab/","").gsub("/","")
    hour = 0
    min = 0
    splitup = time.split(' ').first.split(':')
    min = splitup.last 
    if time.match(/pm/i)
      if splitup.first.to_i == 12
        hour = 11 
      else
        hour = splitup.first.to_i + 11
      end
    else
      hour = splitup.first.to_i - 1
    end

    puts "#{min}-59 #{hour} * * * curl localhost:4567/game/#{gid}"
    puts "* #{hour+1}-#{hour + 2} * * * curl localhost:4567/game/#{gid}"
    puts "0-#{min} #{(hour+3)%24} * * * curl localhost:4567/game/#{gid}"
    puts "\n"
  end
end

#*    *    *    *    *  command to be executed
#┬    ┬    ┬    ┬    ┬
#│    │    │    │    │
#│    │    │    │    │
#│    │    │    │    └───── day of week (0 - 7) (0 or 7 are Sunday, or use names)
#│    │    │    └────────── month (1 - 12)
#│    │    └─────────────── day of month (1 - 31)
#│    └──────────────────── hour (0 - 23)
#└───────────────────────── min (0 - 59)
