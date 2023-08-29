/**
 * Generate the sequence [0..limit)
 * @param {Number} limit Upper bound non-inclusive.
 */
function* finite(limit) {
	for(let ix = 0; ix < limit; ix++) yield ix;
}
/**
 * Generate the sequence [0...] without end.
 */
function* infinite() {
	let ix = 0;
	while(true) yield ix++;
}
/**
 * General-purpose grid coordinate generation.
 * @param {Generator} major Major dimension generator.
 * @param {Function} minorfunc Minor dimension Generator-returning Function.
 * @param {Function} cb Callback to yield objects back to caller.  Receives (maj.value,min.value) as parameters.
 */
function* grid(major, minorfunc, cb) {
	if(!(minorfunc instanceof Function)) throw new Error("minorfunc: must be a Function returning a Generator");
	if(!cb) throw new Error("callback not defined");
	let minor = minorfunc();
	let maj = major.next(), min = minor.next();
	while(!maj.done) {
		while(!min.done) {
			yield cb(maj.value, min.value);
			min = minor.next();
		}
		minor = minorfunc();
		min = minor.next();
		maj = major.next();
	}
}
/**
 * Generate row-major sequence of coordinates.
 * (0,0)...(0,n-1),(1,0)...(1,n-1),...
 * @param {Generator} rows Row generator.
 * @param {Function} colsfunc  Column generator callback; MUST return a new Generator.
 */
function* rowMajor(rows, colsfunc) {
	if(!(colsfunc instanceof Function)) throw new Error("colsfunc: must be a Function returning a Generator");
	const major = rows;
	let minor = colsfunc();
	let maj = major.next(), min = minor.next();
	while(!maj.done) {
		while(!min.done) {
			yield { row: maj.value, column: min.value };
			min = minor.next();
		}
		minor = colsfunc();
		min = minor.next();
		maj = major.next();
	}
}
/**
 * Generate column-major sequence of coordinates.
 * (0,0)...(n-1,0),(0,1)...(n-1,1),...
 * @param {Function} rowsfunc Row generator callback; MUST return a new Generator.
 * @param {Generator} columns Column generator.
 */
function* columnMajor(rowsfunc, columns) {
	if(!(rowsfunc instanceof Function)) throw new Error("rowsfunc: must be a Function returning a Generator");
	const major = columns;
	let minor = rowsfunc();
	let maj = major.next(), min = minor.next();
	while(!maj.done) {
		while(!min.done) {
			yield { row: min.value, column: maj.value };
			min = minor.next();
		}
		minor = rowsfunc();
		min = minor.next();
		maj = major.next();
	}
}
export { finite, infinite, grid, rowMajor, columnMajor }