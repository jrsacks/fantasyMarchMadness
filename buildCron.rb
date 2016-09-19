#!/usr/bin/env ruby

require 'json'
require 'date'
require 'open-uri'

tv = ["CBS","TBS","TNT","TRU"]
date = ARGV[0] || Time.now.to_s.split(' ').first
data = JSON.parse(open("https://api-secure.sports.yahoo.com/v1/editorial/s/scoreboard?leagues=ncaab&date=#{date}").read)
games = data["service"]["scoreboard"]["games"]
tv_games = games.select do |key, game|
  tv.include? game["tv_coverage"]
end

tv_games.each do |gid, game|
  start_time = DateTime.parse(game["start_time"]).to_time
  hour = start_time.hour
  min = start_time.min

  #if games > 8, divide by 2 for all cron
  dividor = "/2" if tv_games.keys.length > 8
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
