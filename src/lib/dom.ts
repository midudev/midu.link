/** Single element. Returns `null` if not found. */
export function $<T extends Element = Element>(
	selector: string,
	parent: ParentNode = document,
): T | null {
	return parent.querySelector<T>(selector);
}

/** All matching elements as an array. */
export function $$<T extends Element = Element>(
	selector: string,
	parent: ParentNode = document,
): T[] {
	return Array.from(parent.querySelectorAll<T>(selector));
}
