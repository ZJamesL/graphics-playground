/**
 * This creates sphere objects
 * Center - array in the format of [x, y, z]
 * color - array in the format of [r, g, b]
 * radius - integer value for the radius
 * specular - how shiny the object is 
 * reflective - how reflective an object is 
 */
let sphere = function(center, color, radius, specular, reflective){
    this.center = center;
    this.color = color;
    this.radius = radius;
    this.specular = specular;
    this.reflective = reflective;
}

/**
 * this creates a vec3 or a vector of 3 components 
 * parameters:
 *         x - first component 
 *         y - second component 
 *         z - third component 
 */
let vec3 = function(x, y, z){
    this.x = x,
    this.y = y, 
    this.z = z
}

/**
 * This creates a triangle object. The triangle type has a property
 * called normal which is the normal of the plane that the triangle 
 * lies on. This is computed here to save the trouble later  
 * NOTE - for right now all references to vec3 just mean an array of size 3 --> will change soon 
 * parameters:
 *      points - array of 3 vec3s  
 *      color - a vec3 containing 3 color values in rgb format 
 *      specular - how shiny the triangle is 
 *      reflective - how reflective the triangle is, between 0 to 1 
 */
let triangle = function(points, color, specular, reflective) {
    this.points = points;
    this.color = color;
    this.specular = specular;
    this.reflective = reflective;
    // calculate the cross product to get the normal 
    // first get the 2 vectors 
    let w = vecSub(points[0], points[1]);
    let v = vecSub(points[0], points[2]);
    this.normal = crossProduct(v, w);
    console.log("w = " + w);
    console.log("v = " + w);
    console.log("normal = " + this.normal);
}



/**
 * This creates light objects
 * parameters:
 *      type: type of light -> point, ambient, directional
 *      intensity: 3 intensities of light for rgb, 0.0 to 1.0
 *      direction: direction of the light, vec3 (used by point and directional)
 *      position: position of the light, vec3 (used by point light)
 */
let light = function(type, intensity, position = null, direction = null) {
    this.type = type;
    this.intensity = intensity;
    if (position !== null){
        this.position = position;
    }
    if (direction !== null){
        this.direction = direction;
    }
}