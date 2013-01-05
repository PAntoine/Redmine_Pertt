class PerttJob < ActiveRecord::Base
	has_many	:pertt_links, :dependent => :destroy
	belongs_to	:pertt_chart, :inverse_of => pertt_job
	validates_presence_of :name, :pertt_chart_id, :owner
end
