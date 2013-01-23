$LOAD_PATH << File.join(Dir.getwd, 'lib')
require 'sinatra'
require 'importer'
require 'scoreboard'
require 'json'
require 'em-websocket'

class App < Sinatra::Base
  set :importer, Importer.new
  set :scoreboard, Scoreboard.new

  set :public_folder, File.dirname(__FILE__) + '/../public'

  get '/' do
    content_type :html
    File.read(File.join('public', 'index.html'))
  end

  #serve draft page
  get '/draft' do
    File.read(File.join('public', 'draft.html'))
  end

  #return standings object
  get '/standings' do
    settings.scoreboard.standings.to_json
  end

  #load game with id
  get '/game/:id' do |id|
    game = settings.importer.game(id)
    settings.scoreboard.update_game(id, game)
    game.to_json
  end

  #load all games for date
  get '/date/:id' do |id|
    games = settings.importer.date(id)
    games.each do |game_id|
      game = settings.importer.game(game_id)
      settings.scoreboard.update_game(game_id, game)
    end
    games.to_json
  end

  #return list of teams
  get '/allteams' do
    settings.importer.all_teams.to_json
  end

  #load players on team
  get '/players/:id' do |id|
    players = settings.importer.players_on_team(id)
    settings.scoreboard.add_players players
    players.to_json
  end

  #return all teams
  get '/data/teams' do
    settings.scoreboard.teams.to_json
  end

  #return all loaded players for autocomplete team page
  get '/data/players' do
    settings.scoreboard.players.to_json
  end

  post '/team' do 
    team = JSON.parse(request.body.read.to_s)
    if team["team"] && team["players"]
      settings.scoreboard.new_team team 
    else
      "Invalid Team"
    end
  end
end

EM.run {
  connections = []
  EM::WebSocket.start(:host => "0.0.0.0", :port => 4568) do |ws|
    ws.onopen { connections << ws }
    ws.onmessage { |msg| connections.each { |c| c.send msg } }
    ws.onclose { connections.delete ws}
  end
  App.run!
}
