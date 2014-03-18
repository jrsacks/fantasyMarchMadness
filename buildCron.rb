#!/usr/bin/env ruby

require 'nokogiri'
require 'open-uri'

tv = ["CBS","TBS","TNT","TRU"]
date = ARGV[0] || Time.now.to_s.split(' ').first
doc = Nokogiri::HTML(open("http://sports.yahoo.com/college-basketball/scoreboard/?conf=all&date=#{date}"))
doc.css(".game").each do |game|
  if tv.include? game.css('.tv').text
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
