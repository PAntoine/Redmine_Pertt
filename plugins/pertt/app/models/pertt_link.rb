class PerttLink < ActiveRecord::Base
	belongs_to	:pertt_job, :inverse_of => pertt_links
end
