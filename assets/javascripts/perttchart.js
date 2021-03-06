/*--------------------------------------------------------------------------------*
 *  ,-----.                 ,--.    ,--.     ,----. ,--.                   ,--.  
 *  |  .-. | ,---. ,--.--.,-'  '-.,-'  '-.  '  .-./ |  |    ,--.-.,--.--.,-'  '-.
 *  |  '-' || .-. :|  .--''-.  .-''-.  .-'  |  |  _ |  '--.| .-. ||  .--''-.  .-'
 *  |  |--' \   --.|  |     |  |    |  |    '  '-' ||  .  |' '-' ||  |     |  |  
 *  `--'     `----'`--'     `--'    `--'     `----' `--'--' `--'-'`--'     `--'  
 *    file: perttchart
 *    desc: This file holds the JavaScript functions for drawing the JavaScript
 *          Pertt chart.
 *
 *  author: Peter Antoine
 *    date: 22/12/2012 14:19:46
 *--------------------------------------------------------------------------------*
 *                     Copyright (c) 2012 Peter Antoine
 *                            All rights Reserved.
 *                    Released Under the Artistic Licence
 *--------------------------------------------------------------------------------*/

/*--------------------------------------------------------------------------------*
 * The global static items.
 *--------------------------------------------------------------------------------*/
var job_list;
var seconds_in_day = 86400;

var chart_name				= '';
var chart_updated			= 0;
var hotspot_list			= [];
var group_space_gap			= 30;		/* pixel space used for the group arrows */
var chart_dirty				= false;	/* has the chart been changed */
var chart_popup_active		= false;	/* is there a popup on the screen */
var	chart_current_job		= 1;		/* the currently selected job on the screen */
var chart_button_list		= [];		/* the list of buttons on the current popup */
var chart_current_button	= 0;
var chart_seconds_per_day	= seconds_in_day;
var date_obj				= new Date();


var chart_start_day_time	= 32400;

/*--------------------------------------------------------------------------------*
 * The buttons for the popups
 *--------------------------------------------------------------------------------*/
var button_text = new Array();
button_text['edit'] = 'Edit Task';
button_text['save'] = 'Save';
button_text['cancel'] = 'Cancel';
button_text['subitem'] = 'Add Sub-Task';
button_text['parallel'] = 'Add Concurrent Task';
button_text['previous'] = 'Insert Task Before';
button_text['after'] = 'Insert Task After';
button_text['delete'] = 'Delete Task';
button_text['create'] = 'Create';

/*--------------------------------------------------------------------------------*
 * Date functions.
 *--------------------------------------------------------------------------------*/
var date_map = [];
date_map['m'] = 60;
date_map['min'] = 60;
date_map['mins'] = 60;
date_map['minute'] = 60;
date_map['minutes'] = 60;
date_map['h'] = 60*60;
date_map['hour'] = 60*60;
date_map['hours'] = 60*60;
date_map['d'] = 24*60*60; 
date_map['day'] = 24*60*60;
date_map['days'] = 24*60*60;

/* regex's for the date parses */
var regex_short_time = /^([0-9]*|[0-9]*\.[0-9]*)\s*(m|h|d|mins|day|days|hour|hours|minute|minutes)$/;
var regex_long_time = /^([0-9]*)?\s(h|d|min|day|days|hour|hours),?\s*([0-9]*)?\s(m|h|min|hour|hours|minute|minutes)$/;

function parseDateString(date_string)
{
	var parsed_date;
	var duration = 0;

	if (parsed_date = regex_short_time.exec(date_string))
	{
		var duration = parsed_date[1] * (date_map[parsed_date[2]]);
	}
	else if (parsed_date = regex_long_time.exec(date_string))
	{
		var duration = (parsed_date[1] * date_map[parsed_date[2]]) + (parsed_date[3] * date_map[parsed_date[4]]);
	}

	return duration;
}

/*--------------------------------------------------------------------------------*
 * SetWeek
 *
 * This function will set the week variables that are used to calculate the day
 * offsets.
 *--------------------------------------------------------------------------------*/
function SetWeek(start_day,week_days,day_length_secs)
{
	/* create the arrays that are required */
	day_of_week		= [0,0,0,0,0,0,0];
	weekend			= [0,0,0,0,0,0,0];
	minus_mask		= [1,0,0,0,0,0,0];
	days_to_week	= [0,0,0,0,0,0,0]; 

	/* set the week layout */
	for (var index=0; index < 7; index++)
	{
		day_of_week[index] = ((index + 7) - start_day) % 7;

		if (day_of_week[index] >= week_days)
		{
			day_of_week[index] = 0;

			days_to_week[index] = (7 - index + start_day) % 7;		/* days till the start of week */
			weekend[index] = 1;
		}
	}

	/* set the start of week */
	start_of_week = start_day;
	days_per_week = week_days;
	seconds_per_day = day_length_secs;

	weekend_length = 7 - days_per_week;
}

/*--------------------------------------------------------------------------------*
 * CalculateEndTime
 *
 * This function will calculate the end time of a job. It will take the start time
 * as a unix epoc time and then calculate the end time of the job talking into 
 * account the number of days in a week and the start day of the object.
 *
 * NOTE: if the start day is not within the "week" then the dates will be out.
 *--------------------------------------------------------------------------------*/
