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
var hotspot_list		= [];
var group_space_gap		= 30;		/* pixel space used for the group arrows */

/*--------------------------------------------------------------------------------*
 * The buttons for the popups
 *--------------------------------------------------------------------------------*/
var button_text = new Array();
button_text['cancel'] = 'Cancel';
button_text['subitem'] = 'Add Sub-Job';
button_text['parallel'] = 'Add Concurrent Job';
button_text['previous'] = 'Add Dependent Job';
button_text['after'] = 'Insert Dependancy Job';
button_text['delete'] = 'Delete Job';
button_text['create'] = 'Create';


/*--------------------------------------------------------------------------------*
 * job
 * This is the job object constructor.
 *
 * The job object is the item that holds the issue context. The structure of the
 * job item is:
 *  name 		The is the name of the job item.
 *  owner		This is the job item that this job is a sub-item of.
 *  next_job	This this is the job that follows this job.
 *  hotspot		This is the hotspot that this object is interacted with.
 *  streams		This is a list of jobs that are parallel jobs that are sub-jobs
 *              of this job. This is not the complete list of jobs that are owned
 *              by this job, just the first job in the list for that set of jobs.
 *--------------------------------------------------------------------------------*/
function job_addHotSpot(hotspot)
{
	this.hotspot = hotspot;
}

