/*--------------------------------------------------------------------------------*
 *  ,-----.                 ,--.    ,--.     ,----. ,--.                    ,--.  
 *  |  .-. | ,---. ,--.--.,-'  '-.,-'  '-.  '  .-./ |  |    ,---.-.,--.--.,-'  '-.
 *  |  '-' || .-. :|  .--''-.  .-''-.  .-'  |  |  _ |  '--.|  .-. ||  .--''-.  .-'
 *  |  |--' \   --.|  |     |  |    |  |    '  '-' ||  .  |'  '-' ||  |     |  |  
 *  `--'     `----'`--'     `--'    `--'     `----' `--'--' `---'-'`--'     `--'  
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
 * Object creation functions
 *--------------------------------------------------------------------------------*/

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
		/* ok, leaf box, just add our own size */
		DP_getBoxSize(context,this);
	
		box_height = this.hotspot.height + DP_BOX_HEIGHT;
		
		if (box_height > enclosing_hotspot.height)
			enclosing_hotspot.height = box_height;
	
		enclosing_hotspot.height += 100;
		enclosing_hotspot.width += this.hotspot.width + DP_BOX_TOTAL_SPACING + 100;
	}
	else
	{
		/* ok, we have sub-jobs calc the size based on this */
		for (index=0; index < this.streams.length; index++)
		{
			/* re-initialise the container hotspot */
			this.hotspots[index].x		= 0;
			this.hotspots[index].y		= 0;
			this.hotspots[index].width	= 0;
			this.hotspots[index].height = 0;
			this.hotspots[index].active = false;
			this.hotspots[index].owner	= this;

			/* now walk down the list of boxes per level */
			box = this.streams[index];
			while (box != null)
			{
				/* create the enclosing box */
				box.calculateBoxSize(context,this.hotspots[index]);
				box = box.nextBox();
			}

			/* add to the size of the enclosing box */
			enclosing_hotspot.height += this.hotspots[index].height;
			enclosing_hotspot.width  += this.hotspots[index].width;
		}
	}

	return this.hotspot;
}

function job_paint(context,x,y)
{
	if (this.streams.length == 0)
	{
		/* ok, draw it at an offset from the enclosing box */
		this.hotspot.y = y + DP_BOX_SPACING;
		this.hotspot.x = x + DP_BOX_SPACING;

		/* ok, leaf box, just draw it */
		DP_drawTextBox(context,this.hotspot.x,this.hotspot.y,this.text);
	
		/* this is a leaf item, needs to be added to hotspot list so it can be selected */
		hotspot_list.push(this.hotspot);
	}
	else
	{
		/* var, all items are drawn inside my area box */
		var my_x = x;
		var my_y = y;

		/* ok, we have sub-jobs calc the size based on this */
		for (index=0; index < this.streams.length; index++)
		{
			/* now walk down the list of boxes per level */
			box = this.streams[index];
			while (box != null)
			{
				/* paint the box */
				box.paint(context,x,y);

				/* increment the offset and do next */
				x += box.hotspot.width + DP_BOX_SPACING;
				box = box.nextBox();
			}
		}

		/* next row */
		y += DP_BOX_HEIGHT;
	}
}