function CalculateEndTime(job)
{
	var old_end_date = job.end_date;
	var old_start_date = job.start_date;

	/* get the start time */
	if (job.prev_job != 0)
	{
		job.start_date = job_list[job.prev_job].end_date;
	}
	else
	{
		job.start_date = job_list[job.owner].start_date;
	}

	/* check that start_date does not need to rollover */
	var day_start		= Math.floor(job.start_date / seconds_in_day) * seconds_in_day;
	var remain_of_day	= (job.start_date - day_start) % seconds_per_day;
	job.start_date		= day_start + (Math.floor((job.start_date - day_start) / seconds_per_day) * seconds_in_day) + remain_of_day;
	
	date_obj.setTime(job.start_date * 1000);
	var start_day	= date_obj.getDay();

	/* get the start day out of the weekend */
	job.start_date	+= days_to_week[start_day] * seconds_in_day;	

	/* get the time offset from the start (0:00) of day */
	var day_start = (Math.floor(job.start_date / seconds_in_day) * seconds_in_day);

	/* calc number of working day for the duration */
	if (job.duration > 0)
	{
		var num_days_ratio = (remain_of_day + job.duration - 1) / seconds_per_day;
		var num_days = Math.floor(num_days_ratio);
		var remains = Math.floor((0.000001 + num_days_ratio - num_days) * seconds_per_day) + 1; // Include nasty hack to get around rounding error
	}
	else
	{
		var num_days_ratio = 0;
		var num_days = 0;
		var remains = 0;
	}

	/* calculate the weekends */
	var weekends    = Math.floor(((day_of_week[start_day] + num_days) / days_per_week) + weekend[start_day]);
	var end_day     = Math.floor((day_of_week[start_day] + num_days) % days_per_week);

	/* if 1 or more 1 working weeks, and the week starts on the first day of the week
	 * then the count will include one too many weekends. Needs to be removed.
	 */
	if (weekends > 0)
	{
		weekends -= minus_mask[end_day];
	}

	/* add the duration in working time to the start time */
	job.end_date = day_start + ((num_days + (weekends * weekend_length)) * seconds_in_day) + remains;

	/* do we need to update the server for the job changes */
	if (old_start_date != job.start_date || old_end_date != job.end_date)
	{
		job.amended = true;
	}
}

/*--------------------------------------------------------------------------------*
 * job
 * This is the job object constructor.
 *
 * The job object is the item that holds the issue context. The structure of the
 * job item is:
 *
 *  name 		The is the name of the job item.
 *  owner		This is the job item that this job is a sub-item of.
 *  job_status	The current status of the job {'waiting','started','complete'}.
 *	duration	The estimated (or actual) length of the job, in minutes.
 *	start_date	This is the start (or estimated start) date for the job.
 *	prev_job	The job the this is dependant on.
 *  next_job	This this is the job that follows this job.
 *	terminal	This is a leaf (real) job.
 *	description	This the description of the job.
 *  hotspot		This is the hotspot that this object is interacted with.
 *  streams		This is a list of jobs that are parallel jobs that are sub-jobs
 *              of this job. This is not the complete list of jobs that are owned
 *              by this job, just the first job in the list for that set of jobs.
 *--------------------------------------------------------------------------------*/
function job_addHotSpot(hotspot)
{
	this.hotspot = hotspot;
}

function GenerateDateString(date)
{
	result = date.getFullYear() + "/";

	if (date.getMonth() < 9)
		result += "0" + (date.getMonth() + 1) + "/";
	else
		result += (date.getMonth() + 1) + "/";

	if (date.getDate() < 10)
		result += "0" + date.getDate();
	else
		result += date.getDate();

	return result;
}

function job_getDateString()
{
	if (this.duration == 0)
	{
		var string = '';
	}
	else
	{
		var start_date = new Date(this.start_date * 1000);

		if (this.job_status == "complete")
		{
			string = GenerateDateString(start_date) + " - " + GenerateDateString(new Date(this.end_date * 1000));
		}
		else
		{
			hours	= ((this.duration % chart_seconds_per_day) / (60 * 60)).toFixed(2);
			string	= GenerateDateString(start_date) + " - " + Math.floor(this.duration / chart_seconds_per_day) + ":" + hours;
		}
	}

	this.date_string = string;


	return string;
}

function job_calculateBoxSize(context,enclosing_hotspot)
{
	if (this.streams.length == 0)
	{
		/* need to calculate the end time */
		CalculateEndTime(this);

		/* ok, leaf box, just add our own size */
		this.getDateString();
		DP_getDoubleBoxSize(context,this);
	}
	else
	{
		var width = 0;
		var height = 0;
		var max_duration = 0;
		var critical_path = 0;

		/* get the start time */
		/* TODO: amended flag? */
		if (this.prev_job != 0)
		{
			this.start_date = job_list[this.prev_job].end_date;
		}
		else
		{
			this.start_date = job_list[this.owner].start_date;
		}

		/* ok, we have sub-jobs calc the size based on this */
		for (var index=0; index < this.streams.length; index++)
		{
			/* re-initialise the container hotspot */
			this.hotspots[index].x		= 0;
			this.hotspots[index].y		= 0;
			this.hotspots[index].width	= 0;
			this.hotspots[index].height = 0;
			this.hotspots[index].active = false;

			/* now walk down the list of boxes per level */
			var job_id = this.streams[index];

			var stream_duration = 0;

			while (job_id != 0)
			{
				var box = job_list[job_id];
			
					/* create the enclosing box */
				box.calculateBoxSize(context,this.hotspots[index]);

				/* get the total duration of the stream */
				stream_duration += box.duration;

				this.hotspots[index].width += DP_BOX_SPACING;
				var job_id = box.getNextJob();
			}

			/* update the duration */
			if (stream_duration > max_duration)
			{
				max_duration = stream_duration;
				critical_path = index;
			}

			/* add to the size of the enclosing box */
			height += this.hotspots[index].height;

			if (width < (this.hotspots[index].width + DP_BOX_TOTAL_SPACING))
			{
				width = this.hotspots[index].width + DP_BOX_TOTAL_SPACING;
			}
		}

		/* set the size of the current hotspot */
		this.hotspot.width = width + (group_space_gap * 2);
		this.hotspot.height = height;

		/* update the duration */
		this.duration = max_duration;
		this.critical_path = critical_path;

		/* update the end-time */
		CalculateEndTime(this);
	}
		
	/* adjust the size of the enclosing hotspot */
	if (enclosing_hotspot.height < (this.hotspot.height + DP_BOX_TOTAL_SPACING))
	{
		enclosing_hotspot.height = this.hotspot.height + DP_BOX_TOTAL_SPACING;
	}

	enclosing_hotspot.width += this.hotspot.width;

	return this.hotspot;
}

