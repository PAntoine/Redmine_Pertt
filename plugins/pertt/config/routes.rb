# Plugin's routes
# See: http://guides.rubyonrails.org/routing.html
get '/pertt', :to => 'pertt#index'
get '/pertt/create', :to => 'pertt#create'
get '/pertt/:id/pertt/edit', :to => 'pertt#edit'
get '/pertt/:id/pertt/show', :to => 'pertt#show'
get '/pertt/:id/pertt/update', :to => 'pertt#update'

post '/pertt/create', :to => 'pertt#create'
post '/pertt/:id/pertt/update', :to => 'pertt#update'

resources :pertt_charts
