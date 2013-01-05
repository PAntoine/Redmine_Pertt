class PerttController < ApplicationController
  unloadable

  def index
	@charts = PerttChart.all
  end

  def create
  	if request.post?
		@chart = PerttChart.new(params[:pertt_chart])

		puts '---------------------------------'
		puts params[:pertt_chart]
		puts '---------------------------------'

		if @chart.save
			redirect_to :action => 'index', :notice => 'Saved Ok'
		end
	else
	  	@chart = PerttChart.new
	end
  end

  def edit
  end

  def update
  end

  def show
  end
end