function job_paint(context,x,y,repaint)
{
	if (this.streams.length == 0)
	{
		var colour = '#fff';

		if (this.id == chart_current_job)
		{
			var colour = '#ff0';
		}
		else
		{
			switch(this.job_status)
			{
				case 'complete':	colour = '#eee';	break;
				case 'started':		colour = '#0f9';	break;
			}
		}

		/* ok, leaf box, just draw it */
		DP_drawTextDoubleBoxRounded(context,x,y,this.name,this.date_string,colour,repaint);
	
		/* this is a leaf item, needs to be added to hotspot list so it can be selected */
		this.hotspot.y = y;
		this.hotspot.x = x;
		this.hotspot.id = hotspot_list.length;
		hotspot_list.push(this.hotspot);
	}
	else
	{
		/* var, all items are drawn inside my area box */
		var stream_y = y;
		var group_x	= x + group_space_gap;
		
		/* ok, we have sub-jobs calc the size based on this */
		for (var index=0; index < this.streams.length; index++)
		{
			/* set the x-offset from the outer box */
			var my_x = x + ((this.hotspot.width - this.hotspots[index].width) / 2);
			var stream_off_x = my_x-group_x;
			var stream_off_y = stream_y + (this.hotspots[index].height/2);

			/* now walk down the list of boxes per level */
			var job_id = this.streams[index];
			var box = job_list[job_id];
		
			if (box.id != 1)
			{
				/* draw line from outer box middle to stream middle */
				DP_drawBoxCurve(context,x,y+(this.hotspot.height/2),group_x,stream_off_y);

				/* draw the line from the group boundary to the box boundary */
				DP_drawStraightArrow(context,group_x,stream_off_y,stream_off_x,0,0);
			}
	
			while (job_id != 0)
			{
				box = job_list[job_id];
				/* increment the offset and do next */
				box_x = my_x + DP_BOX_SPACING;
				var box_y = stream_y + ((this.hotspots[index].height - box.hotspot.height) / 2);
			
				if (box.id != 1)
				{
					if (box.terminal)
					{
						DP_drawStraightArrow(context,my_x,stream_off_y,box_x-my_x,0,1);
					}
					else
					{
						DP_drawStraightArrow(context,my_x,stream_off_y,box_x-my_x,0,0);
					}
				}

				/* paint the box */
				box.paint(context,box_x,box_y,false);
		
				/* only paint the end line if it is a real box */
				if (box.id != 2 && box.terminal)
				{
					DP_drawStraightArrow(context,my_x+box.hotspot.width+DP_BOX_SPACING,stream_off_y,box_x-my_x,0,0);
				}

				/* get next job */
				my_x += box.hotspot.width + DP_BOX_SPACING;
				
				job_id = box.getNextJob();
			}

			if (job_list[this.streams[index]].id != 1)
			{
				/* draw the line from the group boundary to the box boundary */
				DP_drawStraightArrow(context,my_x,stream_off_y,stream_off_x,0,0);

				/* draw line from outer box middle to stream middle */
				DP_drawBoxCurve(context,my_x+stream_off_x,stream_off_y,x+this.hotspot.width,y+(this.hotspot.height/2));
			}

			/* next row */
			stream_y += this.hotspots[index].height;
		}
	}
}

function job_addNextJob(job)
{
	/* set up the new objects pointers */
	job.next_job = this.next_job;
	job.prev_job = this.id;

	if (this.next_job != 0)
	{
		job_list[this.next_job].prev_job = job.id;
		job_list[this.next_job].amended = true;
	}

	/* now set up this object */
	this.next_job = job.id;

	/* now mark then as amended */
	this.amended = true;
}

function job_addPrevJob(job)
{
	job.next_job = this.id;
	job.prev_job = this.prev_job;

	if (this.prev_job != 0)
	{
		/* easy insert - just add to the linked list */
		job_list[this.prev_job].next_job = job.id;
		job_list[this.prev_job].amended = true;
		
		this.prev_job = job.id;
	}
	else
	{
		for (index=0; index < job_list[this.owner].streams.length; index++)
		{
			if (job_list[this.owner].streams[index] == this.id)
			{
				job_list[this.owner].streams[index] = job.id;
				job_list[this.owner].amended = true;

				job.first_job = true;
				this.first_job = false;
				break;
			}
		}
	}

	job.owner = this.owner;
	this.prev_job = job.id;
	this.amended = true;
}

function job_addSubJob(job)
{
	this.streams.push(job.id);
	this.hotspots.push(new Hotspot(0,0,0,0,this,false));

	/* this has sub-jobs so not an active hotspot */
	this.hotspot.active = false;
	job.first_job = true;

	this.terminal = false;
	this.amended  = true;
}

function job_findPreviousJob()
{
	var result = this.id;

	if (this.id != 1)
	{
		var current = this.id;

		do
		{
			/* ok, at start of box, goto the owner */
			if (job_list[current].prev_job == 0)
			{
				current = job_list[current].owner;
			}
			else
			{
				current = job_list[current].prev_job;

				/* ok, if we are walking into a box then we need to get the last item in the box */
				if (job_list[current].streams.length != 0)
				{
					/* start at the first item in the box - into nested boxes */
					while (job_list[current].streams.length != 0)
					{
						current = job_list[current].streams[0];
					}

					/* walk forward until we find the end of the box */
					while(job_list[current].next_job != 0)
					{
						current = job_list[current].next_job;

						if (job_list[current].streams.length > 0)
						{
							current = job_list[current].streams[0];
						}
					}
				}
			}
		}
		while(current > 1 && job_list[current].terminal != true);

		result = current;
	}

	return result;
}

function job_findNextJob()
{
	var result = this.id;

	if (this.id != 2)
	{
		var current = this.id;

		do
		{
			if (job_list[current].next_job != 0)
			{
				current = job_list[current].next_job;
			}
			else
			{
				/* ok, end of current - need to go owner->next */
				do
				{
					current = job_list[current].owner;
				}
				while (job_list[current].next_job == 0);

				current = job_list[current].next_job;
			}

			while (job_list[current].streams.length != 0)
			{
				/* start at the first item in the box */
				current = job_list[current].streams[0];
			}
		}
		while(current != 0 && current != 2 && !job_list[current].terminal);

		result = current;
	}

	return result;
}

