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
    return [a[0] * b[0] + a[1] * b[1] + a[2] * b[2]]
}

/**
 * subtracts two 3 component vectors
 * Parameters: 
 *      a - first 3d vector
 *      b - second 3d vector  
 */
function vecSub(a, b){
    return [a[0] - b[0], a[1] - b[1], a[2] - b[2]]
}

/**
 * subtracts scalar from 3 component vector
 * Parameters: 
 *      a - first 3d vector
 *      b - second 3d vector  
 */
function vecScalarSub(vec, scalar){
    return [vec[0] - scalar, vec[1] - scalar , vec[2] - scalar]
}

/**
 * adds 2 vectors 
 * parameters: 
 *      a - first 3d vector 
 *      b - second 3d vector
 */
function vecAdd(a, b) {
    return [a[0] + b[0], a[1] + b[1], a[2] + b[2]]
}

/**
 * multiplies a given vector by a scalar
 * parameters:
 *      vec - vector scalar is applied to 
 *      scalar - scalar of the vector
 */
function vecScalarMult(vec, scalar){
    return [scalar * vec[0], scalar * vec[1], scalar * vec[2]]
}

/**
 * divides a vector by a scalar
 * parameters:
 *      vec - the vector being divided
 *      scalar - the scalar to be applied
 */
function vecDivision(vec, scalar) {
    return [vec[0] / scalar, vec[1] / scalar, vec[2] / scalar]
}


/**
 * Takes in a 3 component vector and returns the magnitude the vector
 * Parameters: 
 *      vec - the vector
 */
function magnitude(vec){
    return Math.sqrt(vec[0] ** 2 + vec[1] ** 2 + vec[2] ** 2)
}