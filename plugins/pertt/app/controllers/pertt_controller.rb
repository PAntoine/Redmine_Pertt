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
				if chart.save?
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
			if job_list.length != 0
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
						@chart_model << '{"id":"'		 << job.id			<< '",' <<
										'"name":"'		 << job.name		<< '",' <<
										'"owner":'		 << job.owner		<< ','  <<
										'"prev_job":'	 << job.prev_job	<< ','  <<
										'"next_job":'	 << job.next_job	<< ','  <<
										'"terminal":"'	 << job.is_terminal	<< '",' <<
										'"description":"'<< job.description	<< '"},'
					end
				end

				# end the model
				@chart_model << "null]"
			end
		end
	end

	def update
		chart = PerttChart.find(params[:id])

		# TODO: add the error handling
		if (chart)
			update_chart_data = JSON.parse(params[:chart_data])

			update_chart_data.each do | changed_job |
				if changed_job["created"]
					# New job as been added to the chart add it here
					chart.pertt_job.import(changed_job)

				elsif changed_job["amended"]
					# The Job has been amended now amended
					chart.pertt_job.amend(changed_job)
				
				elsif changed_job["deleted"]
					# The Job has been deleted remove
					chart.pertt_job.delete(changed_job)
				end
			end
		end
	end

	def show
	end
end
