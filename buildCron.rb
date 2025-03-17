#!/usr/bin/env ruby

require 'json'
require 'open-uri'

date = ARGV[0] || Time.now.to_s.split(' ').first
data = JSON.parse(open("https://api-secure.sports.yahoo.com/v1/editorial/s/scoreboard?leagues=ncaab&conferences=3&date=#{date}").read)
teams = data["service"]["scoreboard"]["teams"]
data["service"]["scoreboard"]["games"].each do |gid, game|
  if teams[game["home_team_id"]]["conference_id"] == "3" && teams[game["away_team_id"]]["conference_id"] == "3"
    start_time = DateTime.parse(game["start_time"]).to_time
    hour = start_time.hour
    min = start_time.min

    puts "#{min}-59 #{hour} * * * curl localhost:5678/game/#{gid} #b1g"
    puts "* #{hour+1}-#{(hour + 2)%24} * * * curl localhost:5678/game/#{gid} #b1g"
    puts "0-#{min} #{(hour+3)%24} * * * curl localhost:5678/game/#{gid} #b1g"
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
