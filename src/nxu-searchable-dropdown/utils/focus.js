import {
	getListboxEl,
	getItemEls,
	getFocusedItemEl,
	getFocusedItemIndex,
	getSelectedItemEls,
	isPanelList
} from './elements.js';
import {flattenItems} from './helpers.js';

/**
 * Removes focus on a given item.
 * @param {HTMLElement} host
 * @param {HTMLElement} itemEl
 */
export const unfocusItem = (host) => {
	const listbox = getListboxEl(host);
	listbox.focus();
};

/**
 * Focuses the first item (or first selected item) when the dropdown panel is opened.
 * @param {HTMLElement} host
 */
export const focusOnOpen = async (host) => {
	const listbox = getListboxEl(host);
	listbox.focus();
	const firstFocusItem = getSelectedItemEls(host)[0] || getItemEls(host)[0];
	if (firstFocusItem) {
		firstFocusItem.focus();
	}
};

/**
 * Moves focus to previous element (if currently focused) or first element.
 * @param {HTMLElement} host
 */
export const focusPreviousItem = (host) => {
	const lastFocusItem = getFocusedItemEl(host);
	if (!lastFocusItem || isPanelList(lastFocusItem)) {
		focusFirstItem(host);
		return;
	}
	const lastFocusIndex = getFocusedItemIndex(host);
	const nextFocusItem = getItemEls(host)[lastFocusIndex - 1];
	if (nextFocusItem) {
		nextFocusItem.focus();
	}
};

/**
 * Moves focus to next element (if currently focused) or first element.
 * @param {HTMLElement} host
 */
export const focusNextItem = (host) => {
	const lastFocusItem = getFocusedItemEl(host);
	if (!lastFocusItem || isPanelList(lastFocusItem)) {
		focusFirstItem(host);
		return;
	}
	const lastFocusIndex = getFocusedItemIndex(host);
	const nextFocusItem = getItemEls(host)[lastFocusIndex + 1];
	if (nextFocusItem) {
		nextFocusItem.focus();
	}
};

/**
 * Focuses the first item in the dropdown panel.
 * @param {HTMLElement} host
 */
export const focusFirstItem = (host) => {
	const nextFocusItem = getItemEls(host)[0];
	if (nextFocusItem) {
		nextFocusItem.focus();
	}
};

/**
 * Focuses the last item in the dropdown panel.
 * @param {HTMLElement} host
 */
export const focusLastItem = (host) => {
	const nextFocusItem = getItemEls(host).slice(-1)[0];
	if (nextFocusItem) {
		nextFocusItem.focus();
	}
};

/**
 * TODO: Hacks/workaround for a Safari + VoiceOver bug. When updating the
 * input's `aria-activedescendant` asynchronously (which happens all the time
 * because Seismic renders asynchronously), VO will read the previously focused
 * item rather than the current focused item. As a workaround, we can update
 * `aria-activedescendant` synchronously outside of a Seismic render, which
 * causes VO to work correctly. This shouldn't impact anything else because
 * Seismic is going to re-render with the correct attributes anyway.
 *
 * To test to see if we can get rid of this: remove this function, open up the
 * typeahead panel, and arrow through the results. VoiceOver should announce
 * the currently focused item in the list.
 */
export const updateActiveDescendant = (input, activeDescendant) => {
	if (input) {
		input.setAttribute('aria-activedescendant', activeDescendant);
	}
};

export function doesKeyChangeActive(key) {
	return ['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(key);
}

export function getRelativeItem(flattenedItems, activeItem, delta) {
	const lastActiveIndex = flattenedItems.findIndex(
		(item) => item.id === activeItem
	);

	const nextIndex = Math.min(
		Math.max(lastActiveIndex + delta, 0),
		flattenedItems.length - 1
	);
	return flattenedItems[nextIndex];
}

export function getItemForKeypress(items, activeItem, key) {
	const flattenedItems = flattenItems(items);

	if (key === 'ArrowDown')
		return getRelativeItem(flattenedItems, activeItem, +1);
	if (key === 'ArrowUp') return getRelativeItem(flattenedItems, activeItem, -1);
	if (key === 'Home') return flattenedItems[0];
	if (key === 'End') return flattenedItems[flattenedItems.length - 1];
}
