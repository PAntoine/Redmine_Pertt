#---------------------------------------------------------------------------------
#  ,-----.                 ,--.    ,--.     ,----. ,--.                   ,--.  
#  |  .-. | ,---. ,--.--.,-'  '-.,-'  '-.  '  .-./ |  '--. ,--.-.,--.--.,-'  '-.
#  |  '-' || .-. :|  .--''-.  .-''-.  .-'  |  |  _ |  .  || .-. ||  .--''-.  .-'
#  |  |--' \   --.|  |     |  |    |  |    '  '-' ||  |  |' '-' ||  |     |  |  
#  `--'     `----'`--'     `--'    `--'     `----' `--'--' `--'-'`--'     `--'  
#    file: pertt_job
#    desc: This file is the class definition for the ruby class PerttJob.
#
#  author: 
#    date: 07/01/2013 20:28:17
#---------------------------------------------------------------------------------
#                     Copyright (c) 2013 Peter Antoine
#                            All rights Reserved.
#                    Released Under the Artistic Licence
#---------------------------------------------------------------------------------
class PerttJob < ActiveRecord::Base
	has_many	:pertt_links, :dependent => :destroy
	belongs_to	:pertt_chart, :inverse_of => pertt_job
	validates_presence_of :name, :pertt_chart_id, :owner, :pertt_job_id
	validates_uniqueness_of :pertt_job_id, :scope => :pertt_chart_id

	##
	# import
	# 
	# This function will create a new job from the given hash.
	# 
	# parameter:
	#
	# 	input_hash	The input has that has been sent from the javascript
	# 				that defines the job that needs to be added to the
	# 				database.
	#
	def self.import (input_hash)
		@new_job = PerttJob.create	:id => input_hash["id"],
									:name => input_hash["name"],
									:owner => input_hash["owner"],
									:prev_job => input_hash["prev_job"],
									:next_job => input_hash["next_job"],
									:terminal => input_hash["terminal"],
									:description => input_hash["description"]

		# If, the job was created and job has streams
		if (@new_job && input_hash["streams"].length > 0)
			input_hash["streams"].each do | job_id |
				@new_job.pertt_link.create(job_id)
			end
		end
	end
end
