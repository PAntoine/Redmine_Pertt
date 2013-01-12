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
		else
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
					@chart_model << job.to_json
				end

				# end the model
				@chart_model << "null]"
			end
		else
			flash[:alert] = 'Could not find the chart'
			redirect_to :action => 'index'
		end
	end

	def update
		if request.post?
			chart = PerttChart.find(params[:id])

			# did the user want to dicard any changed they made?
			if params[:discard_button] != nil
				session[:last_saved] = chart.name.gsub(" ", "_")
				flash[:notice] = 'Changes Discarded'
				redirect_to :action => 'index'

			elsif (chart)
				update_chart_data = JSON.parse(params[:chart_data])
				flash[:notice] = 'Updated OK'

				# update the amended jobs
				update_chart_data.each do | changed_job |
					if changed_job["created"]
						chart.add_job changed_job

					elsif changed_job["amended"]
						job = chart.pertt_jobs.find_by_index changed_job['id']

						if (job)
							# The Job has been amended now amended
							job.amend_job changed_job
						else
							flash[:alert] = "Failed to find job on update. JobID = " << changed_job['id']
						end
					
					elsif changed_job["deleted"]
						# The Job has been deleted remove
						chart.pertt_jobs.delete(changed_job)
					else
						flash[:alert] = "Failed unknown state for job"
					end
				end

				# Update the chart ok
				session[:last_saved] = chart.name.gsub(" ", "_")
			else
				flash[:alert] = 'Could not find the chart to update it'
			end
		else
			flash[:alert] = 'Internal State Error - Please try again.'
			redirect_to :action => 'index'
		end
	end
end