function job(name,owner,next_job,hotspot,layout_only)
{
	/* set the standard items */
	this.text		= name;
	this.owner		= owner;
	this.next_obj	= next_job;
	this.hotspot	= hotspot;

	/* set the sub-items that the job have to have */
	this.streams	= [];

	/* set the hotspots for the sub-items */
	this.hotspots	= [];

	/* add the methods to the object */
	this.paint				= job_paint;
	this.addHotSpot			= job_AddHotSpot;
	this.calculateBoxSize	= job_calculateBoxSize;
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
function hotspot(x,y,width,height,owner)
{
	this.x		= x;
	this.y		= y;
	this.width	= width;
	this.height	= height;
	this.active	= true;
	this.owner	= job;
}

/*--------------------------------------------------------------------------------*
 * The global static items.
 *--------------------------------------------------------------------------------*/
var job_list;
var hotspot_list		= [];
var default_hotspot		= {x:0,y:0,width:0,height:0,active:true,owner:null};
var default_job_list 	= [{text:'root',owner:null,next_job:null,hotspot:default_hotspot,streams:[],
							paint:job_paint,
							addHotSpot:job_addHotSpot,
							calculateBoxSize:job_calculateBoxSize}];

default_hotspot.job		= default_job_list[0];

/*--------------------------------------------------------------------------------*
 * The buttons for the popups
 *--------------------------------------------------------------------------------*/
var button_text = new Array();
button_text['cancel'] = 'Cancel';
button_text['subitem'] = 'Add Sub-Job';
button_text['parallel'] = 'Add Parallel Job';
button_text['previous'] = 'Add Dependent Job';
button_text['after'] = 'Insert Dependancy Job';
button_text['delete'] = 'Delete Job';

/*--------------------------------------------------------------------------------*
 * The functions that handle the Pertt Chart.
 *--------------------------------------------------------------------------------*/
function createButton(type)
{
	return '<div class="popup_button rounded_bottom rounded_top shadow" onClick="hidePopup(\'' + type + '\');">' + button_text[type] +'</div>';
}

/*--------------------------------------------------------------------------------*
 * hidePopup
 *
 * This function will show the display the popup on the screen. This function will
 * select the inner page from the type parameter.
 *
 * parameters:
 * 	type	This is the type of pop-up that is to be displayed.
 * 	hotspot	This is the item that was selected that caused to popup to occur.
 *--------------------------------------------------------------------------------*/
function hidePopup(type)
{
	console.debug("button type: " + type);
	element = document.getElementById('popup');
	element.style.display = "none";
}
	
/*--------------------------------------------------------------------------------*
 * showPopup
 *
 * This function will show the display the popup on the screen. This function will
 * select the inner page from the type parameter.
 *
 * parameters:
 * 	type	This is the type of pop-up that is to be displayed.
 * 	hotspot	This is the item that was selected that caused to popup to occur.
 *--------------------------------------------------------------------------------*/
function showPopup(type, hotspot)
{
	var element, x, y, width, height;

	/* the popup that is in the html */
	element = document.getElementById('popup');
	
	element.style.left = (hotspot.x + hotspot.width + 10) + "px";
	element.style.top = (hotspot.y + 10) + "px";

	switch(type)
	{
		case 'select':	html_text = "test text";
						html_text += createButton('subitem');
						html_text += createButton('previous');
						html_text += createButton('parallel');
						html_text += createButton('previous');
						html_text += createButton('after');
						html_text += createButton('delete');
						
						break

		default:		html_text = "INTERNAL ERROR: unknown popup type";
	}
	
	html_text += createButton('cancel');

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
	for (index=0; index < hotspot_list.length; index++)
	{
		if (((hotspot_list[index].x < e.clientX) && (e.clientX < (hotspot_list[index].x + hotspot_list[index].width))) &&
		    ((hotspot_list[index].y < e.clientY) && (e.clientY < (hotspot_list[index].y + hotspot_list[index].height))))
		{
			console.debug("y ok");
			showPopup('select',hotspot_list[index]);
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
				job_list = default_job_list;
			}

			console.debug("  size:" + job_list[0].hotspot.width + " h: " + job_list[0].hotspot.height);

			/* calculate the box sizes - this will need to be done once from the top level */
			job_list[0].calculateBoxSize(context,job_list[0]);
			
			console.debug("a size:" + job_list[0].hotspot.width + " h: " + job_list[0].hotspot.height);

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
function repaint(canva_id)
{
	var canvas  = document.getElementById(canvas_id);
	
	if (canvas)
	{
		var context = canvas.getContext('2d');

		if (context)
		{
			/* empty the hotspot list on repaint - as the items add themselves back to the list */
			hotspot_list.length = 0;

			/* set the canvas size to that of the toplevel box - note this also clears the canvas */
			canvas.width	= job_list[0].hotspot.width + 400;
			canvas.height	= job_list[0].hotspot.height + 400;

			/* now render the job_list */
			job_list[0].paint(context,0,0);
		}
	}
}


