//////////////////////////////////////////////////////////////////////////////
// Linear algebra operations
//////////////////////////////////////////////////////////////////////////////
/**
 * Gets the dot product of 2 vectors with 3 components 
 * Parameters:
 *      a - first 3d vector
 *      b - second 3d vector
 */
function dotProduct(a, b){
    return (a.x * b.x) + (a.y * b.y) + (a.z * b.z)
}

/**
 * subtracts two 3 component vectors
 * Parameters: 
 *      a - first 3d vector
 *      b - second 3d vector  
 */
function vecSub(a, b){
    return new vec3(a.x - b.x, a.y - b.y, a.z - b.z);
}

/**
 * subtracts scalar from 3 component vector
 * Parameters: 
 *      a - first 3d vector
 *      b - second 3d vector  
 */
function vecScalarSub(vec, scalar){
    return new vec3(vec.x - scalar, vec.y - scalar , vec.z - scalar);
}

/**
 * adds 2 vectors 
 * parameters: 
 *      a - first 3d vector 
 *      b - second 3d vector
 */
function vecAdd(a, b) {
    return new vec3(a.x + b.x, a.y + b.y, a.z + b.z);
}

/**
 * multiplies a given vector by a scalar
 * parameters:
 *      vec - vector scalar is applied to 
 *      scalar - scalar of the vector
 */
function vecScalarMult(vec, scalar){
    return new vec3(scalar * vec.x, scalar * vec.y, scalar * vec.z);
}

/**
 * divides a vector by a scalar
 * parameters:
 *      vec - the vector being divided
 *      scalar - the scalar to be applied
 */
function vecDivision(vec, scalar) {
    return new vec3(vec.x / scalar, vec.y / scalar, vec.z / scalar);
}


/**
 * Takes in a 3 component vector and returns the magnitude the vector
 * Parameters: 
 *      vec - the vector
 */
function magnitude(vec){
    return Math.sqrt((vec.x ** 2) + (vec.y ** 2) + (vec.z ** 2))
}

/**
 * takes in a 3 component vector and returns the magnitude of the vector 
 * parameters 
 */
function normalize(vec) {
    let mag = magnitude(vec);
    return new vec3(vec.x / mag, vec.y / mag, vec.z / mag);
}

/**
 * Takes in 2 arrays of ints (soon vec3s) and calculates the cross product 
 * between the two  
 * parameters 
 *      v - the first vector (second clockwise)
 *      w - the second vector (first in clockwise) 
 */
function crossProduct(v, w) {
    // soon to uncomment after code refactor 
    //let x = v.y * w.z - v.z * w.y;
    //let y = v.z * w.x - v.x * w.z; 
    //let z = v.x * w.y - v.y * w.x;
    //let normal = new vec3(x, y, z);
    let x = v.y * w.z - v.z * w.y;
    let y = v.z * w.x - v.x * w.z;
    let z = v.x * w.y - v.y * w.x;
    return new vec3(x, y, z);
}