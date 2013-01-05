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
		t.boolean	:terminal
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
