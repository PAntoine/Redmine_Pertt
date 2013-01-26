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

	before_filter :find_project, :authorize, :only => [ :index, :create, :new ]
	before_filter :find_chart, :authorize, :only => [ :edit, :amend, :update ]

	def index
	  @charts = PerttChart.find_all_by_project_id @project.id
	end
	
	def new
		if request.get?
			@chart = PerttChart.new
			@chart.project_id = @project.id
		end
	end

	def create
		if request.post?
			@chart = PerttChart.new(params[:pertt_chart])
			@chart.project_id = @project.id

			# create the root issue for the pertt chart
			new_issue = Issue.create( :project_id => @project.id, :subject => @chart.name, :author_id => User.current.id, :tracker_id => params[:tracker_id] )
			@chart.issue_id = new_issue.id

			if @chart.save
				flash[:notice] = 'Saved Ok'
				redirect_to :action => 'index', :project_id => @project.id
			else
				flash[:alert] = 'Did not save'
				redirect_to :action => 'new', :project_id => @project.id
			end
		end
	end

	def edit
		if request.put?
			input_hash = params[:pertt_chart]

			chart = PerttChart.find(params[:id])

			if (chart)
				chart.name = input_hash["name"]
				chart.description = input_hash["description"]
				chart.days_per_week = input_hash["days_per_week"]
				chart.secs_per_day  = input_hash["hours_per_day"].to_f * (3600)
				chart.first_week_day = params["start_day_of_week"].to_i

				if chart.save
					flash[:notice] = 'Saved OK'
				else
					flash[:alert] = 'Could not save changes'
				end
			else
				flash[:alert] = 'Could not find the chart'
			end

			# Ok, we have saved it
			redirect_to :action => 'index', :project_id => @project.id
		else
			@chart = PerttChart.find(params[:id])
		end
	end

	def amend
		chart = PerttChart.find(params[:id])

		if (chart)
			@chart_name = chart.name
			@canvas_id = chart.name.gsub(" ", "_")
			@chart_current_job = chart.selected
			@chart_secs_per_day = chart.secs_per_day
			@chart_days_per_week = chart.days_per_week
			@chart_first_week_day = chart.first_week_day

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
			redirect_to :action => 'index', :project_id => @project.id
		end
	end

	def update
		if request.post?
			chart = PerttChart.find(params[:id])

			# did the user want to discard any changes they made?
			if params[:discard_button] != nil
				session[:last_saved] = chart.name.gsub(" ", "_")
				flash[:notice] = 'Changes Discarded'
				redirect_to :action => 'index', :project_id => @project.id

			elsif (chart)
				update_chart_data = JSON.parse(params[:chart_data])
				flash[:notice] = 'Updated OK'

				if ((error = chart.update_chart( @project.id, update_chart_data )) != '')
					flash[:alert] = error
				else
					# now all the issues have been created, now connect all the issues
					chart.connect_issues update_chart_data
				end

				# Update the chart ok
				session[:last_saved] = chart.name.gsub(" ", "_")
				redirect_to :action => 'index', :project_id => @project.id
			else
				flash[:alert] = 'Could not find the chart to update it'
			end
		else
			flash[:alert] = 'Internal State Error - Please try again.'
			redirect_to :action => 'index', :project_id => @project.id
		end
	end

	private

	def find_project
		# @project variable must be set before calling the authorize filter
		@project = Project.find(params[:project_id])
	end

	def find_chart
		@chart = PerttChart.find(params[:id])
		@project = Project.find(@chart.project_id)
	end
end
