#!/usr/bin/env ruby

require 'nokogiri'
require 'open-uri'

doc = Nokogiri::HTML(STDIN.read)
tables = doc.search("#ysp-leaguescoreboard table table td.ysptblbdr2 table.ysptblclbg3")

tables.each do |t|
  time = t.search('span.yspscores').text
  gid = ''
  t.search('td.yspscores a.yspmore').each do |a|
    if a['href'].match /gid=/
      gid = a['href'].match(/[^0-9]*([0-9]*).*/)[1]
    end
  end
  unless gid.empty?
    hour = 0
    min = 0
    splitup = time.split(' ').first.split(':')
    min = splitup.last 
    if time.match(/pm/)
      if splitup.first.to_i == 12
        hour = 11 
      else
        hour = splitup.first.to_i + 11
      end
    else
      hour = splitup.first.to_i - 1
    end

    puts "#{min}-59/2 #{hour} * * * curl localhost:4567/game/#{gid}"
    puts "*/2 #{hour+1}-#{hour + 2} * * * curl localhost:4567/game/#{gid}"
    puts "0-#{min}/2 #{(hour+3)%24} * * * curl localhost:4567/game/#{gid}"
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
