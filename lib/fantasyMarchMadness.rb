$LOAD_PATH << File.join(Dir.getwd, 'lib')
require 'sinatra'
require 'importer'
require 'scoreboard'
require 'json'
require 'em-websocket'
require 'rack/openid'

@@scoreboard = Scoreboard.new

class App < Sinatra::Base
  use Rack::Session::Cookie
  use Rack::OpenID

  set :bind, '0.0.0.0'
  set :importer, Importer.new
  set :scoreboard, @@scoreboard

  set :public_folder, File.dirname(__FILE__) + '/../public'

  get '/openid' do
   '<form action="/openid" method="post"><input name="commit" type="submit" value="Sign in" /></form>'
  end

  ['/draft', '/'].each do |path|
    post path do
      if resp = request.env["rack.openid.response"]
        if resp.status == :success
          session[:fields] = resp.get_signed_ns("http://openid.net/srv/ax/1.0")
        end
        redirect path
      else
        response.headers['WWW-Authenticate'] = Rack::OpenID.build_header(
          :identifier => "https://www.google.com/accounts/o8/id",
          :required => ["http://axschema.org/contact/email",
                        "http://axschema.org/namePerson/first",
                        "http://axschema.org/namePerson/last"],
                        :method => 'POST')
        throw :halt, [401, 'got openid?']
      end
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
    if session[:fields]
      session[:fields].to_json
    else
      "{}"
    end
  end

  #return standings object
  get '/standings' do
    settings.scoreboard.standings.to_json
  end
  
  #return standings object
  get '/standings/:year' do |year|
    Scoreboard.new("data/#{year}").standings.to_json
  end

  #load game with id
  get '/game/:id' do |url|
    game = settings.importer.game("/#{url}/")
    settings.scoreboard.update_game("/#{url}/", game)
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
    File.read(File.join('data', 'chat.json'))
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
  scoreboard = @@scoreboard
  EM::WebSocket.start(:host => "0.0.0.0", :port => 4568) do |ws|
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
  App.run!
}
