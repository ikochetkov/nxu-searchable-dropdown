/* dropdown-panel only, deprecated */

const hostToScrollData = new WeakMap();

/**
 * Attaches a listener to the window, then fires a fake event from the given element
 * to identify all ancestor elements in the element's DOM tree. More efficient than
 * climbing the tree recursively.
 * @param {HTMLElement} element
 * @param {string} uuid
 */
const findAncestors = (element, uuid) =>
	new Promise((resolve) => {
		const eventName = `findAncestors-${uuid}`;
		const findListener = (e) => {
			window.removeEventListener(eventName, findListener);
			const path = e.composedPath ? e.composedPath() : e.path;
			resolve([
				...path.filter(
					(n) => n !== element && n.nodeType === Node.ELEMENT_NODE
				),
				document,
				window
			]);
		};
		window.addEventListener(eventName, findListener);
		const event = new CustomEvent(eventName, {
			bubbles: true,
			composed: true,
			cancelable: false
		});
		element.dispatchEvent(event);
	});

/**
 * Attaches scroll listeners to the document, the window, and all ancestor elements
 * of the given host element that have shadow roots (because scroll events do not automatically
 * bubble through shadow boundaries). When any of the scroll listeners are fired, triggers
 * the callback function.
 * @param {HTMLElement} host
 * @param {string} componentId
 * @param {function} callback
 */
export const addOutsideScrollListener = async (host, componentId, callback) => {
	const ancestors = await findAncestors(host, componentId);
	const targets = ancestors.filter((el) => !!el.shadowRoot);
	let handled = false;
	const listener = (e) => {
		if (handled) {
			return;
		}
		const [source] = e.composedPath ? e.composedPath() : e.path;
		if (ancestors.indexOf(source) > -1) {
			handled = true;
			removeOutsideScrollListener(host);
			if (callback && typeof callback === 'function') {
				callback(host, componentId);
			}
		}
	};
	for (let target of targets) {
		target.shadowRoot.addEventListener('scroll', listener, true);
	}
	window.addEventListener('scroll', listener, true);
	hostToScrollData.set(host, {listener, targets});
};

/**
 * Cleans up all scroll listeners created for the given host element.
 * @param {HTMLElement} host
 */
export const removeOutsideScrollListener = (host) => {
	if (hostToScrollData.has(host)) {
		const {listener, targets} = hostToScrollData.get(host);
		for (let target of targets) {
			target.shadowRoot.removeEventListener('scroll', listener, true);
		}
		window.removeEventListener('scroll', listener, true);
		hostToScrollData.delete(host);
	}
};
