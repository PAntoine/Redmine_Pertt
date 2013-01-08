# Pertt Chart #

This Remine plugin will all for project planning using the PERT charting model.

# Why #

Simple I feel that pertt charts are more visually accessible than GANTT charts and
are better for job scheduling. Also find that tracking work and getting a feel for
projects (especially) small projects is easier via the PERTT chart.

Also, I feel it is easier to do project design using this charting method.

# What #

The project is based around an HTML5 canvas that is used to draw the chart on and
which it then will send the amendments to a Redmine back-end for integration into 
the issue tracking system.

The plugin also uses the HTML5 localstorage sub-system to allow for the diagrams
to be edited offline without internet connection and to allow for the charts to
be updated when you user has completed the amendments they require and are back
online.

# Status #

The current status of the product is a follows:

1. The basic chart drawing and navigation is complete.
   Thought the structure of the job/task items may change, will need to add start
   dates and durations to them.

2. The structure of the Redmine plugin has been written and the database schema to
   hold and deliver the charts to the user has been started.

3. The interaction of the Javascript to the Redmine backend is just being started.

# Licence and copyright #
                    Copyright (c) 2012-2013  Peter Antoine
                             All rights Reserved.
                     Released Under the Artistic Licence