function job_findBelowJob()
{
	var result = this.id;

	if (this.id != 1 && this.id != 2)
	{
		var current = this.id;

		do
		{
			/* find the first item in the stream */
			while (!job_list[current].first_job && current.id != 1)
			{
				current = job_list[current].prev_job;
			}

			if (job_list[current].first_job)
			{
				var found = false;

				for (var index=0; index < job_list[job_list[current].owner].streams.length; index++)
				{
					if (job_list[job_list[current].owner].streams[index] == current)
					{
						if (job_list[job_list[current].owner].streams.length > (index + 1))
						{
							/* it's good */
							current = job_list[job_list[current].owner].streams[index+1];
							found = true;
						}
						break;
					}
				}

				if (found)
				{
					break;
				}
				else
				{
					/* ok, we need to walk up a link to find it */
					current = job_list[current].owner;
				}
			}
		} 
		while (current > 1);

		if (current > 1)
		{
			while (!job_list[current].terminal)
			{
				current = job_list[current].streams[0];
			}

			result = current;
		}
	}

	return result;
}

function job_findAboveJob()
{
	var result = this.id;

	if (this.id > 2)
	{
		var current = this.id;

		do
		{
			/* find the first item in the stream */
			while (!job_list[current].first_job && current != 1)
			{
				current = job_list[current].prev_job;
			}

			if (job_list[current].first_job)
			{
				var found = false;

				for (var index=0; index < job_list[job_list[current].owner].streams.length; index++)
				{
					if (job_list[job_list[current].owner].streams[index] == current)
					{
						if (index > 0)
						{
							/* it's good */
							current = job_list[job_list[current].owner].streams[index-1];
							found = true;
						}
						break;
					}
				}

				if (found)
				{
					break;
				}
				else
				{
					/* ok, we need to walk up a link to find it */
					current = job_list[current].owner;
				}
			}
		} 
		while (current > 1);

		if (current != 1)
		{
			while (!job_list[current].terminal)
			{
				current = job_list[current].streams[job_list[current].streams.length - 1];
			}

			result = current;
		}
	}

	return result;
}

function job_getNextJob()
{
	return this.next_job;
}

function job_cutJob()
{
	if (this.prev_job != 0)
	{
		/* this is an easy delete, just remove it from the linked list */
		job_list[this.prev_job].next_job = this.next_job;
		job_list[this.prev_job].amended = true;

		if (job_list[this.next_job] != 0)
		{
			job_list[this.next_job].prev_job = this.prev_job;
			job_list[this.next_job].amended = true;
		}
	}
	else
	{	
		/* painful delete have to play with the owner */
		for (var index=0; index < job_list[this.owner].streams.length; index++)
		{
			if (job_list[this.owner].streams[index] == this.id)
			{
				/* don't play with the hotspots - let the paint do that */
				if (this.next_job == 0)
				{
					/* ok, we have found the one we want - only item - just remove the stream */
					job_list[this.owner].streams.splice(index,1);
					job_list[this.owner].hotspots.splice(index,1);
					job_list[this.owner].amended = true;
				}
				else
				{
					/* just remove the first job in the list */
					job_list[this.owner].streams[index] = this.next_job;
					job_list[this.next_job].prev_job  = 0;
					job_list[this.next_job].first_job = true;

					job_list[this.owner].amended = true;
					job_list[this.next_job].amended = true;
				}
				break;
			}
		}

		if (job_list[this.owner].streams.length == 0)
		{
			/* ok, we are now a terminal job */
			job_list[this.owner].terminal = true;
			job_list[this.owner].hotspot.active = true;
		}
	}
}

function job_addMethods(job)
{
	job.paint				= job_paint;
	job.cutJob				= job_cutJob;
	job.addSubJob			= job_addSubJob;
	job.addHotSpot			= job_addHotSpot;
	job.addNextJob			= job_addNextJob;
	job.addPrevJob			= job_addPrevJob;
	job.getNextJob			= job_getNextJob;
	job.findNextJob			= job_findNextJob;
	job.findBelowJob		= job_findBelowJob;
	job.findAboveJob		= job_findAboveJob;
	job.getDateString		= job_getDateString;
	job.findPreviousJob		= job_findPreviousJob;
	job.calculateBoxSize	= job_calculateBoxSize;
}

function Job(name,description)
{
	/* get the date and round it down to beginning of the day */
	var date = (new Date()).getTime() / 1000;
	var start_time = (Math.floor(date / seconds_in_day) * seconds_in_day);

	/* set the standard items */
	this.name			= name;
	this.owner			= 0;
	this.next_job		= 0;
	this.prev_job		= 0;
	this.job_status		= 'waiting';
	this.hotspot		= null;
	this.terminal		= true;
	this.first_job		= false;
	this.start_date		= start_time;
	this.end_date		= this.start_date;
	this.duration		= seconds_per_day;			/* defaults to a day */
	this.description	= description;

	/* set the sub-items that the job have to have */
	this.streams	= [];

	/* set the hotspots for the sub-items */
	this.hotspots	= [];

	/* add the methods to the object */
	job_addMethods(this);

	/* now add the job to the job list */
	this.id = job_list.length;
	job_list.push(this);
}

/*--------------------------------------------------------------------------------*
 * deleteJob
 * This function will delete a job and handle the clean up.
 * The does not actually delete the job from the list but marks it as deleted so
 * that the server can handle removing the job from the database.
 *--------------------------------------------------------------------------------*/
function deleteJob(job)
{
	/* mark it a deleted */
	job.deleted = true;

	/* move the selected pointer */
	if (job.id == chart_current_job)
	{
		chart_current_job = job.findPreviousJob();
	}

	job.cutJob();

	/* now store the updated chart */
	StoreChart();
	repaint(pertt_canvas_id);
}

