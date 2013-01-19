#---------------------------------------------------------------------------------
#  ,-----.                 ,--.    ,--.     ,----. ,--.                   ,--.  
#  |  .-. | ,---. ,--.--.,-'  '-.,-'  '-.  '  .-./ |  '--. ,--.-.,--.--.,-'  '-.
#  |  '-' || .-. :|  .--''-.  .-''-.  .-'  |  |  _ |  .  || .-. ||  .--''-.  .-'
#  |  |--' \   --.|  |     |  |    |  |    '  '-' ||  |  |' '-' ||  |     |  |  
#  `--'     `----'`--'     `--'    `--'     `----' `--'--' `--'-'`--'     `--'  
#    file: pertt_chart
#    desc: This file is the class definition for the ruby class PerttChart.
#
#  author: 
#    date: 07/01/2013 20:28:17
#---------------------------------------------------------------------------------
#                     Copyright (c) 2013 Peter Antoine
#                            All rights Reserved.
#                    Released Under the Artistic Licence
#---------------------------------------------------------------------------------
class PerttChart < ActiveRecord::Base
	belongs_to	:project, :inverse_of => :pertt_chart
	has_many :pertt_jobs, :dependent => :destroy
	validates_presence_of	:name, :project_id
	validates_uniqueness_of	:name, :case_sensitive => false

	unloadable

	def locked?
		false
	end

	def registered?
		false
	end

	##
	# add_job
	# 
	# This function will create and add a new job to the current chart.
	# 
	# parameter:
	#
	# 	changed_job	The input has that has been sent from the javascript
	# 				that defines the job that needs to be added to the
	# 				database.
	#
	def add_job ( changed_job )
		# create the new job
		new_job = self.pertt_jobs.create 	:name => changed_job["name"],
											:index => changed_job["id"],
											:owner => changed_job["owner"],
											:prev_job => changed_job["prev_job"],
											:next_job => changed_job["next_job"],
											:end_time => changed_job["end_date"],
											:start_time	=> changed_job["end_date"],
											:is_terminal => changed_job["terminal"],
											:duration_secs => changed_job["duration"],
											:is_first_job => changed_job["first_job"],
											:description => changed_job["description"]

		# New job as been added to the chart add it here
		puts changed_job["streams"]

		# If, the job was created and there are streams with the job 
		if (new_job && changed_job["streams"].length > 0)

			changed_job["streams"].each do | job_id |
				new_job.pertt_links.create	:job_id => job_id
			end
		end
	end

end
