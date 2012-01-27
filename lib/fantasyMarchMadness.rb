$LOAD_PATH << File.join(Dir.getwd, 'lib')
require 'sinatra'
require 'importer'
require 'scoreboard'
require 'json'

set :importer, Importer.new
set :scoreboard, Scoreboard.new

get '/' do
  content_type :html
  File.read(File.join('public', 'index.html'))
end

get '/css/style.css' do
  content_type :css
  File.read(File.join('public', 'css', 'style.css'))
end

['jquery-1.6.2.js','underscore.js'].each do |file|
  get "/scripts/#{file}" do
    content_type :js
    File.read(File.join('public', 'scripts', file))
  end
end

get '/standings' do
  settings.scoreboard.standings.to_json
end

get '/game/:id' do |id|
  game = settings.importer.game(id)
  settings.scoreboard.update_game(id, game)
  game.to_json
end

get '/date/:id' do |id|
  settings.importer.date(id).to_json
end

get '/allteams' do
  settings.importer.all_teams.to_json
end

get '/players/:id' do |id|
  players = settings.importer.players_on_team(id)
  settings.scoreboard.add_players players
  players.to_json
end