/*--------------------------------------------------------------------------------*
 * updateJob
 *
 * hotspot		The id of the hotspot that is attached to amended item.
 * name			The new name.
 * description	The new description.
 *--------------------------------------------------------------------------------*/
function updateJob(hotspot, name, description, duration)
{
	hotspot_list[hotspot].job.name = name;
	hotspot_list[hotspot].job.description = description;
	hotspot_list[hotspot].job.amended = true;
	hotspot_list[hotspot].job.duration = parseDateString(duration);


	/* been created you are now current */
	chart_current_job = hotspot_list[hotspot].job.id;

	/* now store the updated chart */
	StoreChart();
	repaint(pertt_canvas_id);
}
	
/*--------------------------------------------------------------------------------*
 * createJob
 * This function will create the job, it will also create the hotspot for the job
 * and add it to the hotspot list.
 *
 * hotspot		The id of the hotspot that is attached to the owner of the new job.
 * name			The name of the new job.
 * description	The description of the new job.
 * parameter	This is a parameter that informs what sort of item to create.
 *--------------------------------------------------------------------------------*/
function createJob(hotspot, name, description, duration, parameter)
{
	var owner = 0;
	var new_job = new Job(name,description);
	var new_hotspot = new Hotspot(0,0,0,0,new_job,true);
	
	new_job.addHotSpot(new_hotspot);
	new_job.created = true;
	new_job.duration = parseDateString(duration);

	switch(parameter)
	{
		case 'parallel':
				/* add parallel job to the current job */
				new_job.owner = hotspot_list[hotspot].job.owner;
				job_list[new_job.owner].addSubJob(new_job);
				break;

		case 'subitem': 
				/* create a sub-job of the current one */
				new_job.owner = hotspot_list[hotspot].job.id;
				job_list[hotspot_list[hotspot].job.id].addSubJob(new_job);
				break;

		case 'after':
				new_job.owner = hotspot_list[hotspot].job.owner;
				job_list[hotspot_list[hotspot].job.id].addNextJob(new_job);
				break;

		case 'previous':
				new_job.owner = hotspot_list[hotspot].job.owner;
				job_list[hotspot_list[hotspot].job.id].addPrevJob(new_job);
				break;
	}

	/* been created you are now current */
	chart_current_job = new_job.id;

	/* now store the updated chart */
	StoreChart();

	repaint(pertt_canvas_id);
}
		
/*--------------------------------------------------------------------------------*
 * hotspot
 * This object type is the hotspot on the screen that the click or touch will
 * work with.
 *
 * This is part of a list of touch points on the screen that can be interacted
 * with. All hotspots are the same height. It has the following structure:
 *
 * x		This the x position of the top left corner.
 * y		This is the y position of the top left corner.
 * width	This is the width of the hotspot.
 * owner	This is the job that owns the hotspot.
 *--------------------------------------------------------------------------------*/
function Hotspot(x,y,width,height,owner,active)
{
	this.x		= x;
	this.y		= y;
	this.width	= width;
	this.height	= height;
	this.active	= active;
	this.job	= owner;
}

/*--------------------------------------------------------------------------------*
 * The functions that handle the Pertt Chart.
 *--------------------------------------------------------------------------------*/

/*--------------------------------------------------------------------------------*
 * createButton
 *
 * This function will create a button for the given string.
 *
 * parameters:
 * 	type		This is the type of pop-up that is to be displayed.
 * 	hotspot		The hotspot for the action that was originally created.
 *	parameter	This is a parameter to pass into the button handler.
 *
 * returns:
 *  The button text for the button that was created.
 *
 *--------------------------------------------------------------------------------*/
function createButton(type,hotspot,parameter)
{
	chart_button_list.push("button_" + type);

	return '<div class="popup_button rounded_bottom rounded_top shadow" id="button_' + type +
			'" onClick="actionButtonPress(\'' +
			type + '\', ' + hotspot + ',\'' +
			parameter + '\');">' + button_text[type] +'</div>';
}

/*--------------------------------------------------------------------------------*
 * createTextBox
 *
 * This function will create a named text box.
 *
 * parameters:
 * 	id			The id of the text box.
 * 	name		The name of the text box, this will be used for the label.
 * 	width		The number of characters allowed in the text box.
 * 	max_length	The max number of characters in the string.
 * 	value		The value to display.
 *
 * returns:
 *  The text for the text box that was created.
 *--------------------------------------------------------------------------------*/
function createTextBox(id, name, value, width, max_length)
{
	return '<div class="popup_input rounded_bottom rounded_top shadow"> ' +
			name + ': <input class="popup_textinput" id="' +
			id + '" type="text" size="' +
			width + '" maxlength="' +
			max_length + '" value="' +
			value + '"/></div>';
}

/*--------------------------------------------------------------------------------*
 * createTextArea
 *
 * This function will create a named text area.
 *
 * parameters:
 * 	id		The id of the text box.
 * 	value	This is the text in the text box.
 * 	name	The name of the text box, this will be used for the label.
 * 	columns	The width of the text box.
 *
 * returns:
 *  The text for the text area.
 *--------------------------------------------------------------------------------*/
function createTextArea(id, name, value, columns)
{
	return '<div class="popup_input rounded_bottom rounded_top shadow"><label class="popup_null">' + name +
			': </label><textarea class="popup_textinput" id="' + id + '" cols="' + columns + '">' +
			value + '</textarea></div>';
}

/*--------------------------------------------------------------------------------*
 * actionButtonPress
 *
 * This function will handle the button press and action the key push.
 *
 * parameters:
 * 	type	This is the type of pop-up that is to be displayed.
 *--------------------------------------------------------------------------------*/
function actionButtonPress(type,hotspot,parameter)
{
	if (type == 'save' || type == 'create')
	{
		/* values */
		var name = document.getElementById('name').value;
		var desc = document.getElementById('description').value;
		var dura = document.getElementById('duration').value;
	}
	else
	{
		var name = '';
		var desc = '';
		var dura = chart_seconds_per_day;
	}

	/* remove old window */
	element = document.getElementById('popup');
	element.style.display = "none";
	chart_popup_active = false;

	/* now handle the action on the new window */
	switch(type)
	{
		case 'edit':
		case 'after':
		case 'parallel':
		case 'previous':
		case 'subitem':	showPopup(type, hotspot); 							break;
		case 'delete':	deleteJob(job_list[hotspot_list[hotspot].job.id]);	break;
		case 'create':	createJob(hotspot,name,desc,dura,parameter);		break;
		case 'save': 	updateJob(hotspot,name,desc,dura);					break;
	}
}

