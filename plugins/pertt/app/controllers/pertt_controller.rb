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
		@chart = PerttChart.find(params[:id])
	end

	def amend
		chart = PerttChart.find(params[:id])
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

			# Now iterate over the jobs and put them into the model
			job_list.each_with_index do |job, idx|
			    @chart_model << job.get_json << ","
			end

			# end the model
			@chart_model << "null]"
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
