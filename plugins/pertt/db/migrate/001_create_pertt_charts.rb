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
		t.string	:name, 			:null => false
		t.string	:description,	:null => false
    end

	create_table :pertt_jobs, :force => true do |t|
		t.integer	:pertt_chart_id,:null => false
		t.string	:name,			:null => false
		t.integer	:owner,			:null => false
		t.integer	:prev_job
		t.integer	:next_job
		t.boolean	:is_deleted,	:null => false, :default => false
		t.boolean	:is_terminal
		t.string	:description
	end

	create_table :pertt_links, :force => true do |t|
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