/*--------------------------------------------------------------------------------*
 * createEditPopup
 *
 * This function will create the popups.
 *
 * parameters:
 *	button		The main button for the popup.
 *	title		The title string for the popup.
 *	hotspot		The hotspot to attach the button to.
 *  type		the button type.
 *  use_values	If true then use the values from the hotspot job.
 *
 * return:
 * 	html string for the edit popup.
 *--------------------------------------------------------------------------------*/
function createEditPopup(button,title,hotspot,type,use_values)
{
	var html_text = title + ": ";

	if (use_values)
	{
		var name		= hotspot_list[hotspot].job.name;
		var duration  	= (hotspot_list[hotspot].job.duration / chart_seconds_per_day) + " days";
		var description	= hotspot_list[hotspot].job.description;
	}
	else
	{
		var name		= 'new job';
		var duration  	= '1 day';
		var description	= '';
	}

	html_text += hotspot_list[hotspot].job.name + "<p>";
	html_text += createTextBox('name','Name',name,80,120);
	html_text += createTextArea('description','Description',description,80);
	html_text += createTextBox('duration','Duration',duration,80,120);
	html_text += createButton(button,hotspot,type);

	return html_text;
}

/*--------------------------------------------------------------------------------*
 * showPopup
 *
 * This function will show the display the popup on the screen. This function will
 * select the inner page from the type parameter.
 *
 * parameters:
 * 	type	This is the type of pop-up that is to be displayed.
 * 	hotspot	This is the index number of the hotspot.
 * 	target	The item that was selected.
 *--------------------------------------------------------------------------------*/
function showPopup(type, hotspot, target)
{
	var element, x, y, width, height;
	var focus = '';
	var create_save = 'create';
	var new_edit	= 'new';
	var use_values	= false;

	/* what happens when the 'return' key is pressed */
	chart_default_hotspot = hotspot;
	chart_default_parameter = '';

	if (target)
	{
		/* been clicked on you are now current */
		ChangeSelection(target,hotspot_list[hotspot].job.id);
	}

	/* the popup that is in the html - position it near the element being amended */
	element = document.getElementById('popup');
	element.style.left = (hotspot_list[hotspot].x + hotspot_list[hotspot].width + 10) + "px";
	element.style.top = (hotspot_list[hotspot].y + 10) + "px";

	/* only want new buttons */
	chart_button_list = [];

	switch(type)
	{
		/* basic click/touch on an element */
		case 'select':	html_text = "amend: " + hotspot_list[hotspot].job.name + "<p>";
						html_text += createButton('edit',hotspot,0);

						if (hotspot_list[hotspot].job.id == 1)
						{
							html_text += createButton('after',hotspot,0);
						}
						else
						{
							html_text += createButton('subitem',hotspot,0);

							if (hotspot_list[hotspot].job.first_job)
							{
								html_text += createButton('parallel',hotspot,0);
							}

							html_text += createButton('previous',hotspot,0);
							html_text += createButton('after',hotspot,0);
							html_text += createButton('delete',hotspot,0);
						}
						break;

		case 'subitem':	
						html_text = createEditPopup('create','Sub Item',hotspot,type,false);
						focus = 'name';
						chart_default_parameter = type;
						break;

		case 'edit':	create_save = 'save';
						new_edit	= 'edit';
						use_values	= true;
		case 'after':
		case 'parallel':
		case 'previous':
						html_text = createEditPopup(create_save,new_edit,hotspot,type,use_values);
						focus = 'name';
						chart_default_parameter = type;
						break;


		default:		html_text = "INTERNAL ERROR: unknown popup type";
	}
	
	html_text += createButton('cancel',hotspot);

	/* display the popup */
	element.innerHTML = html_text;
	element.style.display = "block";
	chart_popup_active = true;

	/* the current selected button */
	chart_current_button = 0;
	SetButtonSelection(0);

	if (focus != '')
	{
		document.getElementById(focus).focus()
	}
}

/*--------------------------------------------------------------------------------*
 * SetButtonSelection
 * This function will set the button selection for the popup.
 *--------------------------------------------------------------------------------*/
function SetButtonSelection(selected_item)
{
	var selection = selected_item;

	if (selected_item >= chart_button_list.length)
	{
		selection = 0;
	}
	else if (selected_item < 0)
	{
		selection = chart_button_list.length - 1;
	}
	
	/* change to background colour - but should use CSS but that is not fully supported on all browsers */
	document.getElementById(chart_button_list[chart_current_button]).className = "popup_button rounded_bottom rounded_top shadow";
	document.getElementById(chart_button_list[selection]).className = "popup_button_selected rounded_bottom rounded_top shadow"

	chart_current_button = selection;
}

/*--------------------------------------------------------------------------------*
 * touchListenerFunction
 *
 * This function will handle the touches/clicks from the canvas.
 *--------------------------------------------------------------------------------*/
function touchListenerFunction(e)
{
	/* need to adjust the pointer to the canvas */
	var mouse_x = e.clientX - e.target.offsetLeft;
	var mouse_y = e.clientY - e.target.offsetTop;

	for (var index=0; index < hotspot_list.length; index++)
	{
		if (((hotspot_list[index].x <= mouse_x) && (mouse_x <= (hotspot_list[index].x + hotspot_list[index].width))) &&
		    ((hotspot_list[index].y <= mouse_y) && (mouse_y <= (hotspot_list[index].y + hotspot_list[index].height))))
		{
			if (hotspot_list[index].job.id != 2)
			{
				showPopup('select',index,e.target);
			}
			break;
		}
	}
}

