Redmine::Plugin.register :pertt do
	name 'Pertt plugin'
	author 'Peter Antoine'
	description 'This is a Pertt Chart plugin'
	version '0.1.0'
	author_url 'http://github.com/PAntoine/redmine_pertt'

	project_module :pertt do
		permission :pertt, { :pertt => [:index] }, :public => true
		permission :amend_pertt, {:pertt => [:edit, :amend, :update, :edit]}, :require => :member
		permission :manage_pertt,{:pertt => [:delete, :create]}, :require => :member
	end

	menu :project_menu, :pertt, { :controller => 'pertt', :action => 'index' }, :caption => 'Pertt', :after => :gantt, :param => :project_id
end
