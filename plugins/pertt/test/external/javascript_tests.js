/*--------------------------------------------------------------------------------*
 *  ,-----.                 ,--.    ,--.     ,----. ,--.                   ,--.  
 *  |  .-. | ,---. ,--.--.,-'  '-.,-'  '-.  '  .-./ |  '--. ,--.-.,--.--.,-'  '-.
 *  |  '-' || .-. :|  .--''-.  .-''-.  .-'  |  |  _ |  .  || .-. ||  .--''-.  .-'
 *  |  |--' \   --.|  |     |  |    |  |    '  '-' ||  |  |' '-' ||  |     |  |  
 *  `--'     `----'`--'     `--'    `--'     `----' `--'--' `--'-'`--'     `--'  
 *    file: javascript_tests
 *    desc: This file holds the tests that test the javascript functions.
 *
 *  author: Peter Antoine
 *    date: 22/01/2013 19:18:22
 *--------------------------------------------------------------------------------*
 *                     Copyright (c) 2013 Peter Antoine
 *                            All rights Reserved.
 *                    Released Under the Artistic Licence
 *--------------------------------------------------------------------------------*/

/*--------------------------------------------------------------------------------*
 * test_CalculateEndTime
 *
 * This function is a visual test (you'll have to verify the result)`for the 
 * CalculateEndTime function. This function will test to see if the end date calc
 * function works.
 *--------------------------------------------------------------------------------*/
var working_day_length = (7.5 * 60 * 60)
var job_list = [];

function test_CalculateEndTime()
{
	var s_date = new Date();
	var e_date = new Date();
	var test_time = new Date().getTime();
	var quarter_day = Math.floor(working_day_length / 4);
	var test_day_start = (Math.floor(test_time / 1000 / seconds_in_day) * seconds_in_day);

	console.log("test setWeek");

	for (var index = 0; index < 7; index++)
	{
		for (var days=1; days < 7; days++)
		{
			SetWeek(index,days,working_day_length);

			console.log("weekend: " + weekend[0] + " " + weekend[1] + " " + weekend[2] + " " + weekend[3] + " " + weekend[4] + " " + weekend[5] + " " + weekend[6]);
			console.log("days_to: " + days_to_week[0] + " " + days_to_week[1] + " " + days_to_week[2] + " " + days_to_week[3] + " " + days_to_week[4] + " " + days_to_week[5] + " " + days_to_week[6]);
			console.log("days_of: " + day_of_week[0] + " " + day_of_week[1] + " " + day_of_week[2] + " " + day_of_week[3] + " " + day_of_week[4] + " " + day_of_week[5] + " " + day_of_week[6]);
		}
	}

	job_list[0] = {};
	job_list[1] = {};

	s_date.setTime(test_day_start * 1000);

	SetWeek(0,5,working_day_length);

	/* first test - test that a day rolls over correctly */
	console.log("day rollovers from changing duration");

	for (var index=0; index < (10 * 4); index++)
	{
		job_list[0].start_date = test_day_start;
		job_list[0].duration = (quarter_day * index);
		job_list[0].end_date = test_day_start;

		job_list[1].start_date = 0;
		job_list[1].duration = (quarter_day * index);
		job_list[1].end_date = 0;
		job_list[1].owner = 0;
		job_list[1].prev_job = 0;

		CalculateEndTime(job_list[1]);
		e_date.setTime( job_list[1].end_date * 1000);

		console.log("start_date: " + s_date.toString() + " end_date: " + e_date.toString() + " duration: " + (job_list[1].duration / working_day_length));
	}

	console.log("second test day rollovers from changing start time");
/*
	for (var index=0; index < (8 * 4); index++)
	{
		var job = {};
		job.start_date = test_day_start + (seconds_in_day * Math.floor(index / 4)) + (quarter_day * (index % 4));
		job.duration = working_day_length;
		job.end_date = 0;

		CalculateEndTime(job)

			s_date.setTime(job.start_time * 1000);
		e_date.setTime(job.end_time * 1000);

		console.log("start_date: " + s_date.toString() + " end_date: " + e_date.toString() + " duration: " + (job.duration / working_day_length));
	}
*/
}