/*--------------------------------------------------------------------------------*
 * keypressHandler
 * This function will handle the keypresses attached to the page.
 *--------------------------------------------------------------------------------*/
function keypressHandler(e)
{
	var event = e || window.event;

	var keycode = event.charCode || event.keyCode;
	

	if (chart_popup_active)
	{
		var action  = chart_button_list[chart_current_button].substr(7);

		switch (keycode)
		{
			case 13:	actionButtonPress(action,chart_default_hotspot,chart_default_parameter);	break;	/* return */
			case 27:	actionButtonPress('cancel');												break;	/* escape */
			case 38:	SetButtonSelection(chart_current_button - 1);								break;	/* up arrow */
			case 40:	SetButtonSelection(chart_current_button + 1);								break;	/* down arrow */
		}
	}
	else
	{
		/* TODO: hack */
		var canvas = document.getElementById(pertt_canvas_id);


		switch (keycode)
		{
			case 37:	ChangeSelection(canvas,job_list[chart_current_job].findPreviousJob());		break;	/* left arrow */
			case 38:	ChangeSelection(canvas,job_list[chart_current_job].findAboveJob());			break;	/* up arrow */
			case 39:	ChangeSelection(canvas,job_list[chart_current_job].findNextJob());			break;	/* right arrow */
			case 40:	ChangeSelection(canvas,job_list[chart_current_job].findBelowJob());			break;	/* down arrow */
			case 13:	showPopup('select',job_list[chart_current_job].hotspot.id);					break;	/* select */
		}
	}
}

/*--------------------------------------------------------------------------------*
 * initialise
 * This function will initialise the canvas for drawing the pertt chart.
 * It will init the canvas and load the initial model and do the initial render.
 *--------------------------------------------------------------------------------*/
function initialise(canvas_id,import_chart)
{
	var canvas  = document.getElementById(canvas_id);
	holding_box	= new Hotspot(0,0,0,0,null,false);
	
	/* set the name for the storage keys */
	if (pertt_canvas_id === undefined)
		chart_name = "pertt_chart.default.";
	else
		chart_name = "pertt_chart." + pertt_canvas_id + "."

	/* set the day length */
	date_map['d'] = chart_seconds_per_day;
	date_map['day'] = chart_seconds_per_day;
	date_map['days'] = chart_seconds_per_day;

	/* test debug */
	SetWeek(chart_first_week_day,chart_days_per_week,chart_seconds_per_day);

	if (canvas)
	{
		var context = canvas.getContext('2d');

		if (context)
		{
			/* check to see if the job_list has been set, if not set it to the default */
			if (job_list === undefined)
			{
				var saved_chart = RetrieveChart();

				if (saved_chart != '')
				{
					LoadChart(saved_chart,0);
				}
				else if (import_chart)
				{
					LoadChart(import_chart,1);
				}
				else
				{
					job_list = Array();

					/* create the basic project */
					var base_job = new Job('project','Project Root');
					var new_hotspot = new Hotspot(0,0,0,0,base_job,false);
					base_job.created = true;
					base_job.addHotSpot(new_hotspot);

					/* now create the start job */
					var new_job = new Job('start','start');
					var new_hotspot = new Hotspot(0,0,0,0,new_job,true);
					new_job.created = true;
					new_job.duration = 0;
					new_job.addHotSpot(new_hotspot);
					new_job.owner = 0;
					base_job.addSubJob(new_job);
					new_job.job_status = 'started';

					chart_current_job = 1;

					/* now create the end job */
					var end_job = new Job('end','end of project');
					var new_hotspot = new Hotspot(0,0,0,0,end_job,true);
					end_job.created = true;
					end_job.duration = 0;
					end_job.job_status = 'complete';
					end_job.addHotSpot(new_hotspot);
					end_job.owner = 0;
					new_job.addNextJob(end_job);
				}
			}

			/* calculate the box sizes - this will need to be done once from the top level */
			job_list[0].calculateBoxSize(context,holding_box);

			/* set the canvas size to that of the toplevel box */
			canvas.width	= job_list[0].hotspot.width;
			canvas.height	= job_list[0].hotspot.height;

			/* now render the job_list */
			job_list[0].paint(context,0,0,false);

			/* finally add the onClick listener to the canvas */
			canvas.addEventListener("click", touchListenerFunction, false);

			/* ok, add the keypress listener to the body */
			document.body.onkeydown = keypressHandler;
			canvas.focus()
		}
	}
}

/*--------------------------------------------------------------------------------*
 * repaint
 * This function will repaint all the items that are in the job-list.
 *
 * parameters:
 * 	canvas_id	The ID of the job list canvas to redraw.
 *--------------------------------------------------------------------------------*/
function repaint(canvas_id)
{
	var canvas = document.getElementById(canvas_id);
	if (canvas)
	{
		canvas.focus();
		var context = canvas.getContext('2d');

		if (context)
		{
			/* empty the hotspot list on repaint - as the items add themselves back to the list */
			hotspot_list.length = 0;

			/* re-calculate the graph size */	
			job_list[0].calculateBoxSize(context,holding_box);

			/* set the canvas size to that of the toplevel box - note this also clears the canvas */
			canvas.width	= job_list[0].hotspot.width;
			canvas.height	= job_list[0].hotspot.height;

			job_list[0].paint(context,0,0,false);
		}
	}
}

/*--------------------------------------------------------------------------------*
 * ChangeSelection
 *
 * This function will change the job that is selected on the screen. It will cause
 * the previously selected job and the newly selected job to be repainted.
 *--------------------------------------------------------------------------------*/
function ChangeSelection(canvas,new_selection)
{
	if (canvas)
	{
		var context = canvas.getContext('2d');

		if (context)
		{
			var old_job = chart_current_job;
			chart_current_job = new_selection;

			/* remove selection from the old - and repaint */
			job_list[old_job].paint(context,job_list[old_job].hotspot.x,job_list[old_job].hotspot.y,true);

			/* select the new - repaint */
			job_list[chart_current_job].paint(context,job_list[chart_current_job].hotspot.x,job_list[chart_current_job].hotspot.y,true);
		}
	}
}

