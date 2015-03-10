#!/usr/bin/env ruby

require 'nokogiri'
require 'open-uri'

tv = ["CBS","TBS","TNT","TRU"]
date = ARGV[0] || Time.now.to_s.split(' ').first
doc = Nokogiri::HTML(open("http://sports.yahoo.com/college-basketball/scoreboard/?conf=all&date=#{date}"))
games = doc.css(".game")
tv_games = games.select do |game|
  tv.include? game.css('.tv').text
end

tv_games.each do |game|
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

  #if num tables > 8, divide by 2 for all cron
  dividor = "/2" if tv_games.length > 8
  puts "#{min}-59#{dividor} #{hour} * * * curl localhost:4567/game/#{gid} #hts"
  puts "*#{dividor} #{hour+1}-#{hour + 2} * * * curl localhost:4567/game/#{gid} #hts"
  puts "0-#{min}#{dividor} #{(hour+3)%24} * * * curl localhost:4567/game/#{gid} #hts"
  puts "\n"
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
