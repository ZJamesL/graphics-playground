
# Overview
This repository holds my implementation of a raytracer from this [book](https://www.gabrielgambetta.com/computer-graphics-from-scratch/)
My implementation adds some features to the raytracer that are listed below. 

![raytracer/raytraced_image.png](https://github.com/Devolafriend/graphics-playground/blob/646d110d78f4b4506a250d9f84974040ec60bb06/raytracer/raytraced_image.png)

# How To... 
- Run 
   - To run the program download this repository and simply open the colored_raytracer.html file from your file explorer
- edit the render
   - At the top of colored_raytracer.js you will find the "Scene Setup". This houses the scene object which houses the objects within the scene. To add
     or remove objects from the scene, edit the `spheres`, `triangles`, or `lights` arrays.

# Where is everything housed
  The logic for the raytracer is all housed within the `js` folder. Here the code is distributed between 3 js files. colored_raytracer.js contains the logic for the renderer and it's main loop. linear_algebra_library.js holds the math library that the raytracer runs off of. objects.js contains the constructors for the different objects that the raytracer utilizes, such as the vec3, triangle, sphere and light

# Color lighting
The first extension I made to this raytracer was colored lighting. Now instead of having only a single light intensity factor that results in a dimmer or brighter white light, the light intensity has a red, green, and blue component. 

# Triangle Primitives
\tThis addition allows for the use of triangles as primitives in the raytracer. Previously the only other primitive was the sphere. This is important as triangles (and also quads) are the base primitives for many renderers. Every object can be broken down into triangles. Thus this allows for us to render more complex objects. The implementation of this was a fun learning experience. Only 1 function, the closestIntersection() function, needed to be modified and a new function, the intersectRayTriangle() function, was added. In order to implement this I had to test to see if the ray intersected with the plane a triangle layed on and then test to see if that intersection fell inside the triangle. To check if the point was inside the trianlge I originally opted for using a dot product test to see if the point was on the 'inside' of each of edges of the triangle, however I ran into some diffuculties with this implementation. I then found another solution here -- https://math.stackexchange.com/questions/4322/check-whether-a-point-is-within-a-3d-triangle -- that used barycentric coordinates that worked. 

# vec3 code refactor 
The last addition was that I added an object type called a vec3 which just a vector of 3 components - x, y, and z. With this I replaced almost every instance of any array of 3 values - such as in the object positions, colors, and vector math - with a vector 3 object. I did this originally just to help make the code more comprehensible and cleaner, however what I didn't expect was that this made the raytracer run much **much** faster. Have a look for yourself. There are 2 html files, colored_raytracer.html and old_colored_raytracer.html. The latter is the old implementation that just used arrays of length 3 and the former is the one that has uses vec3s. The newer version is much faster. 
