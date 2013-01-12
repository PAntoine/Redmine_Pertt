#---------------------------------------------------------------------------------
#  ,-----.                 ,--.    ,--.     ,----. ,--.                   ,--.  
#  |  .-. | ,---. ,--.--.,-'  '-.,-'  '-.  '  .-./ |  '--. ,--.-.,--.--.,-'  '-.
#  |  '-' || .-. :|  .--''-.  .-''-.  .-'  |  |  _ |  .  || .-. ||  .--''-.  .-'
#  |  |--' \   --.|  |     |  |    |  |    '  '-' ||  |  |' '-' ||  |     |  |  
#  `--'     `----'`--'     `--'    `--'     `----' `--'--' `--'-'`--'     `--'  
#    file: pertt_controller
#    desc: This file is the controller for the pertt chart.
#
#  author: 
#    date: 07/01/2013 20:28:17
#---------------------------------------------------------------------------------
#                     Copyright (c) 2013 Peter Antoine
#                            All rights Reserved.
#                    Released Under the Artistic Licence
#---------------------------------------------------------------------------------
class PerttController < ApplicationController
	unloadable

	def index
	  @charts = PerttChart.all
	end
	
	def create
		if request.post?
			@chart = PerttChart.new(params[:pertt_chart])

			if @chart.save
				flash[:notice] = 'Saved Ok'
				redirect_to :action => 'index'
			else
				flash[:notice] = 'Did not save'
			end
		elsif request.put?
			
			puts "chart " << @chart

		else
			puts "here"
			@chart = PerttChart.new
		end
	end

	def edit
		if request.put?
			input_hash = params[:pertt_chart]

			chart = PerttChart.find(input_hash["id"])

			if (chart)
				chart.name = input_hash["name"]
				chart.description = input_hash["description"]
				if chart.save
					flash[:notice] = 'Saved OK'
				else
					flash[:alert] = 'Could not save changes'
				end
			else
				flash[:alert] = 'Could not find the chart'
			end

			# Ok, we have saved it
			redirect_to :action => 'index'
		else
			@chart = PerttChart.find(params[:id])
		end
	end

	def amend
		chart = PerttChart.find(params[:id])

		if (chart)
			@chart_name = chart.name
			@canvas_id = chart.name.gsub(" ", "_")

			job_list = chart.pertt_jobs
				
			# Now build the model for the chart 
			if job_list.length == 0
				# empty chart - let the javascript handle initiating it
				@chart_model = 'null'
			else
				# need to read the database to find the objects within the chart
				@chart_model = '['

				# Now iterate over the jobs and put them into the JSON string
				job_list.each do | job |
					if job.is_deleted
						@chart_model << "null,"
					else
						if job.is_terminal
							is_term = 'true'
						else
							is_term = 'false'
						end

						@chart_model << '{"id":"'		 << job.index.to_s		<< '",' <<
										'"name":"'		 << job.name			<< '",' <<
										'"owner":'		 << job.owner.to_s		<< ','	<<
										'"prev_job":'	 << job.prev_job.to_s	<< ','	<<
										'"next_job":'	 << job.next_job.to_s	<< ','	<<
										'"terminal":"'	 << is_term 			<< '",'	<<
										'"description":"'<< job.description		<< '", "streams":['

						# output the stream
						@chart_model << job.pertt_links.pluck(:job_id).join(',') << ']},'
					end
				end

				# end the model
				@chart_model << "null]"

				puts @chart_model
			end
		end
	end

	def update
		if request.post?
			chart = PerttChart.find(params[:id])

			# TODO: add the error handling
			if (chart)
				update_chart_data = JSON.parse(params[:chart_data])

				update_chart_data.each do | changed_job |

					if changed_job["created"]
						puts "import"

						# create the new job
						new_job = chart.pertt_jobs.create 	:name => changed_job["name"],
															:index => changed_job["id"],
															:owner => changed_job["owner"],
															:prev_job => changed_job["prev_job"],
															:next_job => changed_job["next_job"],
															:is_terminal => changed_job["terminal"],
															:description => changed_job["description"]

						# New job as been added to the chart add it here
						puts changed_job["streams"]

						# If, the job was created and there are streams with the job 
						if (new_job && changed_job["streams"].length > 0)

							changed_job["streams"].each do | job_id |
								new_job.pertt_links.create	:job_id => job_id
							end
						end

					elsif changed_job["amended"]
						puts "amended"

						job = chart.pertt_jobs.find_by_index changed_job['id']

						if (job)
							# The Job has been amended now amended
							job.amend_job changed_job
						else
							puts "Failed to find job on amend. JobID = " << changed_job['id']
						end
					
					elsif changed_job["deleted"]
						# The Job has been deleted remove
						chart.pertt_jobs.delete(changed_job)
					else
						puts "failed Unkownn"
					end
				end
			end
		else
			puts "we dont have a post"
		end
	end

	def show
	end
end
