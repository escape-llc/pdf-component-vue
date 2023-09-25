class ScrollConfiguration {
	root
	// top,left,right,bottom
	rootMargin
	constructor(root, rootMargin) {
		this.root = root;
		this.rootMargin = rootMargin;
	}
}

export { ScrollConfiguration }