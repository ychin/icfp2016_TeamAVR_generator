# ICFP 2016 Contest

This was a visualizer and tool written for the ICFP 2016 programming contest, from August 5 - 7, 2016. For more information see the specification page: http://2016.icfpcontest.org/

I was only working part time for the team "Buy Ascension VR on Steam, $9.99", and mostly contributed to the problem generation part. We already had some hand crafted base problems, and I built a web page to help visualize them and generate new problems, by folding them and applying known sequence of steps, as well as a visualizer to help map where the points and facets are to help gauge how hard the problem is.

The page can load in a solution, generate arbitrary folds, translate/rotate the result, as well as tiling the result.

I started on this relatively late, and there were a lot more work that could have been done on this including generating harder problems, and using operations other than simple valley folds (there are other [more interesting ways to fold origami](http://www.origami-instructions.com/origami-base-folds.html) that could have been used). I wasn't sure if those other methods would necessarily increase the difficulty of the problem though, as an algorithm doing polygon flood-fill searching mostly wouldn't care about that, and the topography and number of duplicates and search tree depth may be more important.
