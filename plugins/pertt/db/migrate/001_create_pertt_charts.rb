#---------------------------------------------------------------------------------
#  ,-----.                 ,--.    ,--.     ,----. ,--.                   ,--.  
#  |  .-. | ,---. ,--.--.,-'  '-.,-'  '-.  '  .-./ |  '--. ,--.-.,--.--.,-'  '-.
#  |  '-' || .-. :|  .--''-.  .-''-.  .-'  |  |  _ |  .  || .-. ||  .--''-.  .-'
#  |  |--' \   --.|  |     |  |    |  |    '  '-' ||  |  |' '-' ||  |     |  |  
#  `--'     `----'`--'     `--'    `--'     `----' `--'--' `--'-'`--'     `--'  
#    file: 001_create_pertt_charts
#    desc: This file is the migration for the first version of the pertt_chart
#          plugin. This creates the database tables that are required for the
#          pertt plugin.
#
#  author: 
#    date: 07/01/2013 20:28:17
#---------------------------------------------------------------------------------
#                     Copyright (c) 2013 Peter Antoine
#                            All rights Reserved.
#                    Released Under the Artistic Licence
#---------------------------------------------------------------------------------
class CreatePerttCharts < ActiveRecord::Migration
  def up
    create_table :pertt_charts, :force => true do |t|
		t.integer	:id
		t.integer	:project_id,	:null => false
		t.integer	:selected,		:null => false, :default => 1
		t.integer	:secs_per_day,	:null => false, :default => 27000
		t.integer	:days_per_week,	:null => false, :default => 5
		t.integer	:first_week_day,:null => false, :default => 0
		t.string	:name, 			:null => false
		t.string	:description,	:null => false
    end

	create_table :pertt_jobs, :force => true do |t|
		t.integer	:id
		t.integer	:index,			:null => false
		t.integer	:pertt_chart_id,:null => false
		t.string	:name,			:null => false
		t.integer	:owner,			:null => false
		t.integer	:prev_job,		:null => false
		t.integer	:next_job,		:null => false
		t.integer	:duration_secs,	:null => false
		t.datetime	:start_time,	:null => false
		t.datetime	:end_time,		:null => false
		t.boolean	:is_deleted,	:null => false, :default => false
		t.boolean	:is_terminal
		t.boolean	:is_first_job,	:default => false
		t.string	:description
	end

	create_table :pertt_links, :force => true do |t|
		t.integer	:id
		t.integer	:pertt_job_id,	:null => false
		t.integer	:job_id,		:null => false
	end
  end

  def down
  	drop_table :pertt_charts 
	drop_table :pertt_jobs
	drop_table :pertt_links	
  end
end
