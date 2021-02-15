$LOAD_PATH << File.join(Dir.getwd, 'lib')
require 'thin'
require 'sinatra/base'
require 'importer'
require 'scoreboard'
require 'json'
require 'em-websocket'
require 'google/api_client/client_secrets'
require 'google/apis/oauth2_v2'

@@scoreboard = Scoreboard.new

class App < Sinatra::Base
  use Rack::Session::Cookie
  auth_client = Signet::OAuth2::Client.new(:client_id => ENV["CLIENT_ID"], :client_secret => ENV["CLIENT_SECRET"])

  set :bind, '0.0.0.0'
  set :importer, Importer.new
  set :scoreboard, @@scoreboard

  set :public_folder, File.dirname(__FILE__) + '/../public'

  set :auth_client, auth_client

  def auth_client
    settings.auth_client
  end

  ['/draft', '/'].each do |path|
    post path do
      if session[:user]
        redirect to(path) 
      else
        redirect to('/oauth2authorize')
      end
    end
  end

  get '/login' do
    redirect to('/oauth2callback')
  end

  get '/oauth2authorize' do
    redirect '/oauth2callback'
  end

  get '/oauth2callback' do
    client_secrets = Google::APIClient::ClientSecrets.load("client.json")
    auth_client = client_secrets.to_authorization
    auth_client.update!(
      :scope => 'https://www.googleapis.com/auth/userinfo.email',
      :redirect_uri => url('/oauth2callback'))
    if request['code'] == nil
      auth_uri = auth_client.authorization_uri.to_s
      redirect to(auth_uri)
    else
      auth_client.code = request['code']
      auth_client.fetch_access_token!
      auth_client.client_secret = nil
      session[:credentials] = auth_client.to_json
      service = Google::Apis::Oauth2V2::Oauth2Service.new
      service.authorization = auth_client
      userinfo = service.get_userinfo
      session[:user] = {:email => userinfo.email}
      redirect to('/')
    end
  end

  get '/' do
    content_type :html
    File.read(File.join('public', 'index.html'))
  end

  get '/history/:year' do |year|
    content_type :html
    File.read(File.join('public', 'index.html'))
  end

  #serve draft page
  get '/draft' do
    File.read(File.join('public', 'draft.html'))
  end

  get '/userInfo' do
    if session[:user]
      session[:user].to_json
    else
      "{}"
    end
  end

  #return standings object
  get '/standings' do
    settings.scoreboard.standings.to_json
  end
  
  get '/standings/historic' do
    Dir.glob('data/*/').reduce({}) do |memo, path| 
      year = path.split('/').last 
      memo[year] = Scoreboard.new("data/#{year}").standings
      memo
    end.to_json
  end

  #return standings object
  get '/standings/:year' do |year|
    Scoreboard.new("data/#{year}").standings.to_json
  end

  #load game with id
  get '/game/:id' do |url|
    game = settings.importer.game("#{url}")
    settings.scoreboard.update_game("#{url}", game)
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
  # /players/ncaab.t.357 for example
  get '/players/:id' do |id|
    players = settings.importer.players_on_team(id)
    settings.scoreboard.add_players players
    players.to_json
  end

  get '/boxscore/:id' do |id|
    redirect settings.importer.boxscore_for(id)
  end

  get '/data/years' do
    Dir.glob('data/*/').map { |path| path.split('/').last }.to_json
  end

  #return all teams
  get '/data/teams' do
    settings.scoreboard.teams.to_json
  end

  #return all loaded players for autocomplete team page
  get '/data/players' do
    settings.scoreboard.players.to_json
  end

  get '/data/chat' do
    chat_file = File.join('data', 'chat.json')
    if File.exists?(chat_file)
      File.read(chat_file)
    else
      ""
    end
  end

  post '/team' do 
    team = JSON.parse(request.body.read.to_s)
    if team["team"] && team["players"]
      settings.scoreboard.new_team team 
    else
      "Invalid Team"
    end
  end

  post '/wishlist' do
    name = session[:user][:email].split("@")[0]
    list = request.body.read.to_s
    File.open(File.expand_path(File.join(File.dirname(__FILE__), '..', 'data', "wishlist-#{name}.json")), 'w') do |f|
      f.puts list.to_s
    end
    list
  end

  get '/wishlist' do
    name = session[:user][:email].split("@")[0]
    wishlist_file = File.expand_path(File.join(File.dirname(__FILE__), '..', 'data', "wishlist-#{name}.json"))
    if File.exists? wishlist_file
      File.read(wishlist_file)
    else
      "[]"
    end
  end

  def self.start
    Thin::Server.start(App, settings.port)
  end
end

EM.run {
  connections = []
  scoreboard = @@scoreboard
  EM::WebSocket.start(:host => "127.0.0.1", :port => 4569) do |ws|
    ws.onopen { connections << ws }
    ws.onmessage do |msg| 
      parsed = JSON.parse(msg)
      if parsed["type"] == "pick"
        scoreboard.new_player_on_team(parsed["team"], parsed["player"])
      end
      if parsed["type"] == "rename"
        scoreboard.new_team_name(parsed["team"], parsed["newName"])
      end
      if parsed["message"]
        File.open(File.expand_path(File.join(File.dirname(__FILE__), '..', 'data', 'chat.json')), 'a') do |f|
          f.puts msg
        end
      end
      connections.each { |c| c.send msg } 
    end
    ws.onclose { connections.delete ws}
  end
  App.start
  Signal.trap("INT") { EM.stop }
  Signal.trap("TRAP") { EM.stop }
}
