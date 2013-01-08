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
	def import (input_hash)
		new_job = pertt_job.create	:id => input_hash["id"],
									:name => input_hash["name"],
									:owner => input_hash["owner"],
									:prev_job => input_hash["prev_job"],
									:next_job => input_hash["next_job"],
									:is_terminal => input_hash["terminal"],
									:description => input_hash["description"]

		# If, the job was created and there are streams with the job 
		if (new_job && input_hash["streams"].length > 0)
			input_hash["streams"].each do | job_id |
				new_job.pertt_link.create(job_id)
			end
		end
	end

	##
	# amend
	# 
	# This function will amend a job. For speed (as the link item number
	# should be small for each job item, when updating the job all the 
	# link items will be deleted and then new ones created afterwards.
	# 
	# parameter:
	#
	# 	input_hash	The input has that has been sent from the javascript
	# 				that defines the job that needs to be amended in the
	# 				database.
	#
	def amend (input_hash)
		old_job = pertt_job.find(:id => input_hash["id"])

		if (old_job)
			# update the job details
			old_job.id = input_hash["id"]
			old_job.name = input_hash["name"]
			old_job.owner = input_hash["owner"]
			old_job.prev_job = input_hash["prev_job"]
			old_job.next_job = input_hash["next_job"]
			old_job.is_terminal = input_hash["terminal"]
			old_job.description = input_hash["description"]

			# Incase a deleted object is being reused
			old_job.is_deleted = false

			# remove the old links
			old_job.pertt_link.delete_all
		
			# add the new ones
			if (old_job && input_hash["streams"].length > 0)
				input_hash["streams"].each do | job_id |
					old_job.pertt_link.create(job_id)
				end
			end

			# save the changes
			old_job.save
		end
	end

	##
	# delete
	# 
	# This function will remove a job from the database.
	# 
	# parameter:
	#
	# 	input_hash	The input has that has been sent from the javascript
	# 				that defines the job that needs to be deleted to the
	# 				database.
	#
	def delete (input_hash)
		old_job = pertt_job.find(:id => input_hash["id"])

		if (old_job)
			old_job.is_deleted = true

			old_job.save
		end
	end
end
