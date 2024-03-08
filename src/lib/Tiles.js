/**
 * Generate the sequence [0..limit)
 * @generator
 * @param {Number} limit Upper bound non-inclusive.
 * @yields {Number} next element.
 */
function* finite(limit) {
	if(limit <= 0) throw new Error("finite: limit must be GT 0");
	for(let ix = 0; ix < limit; ix++) yield ix;
}
/**
 * Generate the sequence [0...] without end.
 * @generator
 * @yields {Number} next element.
 */
function* infinite() {
	let ix = 0;
	while(true) yield ix++;
}
/**
 * @callback GridCallback
 * @param {Number} major Major dimension index.
 * @param {Number} minor Minor dimension index.
 * @returns {any} Return as necessary.
 */
/**
 * General-purpose grid coordinate generation.
 * @generator
 * @yields {Number} next element.
 * @param {Generator} major Major dimension generator.
 * @param {Function} minorfunc Minor dimension Generator-returning Function.
 * @param {GridCallback} cb Callback to yield objects back to caller.  Receives (maj.value,min.value) as parameters.
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
 * @generator
 * @yields {{row: Number, column: Number}} Row and Column coordinates.
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
 * @generator
 * @yields {{row: Number, column: Number}} Row and Column coordinates.
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
const ROW = "row", COLUMN = "column";
class TileConfiguration {
	direction
	rows
	columns
	/**
	 * Return the total cells or NaN if one of the dimensions is "auto".
	 */
	get total() { return this.rows*this.columns; }
	/**
	 * Ctor.
	 * Only ONE of rows/columns can be NaN.
	 * @param {String} direction One of ROW or COLUMN.
	 * @param {Number} rows Number of rows (GT 0) or NaN.
	 * @param {Number} columns Number of columns (GT 0) or NaN.
	 */
	constructor(direction, rows, columns) {
		this.direction = direction;
		this.rows = rows;
		this.columns = columns;
		if(isNaN(this.rows) && isNaN(this.columns)) throw new Error("TileConfiguration: both rows and columns are NaN");
		if(!isNaN(this.rows) && this.rows <= 0) throw new Error("rows: must be NaN OR GT 0");
		if(!isNaN(this.columns) && this.columns <= 0) throw new Error("columns: must be NaN OR GT 0");
		switch(this.direction) {
			case ROW:
				if(isNaN(this.columns)) throw new Error("TileConfiguration.ROW: columns is NaN; must be a number");
				break;
			case COLUMN:
				if(isNaN(this.rows)) throw new Error("TileConfiguration.COLUMN: rows is NaN; must be a number");
				break;
			default:
				throw new Error(`TileConfiguration: '${this.direction}' unrecognized direction`);
		}
	}
	/**
	 * Build a Generator for the sequence and return it.
	 * @returns {Generator} A generator configured according to the options.
	 */
	sequence() {
		switch(this.direction) {
			case ROW:
				return rowMajor(isNaN(this.rows) ? infinite() : finite(this.rows), () => finite(this.columns));
			case COLUMN:
				return columnMajor(() => finite(this.rows), isNaN(this.columns) ? infinite() : finite(this.columns));
		}
	}
}
export { finite, infinite, grid, rowMajor, columnMajor, ROW, COLUMN, TileConfiguration }