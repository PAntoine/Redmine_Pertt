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
		t.integer	:project_id,	:null => false
		t.integer	:selected,		:null => false, :default => 1
		t.integer	:secs_per_day,	:null => false, :default => 27000
		t.integer	:days_per_week,	:null => false, :default => 5
		t.integer	:first_week_day,:null => false, :default => 1
		t.integer	:tracker_id,	:null => false, :default => 2
		t.integer	:issue_id
		t.string	:name, 			:null => false
		t.string	:description,	:null => false
    end
	
	add_index "pertt_charts", ["id"], :name => "index_pertt_charts_on_id"

	create_table :pertt_jobs, :force => true do |t|
		t.integer	:index,			:null => false
		t.integer	:pertt_chart_id,:null => false
		t.integer	:owner,			:null => false
		t.integer	:prev_job,		:null => false
		t.integer	:next_job,		:null => false
		t.integer	:duration_secs,	:null => false
		t.integer	:issue_id,		:null => false
		t.integer	:prev_rel_id,	:default => 0
		t.integer	:start_time,	:null => false
		t.integer	:end_time,		:null => false
		t.boolean	:is_deleted,	:null => false, :default => false
		t.boolean	:is_terminal
		t.boolean	:is_first_job,	:default => false
		t.string	:name,			:null => false
		t.string	:description
	end
	add_index "pertt_jobs", ["index"], :name => "index_pertt_jobs_on_index"
	add_index "pertt_jobs", ["pertt_chart_id","index"], :name => "index_pertt_jobs_on_pertt_chart_id_and_index"

	create_table :pertt_links, :force => true do |t|
		t.integer	:pertt_job_id,	:null => false
		t.integer	:job_id,		:null => false
	end

	add_index "pertt_links", ["job_id"], :name => "index_pertt_links_on_job_id"

  end

  def down
  	drop_table :pertt_charts 
	drop_table :pertt_jobs
	drop_table :pertt_links	
  end
end