/*--------------------------------------------------------------------------------*
 * ParseObjects
 * This function is used by stringify to parse out the temporary objects that are
 * not required to be saved. 
 *
 * returns:
 * 	 if a single object is to be removed return 'null', if the object is to be
 * 	 removed then it returns the empty array '[]'.
 *--------------------------------------------------------------------------------*/
function ParseObjects(key,value)
{
	if (key == "hotspot")
	{
		return null;
	}
	else if (key == "hotspots") 
	{
		return [];
	}
	return value;
}

/*--------------------------------------------------------------------------------*
 * SupportsHTML5Storage
 * This function is used test for localstorage support.
 *
 * returns:
 * 	true if local storage is supported, else false.
 *--------------------------------------------------------------------------------*/
function SupportsHTML5Storage() 
{
	try
	{
		return 'localStorage' in window && window['localStorage'] !== null;
	} 
	catch (e) 
	{
		return false;
	}
}

/*--------------------------------------------------------------------------------*
 * StoreChart
 * This function is used store the current chart state.
 *
 * This will use the localstorage functions of HTML5 to store the current chart.
 * It will also update the current save time so that the chart knows that it has
 * not been updated, and an update is required.
 *
 * returns:
 * 	nothing.
 *--------------------------------------------------------------------------------*/
function StoreChart()
{
	if (SupportsHTML5Storage())
	{
		var date = new Date();

		/* set the time that the chart was last updated */
		chart_dirty = true;
		chart_updated = date.getTime();
		localStorage[chart_name + "open"] = '1';
		localStorage[chart_name + "dirty"] = '1';
		localStorage[chart_name + "lastupdate"] = chart_updated;
		localStorage[chart_name + "current_job"] = chart_current_job;

		/* set the local storage to the current chart */
		localStorage[chart_name + "chart"] = JSON.stringify(job_list,ParseObjects);
	}
}

/*--------------------------------------------------------------------------------*
 * RetrieveChart
 * This function is used retrieve the current chart state.
 *
 * This will use the localstorage functions of HTML5 to retrieve the current chart.
 * If there is not a chart saved or the browser does not support local storage
 * then this function will return the empty string.
 *
 * returns:
 *	JSON string with the saved state, else the empty string.
 *--------------------------------------------------------------------------------*/
function RetrieveChart()
{
	var result = '';

	if (SupportsHTML5Storage())
	{
		var date = new Date();

		/* set the time that the chart was last updated */
		if (localStorage[chart_name + "open"] == '1')
		{
			/* we have a stored chart */
			chart_dirty = (localStorage[chart_name + "dirty"] == '1');
			chart_updated = parseInt(localStorage[chart_name + "lastupdate"]);
			chart_current_job = localStorage[chart_name + "current_job"];
			result = localStorage[chart_name + "chart"];
		}
	}

	return result;
}

/*--------------------------------------------------------------------------------*
 * ClearChartStorage
 * This function is used clear the local storage of a chart
 *
 * This will use the localstorage functions of HTML5 to clear the chart storage.
 *
 * returns:
 * 	nothing.
 *--------------------------------------------------------------------------------*/
function ClearChartStorage()
{
	if (pertt_canvas_id === undefined)
		chart_name = "pertt_chart.default.";
	else
		chart_name = "pertt_chart." + pertt_canvas_id + "."

	if (SupportsHTML5Storage())
	{
		/* remove to items from local storage */
		localStorage.removeItem(chart_name + "open");
		localStorage.removeItem(chart_name + "dirty");
		localStorage.removeItem(chart_name + "lastupdate");
		localStorage.removeItem(chart_name + "current_job");
		localStorage.removeItem(chart_name + "chart");
	}
}

/*--------------------------------------------------------------------------------*
 * LoadChart
 * This function is used Load a chart from a JSON string.
 * This function will accept the JSON string that contains the chart and it will
 * then add the required hotspots to the chart.
 *
 * parameters:
 *	chart	string containing the JSON string with the chart data within it.
 *	objects If importing the objects are already objects.
 *
 * returns:
 *	true if the chart was loaded successfully else, false.
 *--------------------------------------------------------------------------------*/
function LoadChart(chart,objects)
{
	var result = false;

	try
	{
		/* load the chart */
		if (objects)
		{
			/* if the list ends with a null remove it */
			if (chart.length > 1 && chart[chart.length - 1] == null)
			{
				job_list = chart.slice(0,chart.length - 1);
			}
			else
			{
				job_list = chart;
			}
		}
		else
		{
			/* parse the saved string */
			job_list = JSON.parse(chart);
		}

		/* need to fixup the hotspots as these are not saved with the chart */
		for (var index=0; index < job_list.length; index++)
		{
			if (job_list[index] != null)
			{
				/* add the methods to the job */
				job_addMethods(job_list[index]);

				/* add the jobs hotspot */
				var active = (job_list[index].streams.length == 0);
				job_list[index].hotspot = new Hotspot(0,0,0,0,job_list[index],active);

				/* now add the hotspots for the streams */
				job_list[index].hotspots = [];

				for (var stream_no=0; stream_no < job_list[index].streams.length; stream_no++)
				{
					job_list[index].hotspots.push(new Hotspot(0,0,0,0,this,false));
				}
			}
		}
	}
	catch (e)
	{
		/* TODO: alert user old chart no able to be loaded */
	}

	return result;
}

/*--------------------------------------------------------------------------------*
 * GetChanges
 * This function will return an array of the job that have changed.
 *
 * returns:
 *	a JSON string of the array changes.
 *--------------------------------------------------------------------------------*/
function GetChanges()
{
	var change_list = [];
	var updates = {};
	updates.updated = Math.floor(chart_updated/1000);
	updates.selected = chart_current_job;
	updates.change_list = change_list;

	for (var index=0; index < job_list.length; index++)
	{
		if (job_list[index] != null)
		{
			if (job_list[index].amended || job_list[index].created || job_list[index].deleted)
			{
				change_list.push(job_list[index]);
			}
		}
	}

	return JSON.stringify(updates,ParseObjects);
}
