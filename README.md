# ICFP 2016 Contest

This was a visualizer and tool written for the ICFP 2016 programming contest, from August 5 - 7, 2016. For more information see the specification page: http://2016.icfpcontest.org/

This is a Github Page. You can go to https://ychin.github.io/icfp2016_TeamAVR_generator/ to see it.

I was only working part time remotely for the team "Buy Ascension VR on Steam, $9.99" who consists of people who I worked full-time in ICFP 2014/2015, and mostly contributed to the problem generation part. We already had some hand crafted base problems, and I built a web page to help visualize them and generate new problems, by folding them and applying known sequence of steps, as well as a visualizer to help map where the points and facets are to help gauge how hard the problem is.

The page can load in a solution, generate arbitrary folds, translate/rotate the result, as well as tiling the result. It could also store steps of actions so we can apply a series of steps to a already hard origami solution to make it harder (although it's unclear if sometimes applying more steps to an solution could make things easier if there are some sort of multipath solution, i.e. it results in a problem with a lot of ways to solve).

I started on this relatively late, and there were a lot more work that could have been done on this including generating harder problems, and using operations other than simple folds (there are other [more interesting ways to fold origami](http://www.origami-instructions.com/origami-base-folds.html) that could have been used). I wasn't sure if those other methods would necessarily increase the difficulty of the problem though, as an algorithm doing polygon flood-fill searching mostly wouldn't care about that, and the topography and number of duplicates/ambiguous points/edges and search tree depth may be more important. But then it would have be useful to prune out those entries who made simplistic assumptions about how folds work and score higher points…
