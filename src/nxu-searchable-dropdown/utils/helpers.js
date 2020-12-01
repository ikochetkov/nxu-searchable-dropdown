import {isEqual, flatMap, isString} from 'lodash';
import {matchSearchTerm} from '@servicenow/library-enhanced-utils';

export const hasPath = (list, path) =>
	list.findIndex((p) => isEqual(p, path)) > -1;

export const removePath = (list, path) => list.filter((p) => !isEqual(p, path));

export const addPath = (list, path) => [...list, path];

export const togglePath = (list, path) =>
	hasPath(list, path) ? removePath(list, path) : addPath(list, path);

export const flattenItems = (items) =>
	flatMap(items, (item) => item.children || item);

export const canRenderDivider = (index, array) => {
	const isLastItem = index === array.length - 1;
	if (isLastItem) {
		return false;
	}

	const nextItem = array[index + 1];
	const isNextSectionWithLabel =
		nextItem.label && Array.isArray(nextItem.children);

	return !isNextSectionWithLabel;
};

/**
 * Adds highlighting to either the label or the sublabel, but not both. If
 * there is a match in the label, we don't want to highlight the sublabel
 */
export const highlightLabels = (label, sublabel, searchTerm) => {
	const className = 'has-highlight';

	const highlightedLabel = matchSearchTerm(searchTerm, label, className, {
		location: 'first'
	});

	// matchSearchTerm returns the original string if there are no matches,
	// otherwise it returns an array
	const highlightedSublabel =
		sublabel && isString(highlightedLabel)
			? matchSearchTerm(searchTerm, sublabel, className, {location: 'first'})
			: sublabel;

	return [highlightedLabel, highlightedSublabel];
};

export const getSearchMatches = (items, value, search) => {
	if (!items || !items.length) {
		return [];
	}

	if (!value || search === 'managed' || search === 'none') {
		return items;
	}

	const matchesLabel = {};

	return (
		items
			.reduce((result, item) => {
				const children = getSearchMatches(item.children, value, search);
				if (children.length) {
					result.push({
						...item,
						children
					});
				} else {
					const label = item.label ? item.label.toLowerCase() : '';
					const sublabel = item.sublabel ? item.sublabel.toLowerCase() : '';
					const lowerValue = value.toLowerCase();

					const method = search === 'contains' ? 'includes' : 'startsWith';

					if (label[method](lowerValue)) {
						matchesLabel[item.id] = true;
						result.push(item);
					} else if (sublabel[method](lowerValue)) {
						matchesLabel[item.id] = false;
						result.push(item);
					}
				}

				return result;
			}, [])
			// sort the items so that matches on primary label come
			// before matches on sublabel
			.sort((a, b) => matchesLabel[b.id] - matchesLabel[a.id])
	);
};
