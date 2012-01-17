$LOAD_PATH << File.join(Dir.getwd, 'lib')
require 'sinatra'
require 'scoreboard'
require 'json'

set :scoreboard, Scoreboard.new

get '/' do
  content_type :html
  File.read(File.join('public', 'index.html'))
end

get '/game/:id' do |id|
  settings.scoreboard.game(id).to_json
end

get '/date/:id' do |id|
  settings.scoreboard.date(id).to_json
end

get '/allteams' do
  settings.scoreboard.all_teams.to_json
end

get '/players/:id' do |id|
  settings.scoreboard.players_on_team(id).to_json
end
