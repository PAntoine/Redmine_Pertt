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
 	# This also expects that the owner job is created before this job is
	# created. As the job id's in the JavaScript are sequential, the
	# child cannot be created before the child, this relationship should
	# not be a problem.
	# 
	# parameter:
	# 	project_id	The project id of the project that owns the pertt
	# 				chart.
	# 	changed_job	The input has that has been sent from the javascript
	# 				that defines the job that needs to be added to the
	# 				database.
	#
	def add_job ( project_id, changed_job )
		# create new issue for the job - assign parent if required.
		if (changed_job["owner"] == 0)
			parent_issue = self.issue_id
		else
			parent_issue = self.pertt_jobs.find_by_index(changed_job["owner"]).issue_id
		end

		puts "id: " << changed_job["id"].to_s << " start date utc: " << Time.at(changed_job["start_date"]).utc.to_date.to_s << " end_date: " << Time.at(changed_job["end_date"]).utc.to_date.to_s

		# create the jobs issue
		duration_hours = changed_job["duration"].to_f / 3600.0

		new_issue = Issue.create(	:project_id => project_id,
									:subject => changed_job["name"],
									:description => changed_job["description"],
									:start_date => Time.at(changed_job["start_date"]).utc.to_date,
									:due_date => Time.at(changed_job["end_date"]).utc.to_date,
									:estimated_hours => duration_hours,
									:author_id => User.current.id,
									:tracker_id => self.tracker_id,
									:parent_issue_id => parent_issue)

		# create the new job
		new_job = self.pertt_jobs.create 	:name => changed_job["name"],
											:index => changed_job["id"],
											:owner => changed_job["owner"],
											:prev_job => changed_job["prev_job"],
											:next_job => changed_job["next_job"],
											:end_time => changed_job["end_date"],
											:start_time	=> changed_job["start_date"],
											:is_terminal => changed_job["terminal"],
											:duration_secs => changed_job["duration"],
											:is_first_job => changed_job["first_job"],
											:description => changed_job["description"],
											:issue_id => new_issue.id

		# New job as been added to the chart add it here
		puts changed_job["streams"]

		# If, the job was created and there are streams with the job 
		if (new_job && changed_job["streams"].length > 0)

			changed_job["streams"].each do | job_id |
				new_job.pertt_links.create	:job_id => job_id
			end
		end
	end

	##
	# update_chart
	# 
	# This function will update the chart with the data that has been
	# given. It will create and delete jobs. It will also create and
	# amend the issues that are attached.
	#
	# parameter:
	# 	changed_job	The input has that has been sent from the javascript
	# 				that defines the job that needs to be added to the
	# 				database.
	#
	def update_chart ( project_id, update_chart_data )
		result = ''

		# update the selection pointer
		self.selected = update_chart_data['selected']
		self.save

		# update the amended jobs
		update_chart_data['change_list'].each do | changed_job |

			if changed_job["created"]
				self.add_job project_id, changed_job

			elsif changed_job["deleted"]
				job = self.pertt_jobs.find_by_index changed_job['id']

				if (job)
					job.delete_job
				end

			elsif changed_job["amended"]
				job = self.pertt_jobs.find_by_index changed_job['id']

				if (job)
					# The Job has been amended now amended
					job.amend_job changed_job
				else
					result = "Failed to find job on update. JobID = " << changed_job['id']
				end
			else
				result = "Failed unknown state for job"
			end
		end

		return result
	end

	##
	# connect_issues
	# 
	# This function will connect the all the issues for the chart.
	#
	# parameter:
	# 	update_chart_data	The input has that has been sent from the
	# 						from the javascript that is used to update
	# 						the chart.
	#
	def connect_issues ( update_chart_data )
		result = ''

		puts "in connect issues"

		# update the amended jobs
		update_chart_data['change_list'].each do | changed_job |

			puts "item " << changed_job.inspect

			if changed_job["created"] || changed_job["amended"]
				job = self.pertt_jobs.find_by_index changed_job['id']

				if (job)
					# check to see if the job is connected linearly, if so set it
					if (job.prev_job != 0)
						puts "connecting " << job.prev_job.to_s << " to " << job.id.to_s

						prev_job = self.pertt_jobs.find_by_index job.prev_job

						puts "issue id from:" << prev_job.issue_id.to_s << " to: " << job.issue_id.to_s

						if (job.prev_rel_id != 0)
							IssueRelation.find(job.prev_rel_id).destroy()
							job.prev_rel_id = 0;
						end

						new_relation = IssueRelation.create(:relation_type => 'follows', :issue_from => Issue.find(job.issue_id), :issue_to => Issue.find(prev_job.issue_id))
						job.prev_rel_id = new_relation.id

						job.save
					end
				end
			end
		end

		return result
	end
end

