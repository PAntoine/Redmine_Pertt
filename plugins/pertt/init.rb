Redmine::Plugin.register :pertt do
  name 'Pertt plugin'
  author 'Peter Antoine'
  description 'This is a Pertt Chart plugin'
  version '0.0.1'
  author_url 'http://github.com/PAntoine/redmine_pertt'

  menu :application_menu, :pertt, { :controller => 'pertt', :action => 'index' }, :caption => 'Pertt'

# work for future changes
	permission :pertt, { :pertt => [:index] }, :public => true
	permission :create_pertt, :pertt => :create

	menu :project_menu, :pertt, { :controller => 'pertt', :action => 'index' }, :caption => 'Pertt', :after => :gantt, :param => :project_id
end
