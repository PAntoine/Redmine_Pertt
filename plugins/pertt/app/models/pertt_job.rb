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
	belongs_to	:pertt_chart, :inverse_of => :pertt_job
	validates_presence_of :name, :pertt_chart_id, :owner
	validates_uniqueness_of :index, :scope => :pertt_chart_id

	##
	# to_json
	# 
	# This function will convert a job to a string. It will also product
	# the list of streams as part of the job.
	#
	# parameter:
	# 	none
	#
	def to_json
		result = ''
		
		if (self.issue_id == 0)
			name = self.name;
			job_status = 'complete';
			description = self.description;
		else
			issue = Issue.find_by_id(self.issue_id)
			status = IssueStatus.find_by_id(issue.status_id)
			
			name = issue.name
			description = issue.description;
	
			# get the jobs status from the issue
			if (status.is_closed)
				job_status = "complete"
			elsif (status.name == 'In Progress')
				job_status = "started"
			else
				job_status = "waiting"
			end
		end

		# build the JSON string for the issue
		if self.is_deleted
			result << "null,"
		else
			result <<	'{"id":"'		<< self.index.to_s			<< '",' <<
						'"name":"'		<< name						<< '",' <<
						'"owner":'		<< self.owner.to_s			<< ','	<<
						'"prev_job":'	<< self.prev_job.to_s		<< ','	<<
						'"next_job":'	<< self.next_job.to_s		<< ','	<<
						'"terminal":'	<< self.is_terminal.to_s 	<< ','	<<
						'"first_job":'	<< self.is_first_job.to_s	<< ','	<<
						'"end_date":'	<< self.end_time.to_s		<< ','	<<
						'"start_date":'	<< self.start_time.to_s		<< ','	<<
						'"duration":'	<< self.duration_secs.to_s	<< ','	<<
						'"job_status":'	<< job_status				<< ','	<<
						'"description":"'<< description				<< '", "streams":['

			# output the stream
			result << self.pertt_links.pluck(:job_id).join(',') << ']},'
		end
	
		return result
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
	def amend_job ( input_hash )
		# update the job details
		self.name = input_hash["name"]
		self.owner = input_hash["owner"]
		self.prev_job = input_hash["prev_job"]
		self.next_job = input_hash["next_job"]
		self.is_terminal = input_hash["terminal"]
		self.is_first_job = input_hash["first_job"]
		self.end_time = input_hash["end_date"]
		self.start_time	= input_hash["end_date"]
		self.duration_secs = input_hash["duration"]
		self.description = input_hash["description"]

		# Incase a deleted object is being reused
		self.is_deleted = false

		# remove the old links
		self.pertt_links.delete_all
	
		# add the new ones
		input_hash["streams"].each do | job_id |
			puts "adding job: " << job_id.to_s

			link = self.pertt_links.create :job_id => job_id

			if link.nil?
				puts "failed to create the link"
			end
		end

		# save the changes
		self.save
	end

	##
	# delete_job
	# 
	# This function will remove a job from the database.
	# 
	# parameter:
	# 	none.
	#
	def delete_job
		self.is_deleted = true
		self.save
	end
end