function job_calculateBoxSize(context,enclosing_hotspot)
{
	if (this.streams.length == 0)
	{
		if (this.hotspot.active)
		{
			/* ok, leaf box, just add our own size */
			DP_getBoxSize(context,this);
		}
	}
	else
	{
		var height = 0;
		var width = 0;

		/* ok, we have sub-jobs calc the size based on this */
		for (var index=0; index < this.streams.length; index++)
		{
			/* re-initialise the container hotspot */
			this.hotspots[index].x		= 0;
			this.hotspots[index].y		= 0;
			this.hotspots[index].width	= 0;
			this.hotspots[index].height = 0;
			this.hotspots[index].active = false;
			this.hotspots[index].owner	= this;

			/* now walk down the list of boxes per level */
			var box = this.streams[index];

			while (box != null)
			{
				/* create the enclosing box */
				box.calculateBoxSize(context,this.hotspots[index]);
				this.hotspots[index].width += DP_BOX_SPACING;
				var temp = box.getNextJob();
				box = temp;
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
	}

	/* adjust the size of the enclosing hotspot */
	if (enclosing_hotspot.height < (this.hotspot.height + DP_BOX_TOTAL_SPACING))
	{
		enclosing_hotspot.height = this.hotspot.height + DP_BOX_TOTAL_SPACING;
	}

	enclosing_hotspot.width += this.hotspot.width;

	return this.hotspot;
}

function job_paint(context,x,y)
{
	if (this.streams.length == 0)
	{
		/* ok, leaf box, just draw it */
		DP_drawTextBoxRounded(context,x,y,this.text);
	
		/* this is a leaf item, needs to be added to hotspot list so it can be selected */
		this.hotspot.y = y;
		this.hotspot.x = x;
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
			var box = this.streams[index];
		
			if (!box.start)
			{
				/* draw line from outer box middle to stream middle */
				DP_drawBoxCurve(context,x,y+(this.hotspot.height/2),group_x,stream_off_y);

				/* draw the line from the group boundary to the box boundary */
				DP_drawStraightArrow(context,group_x,stream_off_y,stream_off_x,0,0);
			}
	
			while (box != null)
			{
				/* increment the offset and do next */
				box_x = my_x + DP_BOX_SPACING;
				var box_y = stream_y + ((this.hotspots[index].height - box.hotspot.height) / 2);
			
				if (!box.start)
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
				box.paint(context,box_x,box_y);
		
				/* only paint the end line if it is a real box */
				if (!box.end && box.terminal)
				{
					DP_drawStraightArrow(context,my_x+box.hotspot.width+DP_BOX_SPACING,stream_off_y,box_x-my_x,0,0);
				}

				/* get next job */
				my_x += box.hotspot.width + DP_BOX_SPACING;
				
				box = box.getNextJob();
			}

			if (!this.streams[index].start)
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
	job.next_obj = this.next_obj;
	this.next_obj = job;

	/* TODO: update the box sizes */
}

function job_addSubJob(job)
{
	this.streams.push(job);
	this.hotspots.push(new Hotspot(0,0,0,0,this,false));

	/* this has sub-jobs so not an active hotspot */
	this.hotspot.active = false;
	job.first_job = true;

	this.terminal = false;

	/* TODO: update the box sizes */
}

function job_getNextJob()
{
	return this.next_obj;
}

function Job(name,description)
{
	/* set the standard items */
	this.text			= name;
	this.owner			= null;
	this.next_obj		= null;
	this.hotspot		= null;
	this.terminal		= true;
	this.first_job		= false;
	this.description	= description;

	/* set the sub-items that the job have to have */
	this.streams	= [];

	/* set the hotspots for the sub-items */
	this.hotspots	= [];

	/* add the methods to the object */
	this.paint				= job_paint;
	this.addSubJob			= job_addSubJob;
	this.addHotSpot			= job_addHotSpot;
	this.addNextJob			= job_addNextJob;
	this.getNextJob			= job_getNextJob;
	this.calculateBoxSize	= job_calculateBoxSize;
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
function createJob(hotspot, name, description, parameter)
{
	var owner = null;
	var new_job = new Job(name,description);
	var new_hotspot = new Hotspot(0,0,0,0,new_job,true);

	new_job.addHotSpot(new_hotspot);
	
	switch(parameter)
	{
		case 'parallel':
				/* add parallel job to the current job */
				new_job.owner = hotspot_list[hotspot].job.owner;
				new_job.owner.addSubJob(new_job);
				break;

		case 'subitem': 
				/* create a sub-job of the current one */
				new_job.owner = hotspot_list[hotspot].job;
				hotspot_list[hotspot].job.addSubJob(new_job);
				break;

		case 'after':
				new_job.owner = hotspot_list[hotspot].job.owner;
				hotspot_list[hotspot].job.addNextJob(new_job);
				break;

		case 'previous':
				new_job.owner = hotspot_list[hotspot].job.owner;
				hotspot_list[hotspot].job.addNextJob(new_job);
				break;
	}

	/* add the new job to the list of jobs */
	job_list.push(new_job);

	repaint('test_1');
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
	return '<div class="popup_button rounded_bottom rounded_top shadow" onClick="actionButtonPress(\'' + type + '\', ' + hotspot + ',\'' + parameter + '\');">' + button_text[type] +'</div>';
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
 *
 * returns:
 *  The text for the text box that was created.
 *--------------------------------------------------------------------------------*/
function createTextBox(id, name, width, max_length)
{
	return '<div class="popup_input rounded_bottom rounded_top shadow"> ' + name + ': <input class="popup_null" id="' + id + '" type="text" size="' + width + '" maxlength="' + max_length + '"/></div>';
}

/*--------------------------------------------------------------------------------*
 * createTextArea
 *
 * This function will create a named text area.
 *
 * parameters:
 * 	id		The id of the text box.
 * 	name	The name of the text box, this will be used for the label.
 * 	columns	The width of the text box.
 *
 * returns:
 *  The text for the text area.
 *--------------------------------------------------------------------------------*/
function createTextArea(id, name, columns)
{
	return '<div class="popup_input rounded_bottom rounded_top shadow"><label class="popup_null">' + name + ': </label><textarea class="popup_null" id="' + id + '" cols="' + columns + '"></textarea></div>';
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
	/* remove old window */
	element = document.getElementById('popup');
	element.style.display = "none";

	/* now handle the action on the new window */
	switch(type)
	{
		case 'after':
		case 'parallel':
		case 'previous':
		case 'subitem':		showPopup(type, hotspot); 																							break;
		case 'create':		createJob(hotspot,document.getElementById('name').value,document.getElementById('description').value,parameter);	break;
	}
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
 *--------------------------------------------------------------------------------*/
function showPopup(type, hotspot)
{
	var element, x, y, width, height;

	/* the popup that is in the html */
	element = document.getElementById('popup');
	
	element.style.left = (hotspot_list[hotspot].x + hotspot_list[hotspot].width + 10) + "px";
	element.style.top = (hotspot_list[hotspot].y + 10) + "px";

	switch(type)
	{
		/* basic click/touch on an element */
		case 'select':	html_text = "amend: " + hotspot_list[hotspot].job.text + "<p>";
						if (hotspot_list[hotspot].job.start || hotspot_list[hotspot].job.end )
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

		case 'subitem':	html_text = "new sub-item: " + hotspot_list[hotspot].job.text + "<p>";
						html_text += createTextBox('name','Name',80,120);
						html_text += createTextArea('description','Description',80);
						html_text += createButton('create',hotspot,type);
						break;

		case 'after':
		case 'parallel':
		case 'previous':
						html_text = "new: " + hotspot_list[hotspot].job.text + "<p>";
						html_text += createTextBox('name','Name',80,120);
						html_text += createTextArea('description','Description',80);
						html_text += createButton('create',hotspot,type);
						break;


		default:		html_text = "INTERNAL ERROR: unknown popup type";
	}
	
	html_text += createButton('cancel',hotspot);

	element.innerHTML = html_text;
	element.style.display = "block";
}

/*--------------------------------------------------------------------------------*
 * touchListenerFunction
 * This function will initialise the canvas for drawing the pertt chart.
 * It will init the canvas and load the initial model and do the initial render.
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
			showPopup('select',index);
			break;
		}
	}
}

/*--------------------------------------------------------------------------------*
 * initialise
 * This function will initialise the canvas for drawing the pertt chart.
 * It will init the canvas and load the initial model and do the initial render.
 *--------------------------------------------------------------------------------*/
function initialise(canvas_id)
{
	var canvas  = document.getElementById(canvas_id);

	if (canvas)
	{
		var context = canvas.getContext('2d');

		if (context)
		{
			/* check to see if the job_list has been set, if not set it to the default */
			if (job_list === undefined)
			{
				job_list = Array();

				/* create the basic project */
				var base_job = new Job('project','Project Root');
				var new_hotspot = new Hotspot(0,0,0,0,base_job,false);
				base_job.addHotSpot(new_hotspot);
				job_list.push(base_job);

				/* now create the start job */
				var new_job = new Job('start','start');
				var new_hotspot = new Hotspot(0,0,0,0,new_job,true);
				new_job.addHotSpot(new_hotspot);
				new_job.start = true;
				job_list.push(new_job);
				
				new_job.owner = base_job;
				base_job.addSubJob(new_job);

				/* now create the end job */
				var end_job = new Job('end','end of project');
				var new_hotspot = new Hotspot(0,0,0,0,end_job,true);
				end_job.addHotSpot(new_hotspot);
				end_job.owner = base_job;
				end_job.end = true;
				new_job.addNextJob(end_job);
				job_list.push(end_job);
			}

			/* calculate the box sizes - this will need to be done once from the top level */
			job_list[0].calculateBoxSize(context,job_list[0].hotspot);

			/* set the canvas size to that of the toplevel box */
			canvas.width	= job_list[0].hotspot.width;
			canvas.height	= job_list[0].hotspot.height;

			/* now render the job_list */
			job_list[0].paint(context,0,0);

			/* finally add the onClick listener to the canvas */
			canvas.addEventListener("click", touchListenerFunction, false);
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
		var context = canvas.getContext('2d');

		if (context)
		{
			/* empty the hotspot list on repaint - as the items add themselves back to the list */
			hotspot_list.length = 0;

			/* re-calculate the graph size */	
			job_list[0].calculateBoxSize(context,job_list[0].hotspot);

			/* set the canvas size to that of the toplevel box - note this also clears the canvas */
			canvas.width	= job_list[0].hotspot.width;
			canvas.height	= job_list[0].hotspot.height;
	
			/* now render the job_list */
			job_list[0].paint(context,0,0);

			/* TODO: debug */
			function censor(key, value) {
			  if (key == "job") {
				return job_list.indexOf(value);
			  }
			  return value;
			}

			console.debug(JSON.stringify(hotspot_list,censor));
		}
	}
}


