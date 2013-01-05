class PerttChart < ActiveRecord::Base
	has_many :pertt_jobs, :dependent => :destroy
	validates_presence_of	:name
	validates_uniqueness_of	:name, :case_sensitive => false

	unloadable
end
