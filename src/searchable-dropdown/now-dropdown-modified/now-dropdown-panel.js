import { createEnhancedElement } from '@servicenow/library-enhanced-element';
import { Fragment } from '@servicenow/ui-renderer-snabbdom';
import { actionTypes } from '@servicenow/ui-core';
import styles from './_now-dropdown-panel.scss';
import {
	addOutsideScrollListener,
	removeOutsideScrollListener
} from './panel-outside-scroll.js';
import keyBindingBehavior from '@servicenow/behavior-key-binding';
import { getBestFitInfo } from '@servicenow/behavior-fit';
import { t } from '@servicenow/library-translate';
import isEqual from 'lodash/isEqual';
import '@servicenow/now-icon';
import { itemsSchema } from './schemas/dropdown-schema';
import { constrainSchema } from '@servicenow/behavior-fit';

const {
	COMPONENT_DOM_READY,
	COMPONENT_RENDERED,
	COMPONENT_CONNECTED,
	COMPONENT_PROPERTY_CHANGED
} = actionTypes;

/** copy from ./utils/elements.js to isolate panel code*/
function createIdSelector(prefix) {
	return function (host) {
		const componentId = host.getAttribute('component-id');
		return host.shadowRoot.getElementById(`${prefix}-${componentId}`);
	};
}

const getPanelEl = createIdSelector('panel');

const getContentEl = createIdSelector('panel');

const getListboxEl = (host) =>
	host.shadowRoot.querySelector('.now-dropdown-panel-list');

const getItemEls = (host) => {
	return [...host.shadowRoot.querySelectorAll('.now-dropdown-panel-item')];
};

const canRenderDivider = (index, array) => {
	const isLastItem = index === array.length - 1;
	if (isLastItem) {
		return false;
	}

	const nextItem = array[index + 1];
	const isNextSectionWithLabel =
		nextItem.label && Array.isArray(nextItem.children);

	return !isNextSectionWithLabel;
};

const getSelectedItemEls = (host) => {
	return [
		...host.shadowRoot.querySelectorAll(
			'.now-dropdown-panel-item[aria-selected="true"]'
		)
	];
};

const getFocusedItemEl = (host) => {
	return host.shadowRoot.activeElement;
};

const getFocusedItemIndex = (host) => {
	return getItemEls(host).findIndex(
		(element) => element.id === getFocusedItemEl(host).id
	);
};

const getShadowRootHost = (el) => {
	if (el.parentElement) {
		return getShadowRootHost(el.parentElement);
	}
	if (el.parentNode && el.parentNode instanceof DocumentFragment) {
		return el.parentNode.host;
	}
	return null;
};

const isPanelList = (el) =>
	el.getAttribute('role') === 'listbox' || el.getAttribute('role') === 'menu';
// end of utils

/** copy from ./utils/focus.js to isolate panel code*/
const unfocusItem = (host) => {
	const listbox = getListboxEl(host);
	listbox.focus();
};

const focusOnOpen = async (host, alwaysFocusSearchOnOpen) => {
	const listbox = getListboxEl(host);
	listbox.focus();
	const firstFocusItem = alwaysFocusSearchOnOpen
		? getItemEls(host)[0]
		: getSelectedItemEls(host)[0] || getItemEls(host)[0];
	if (firstFocusItem) {
		firstFocusItem.focus();
	}
};

const focusPreviousItem = (host) => {
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

const focusNextItem = (host) => {
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

const focusFirstItem = (host) => {
	const nextFocusItem = getItemEls(host)[0];
	if (nextFocusItem) {
		nextFocusItem.focus();
	}
};

const focusLastItem = (host) => {
	const nextFocusItem = getItemEls(host).slice(-1)[0];
	if (nextFocusItem) {
		nextFocusItem.focus();
	}
};
// end of focus

/** copy from ./utils/helps.js to isolate panel code*/
export const hasPath = (list, path) =>
	list.findIndex((p) => isEqual(p, path)) > -1;

export const removePath = (list, path) => list.filter((p) => !isEqual(p, path));

export const addPath = (list, path) => [...list, path];

export const togglePath = (list, path) =>
	hasPath(list, path) ? removePath(list, path) : addPath(list, path);
// end of helpers

const renderCheckmark = (selected, select) => {
	if (select === 'none') {
		return;
	}
	if (selected) {
		return (
			<now-icon
				className="now-dropdown-panel-checkmark"
				icon="check-fill"
				aria-label={t('selected')}
			/>
		);
	}
	return <div className="now-dropdown-panel-checkmark" />;
};

const renderPresenceOrIcon = (icon, presence, selected) => {
	if (presence) {
		return (
			<now-icon-presence
				className="now-m-inline-end--xxs"
				presence={presence}
			/>
		);
	} else if (icon) {
		return (
			<now-icon
				className="now-m-inline-end--xxs"
				icon={
					selected
						? icon.replace('outline', 'fill')
						: icon.replace('fill', 'outline')
				}
			/>
		);
	}
	return '';
};

const renderDropdownPanelItem = ({
	label,
	selected,
	select,
	onClick,
	key,
	icon,
	presence,
	count,
	disabled,
	focusOnHover
}) => {
	return (
		<div
			tabindex="-1"
			id={key}
			class={{ 'now-dropdown-panel-item': true, 'is-disabled': disabled, 'hover-effect': !focusOnHover }}
			on-mouseover={(e) => {
				if (focusOnHover) e.currentTarget.focus();
			}}
			on-mouseout={(e) => {
				if (focusOnHover) {
					const host = getShadowRootHost(e.currentTarget);
					unfocusItem(host);
				}
			}}
			on-click={disabled ? undefined : onClick}
			role={select === 'none' ? 'menuitem' : 'option'}
			aria-selected={
				disabled || select === 'none' ? undefined : selected ? 'true' : 'false'
			}
			aria-disabled={disabled ? 'true' : undefined}>
			{renderCheckmark(selected, select)}
			{renderPresenceOrIcon(icon, presence, selected)}
			<span className="now-line-height-crop">
				<span className="now-align">
					<span
						className="now-dropdown-panel-label"
						on-mouseover={({ target }) => {
							if (target.offsetWidth < target.scrollWidth) {
								target.title = label;
							}
						}}>
						{label}
					</span>
					{count ? `\u00A0(${count})` : undefined}
				</span>
			</span>
		</div>
	);
};

const view = (state, { dispatch }) => {
	const { componentId, fitStyle } = state;
	const { select, items, selectedItems, searchText, searchIcon, focusOnHover } = state.properties;

	const onItemClick = (item) => {
		dispatch(() => {
			return {
				type: 'NOW_DROPDOWN_PANEL#ITEM_CLICKED',
				payload: { item }
			};
		});
		if (select === 'single' || select === 'multi') {
			dispatch(({ properties }) => {
				return {
					type: 'NOW_DROPDOWN_PANEL#SELECTED_ITEMS_SET',
					payload: {
						value:
							properties.select === 'multi'
								? togglePath(properties.selectedItems, item.id)
								: [item.id]
					}
				};
			});
		}
		if (select !== 'multi') {
			dispatch(() => {
				return {
					type: 'NOW_DROPDOWN_PANEL#OPENED_SET',
					payload: {
						value: false,
						restoreFocus: true
					}
				};
			});
		}
	};

	const renderItem = (item) =>
		renderDropdownPanelItem({
			label: item.label,
			selected:
				selectedItems &&
				selectedItems.length &&
				selectedItems.includes(item.id),
			select,
			onClick: () => onItemClick(item),
			key: `${item.id}-${componentId}`,
			icon: item.icon,
			presence: item.presence,
			count: item.count,
			disabled: item.disabled,
			focusOnHover
		});

	const renderSectionOrItem = (item, index, array) => {
		if (Array.isArray(item.children)) {
			const header = item.label ? (
				<div className="now-dropdown-panel-header">
					<div className="now-dropdown-panel-header-label" title={item.label}>
						{item.label}
					</div>
				</div>
			) : (
					undefined
				);
			const divider = canRenderDivider(index, array) ? (
				<hr className="now-dropdown-panel-divider" />
			) : (
					undefined
				);
			return (
				<Fragment>
					{header}
					{item.children.map(renderItem)}
					{divider}
				</Fragment>
			);
		}
		return renderItem(item);
	};

	return (
		<div
			id={`panel-${componentId}`}
			className="now-dropdown-panel"
			style={fitStyle}>
			{/* {items.length ? */}
				<div className="now-dropdown-panel-search">
					{searchIcon ? <now-icon className="now-dropdown-panel-checkmark" icon={searchIcon}></now-icon> : null}
					<input
						value={searchText}
						className="now-dropdown-panel-item search-box"
						type="text"
						on-input={(e) => {
							/* searchable-dropdown */
							dispatch("SEARCHABLE_DROPDOWN#FILTERED", e.target.value);
						}}
						placeholder="Type to filter">
					</input>
				</div>
				{/* : null} */}
			<div
				className="now-dropdown-panel-list"
				role={select === 'none' ? 'menu' : 'listbox'}
				aria-multiselectable={select === 'multi' ? 'true' : undefined}>
				{items.map(renderSectionOrItem)}
			</div>
		</div>
	);
};

/**
 * The panel portion of a dropdown menu, for displaying a list of items.
 * This component should not be used directly in an application, but is used
 * by other higher level components like now-dropdown and now-split-button.
 *
 * @seismicElement now-dropdown-panel
 * @summary The panel portion of a dropdown menu, for displaying a list of items.
 *
 * */
createEnhancedElement('now-dropdown-panel', {
	properties: {
		/**
		 * An array of `DropdownItem` or `DropdownSection` items.
		 * @type {Array.<DropdownItem|DropdownSection>}
		 */
		items: {
			default: [],
			schema: itemsSchema
		},

		searchText: { default: null },
		alwaysFocusSearchOnOpen: { default: false },
		searchIcon: { default: null },
		focusOnHover: { default: true },
		/**
		 * An array of IDs representing each selected item. If the multi-select mode
		 * is not enabled, the ID of a previously selected item is cleared when
		 * the user selects a new item, and a new ID is added. If the multi-select
		 * mode is enabled, IDs are added to or removed from the list.
		 * @type {Array.<(string|number)>}
		 */
		selectedItems: {
			default: [],
			manageable: true,
			schema: { type: 'array', items: { type: ['string', 'number'] } }
		},
		/**
		 * Determines what happens when the user clicks on a dropdown panel item.
		 * Choose from the following:
		 * - "single" (Default): The panel is closed, the trigger label is updated,
		 *   and the item is marked as selected
		 * - "multi": The panel stays open, the trigger label is updated, and the
		 *   item's selected state is toggled on/off
		 * - "none": The panel is closed, the trigger label is not updated, and the
		 *   item is not marked as selected
		 * @type {("single"|"multi"|"none")}
		 */
		select: {
			default: 'single',
			schema: { type: 'string', enum: ['single', 'multi', 'none'] }
		},
		/**
		 * Automatically updated when the user opens or closes the dropdown panel.
		 * Set `manage-opened` to override this behavior.
		 * @type {boolean}
		 */
		opened: { default: false, manageable: true, schema: { type: 'boolean' } },
		/**
		 * Reference to the element that defines the dropdown panel's relative
		 * position. The panel does not attach click/interaction handlers to this
		 * target. It is your responsibility to do so and to open/close the panel
		 * when the user clicks the trigger. The panel closes automatically when
		 * the user clicks outside or selects an item, depending on the select mode.
		 * @type {HTMLElement}
		 */
		targetRef: {},
		/**
		 * Pixel amount to shift the panel relative to its target.
		 *
		 * @see Fit behavior for valid values.
		 * @type {number}
		 * @private
		 */
		offset: {
			schema: {
				oneOf: [{ type: 'number' }, { type: 'array', items: { type: 'number' } }]
			}
		},
		/**
		 * Element that the panel must fit within.
		 *
		 * @type {HTMLElement}
		 */
		container: {},
		/**
		 * Array of possible positions in which to place the panel,
		 * relative to its target.
		 *
		 * @see Fit behavior for valid values.
		 * @type {Array<string>}
		 */
		position: {
			default: [
				'bottom-start top-start',
				'top-start bottom-start',
				'bottom-end top-end',
				'top-end bottom-end'
			],
			schema: {
				type: 'array',
				items: { type: 'string' }
			}
		},
		/**
		 * Additional size constraints when sizing the panel,
		 * relative to its target.
		 *
		 * @see Fit behavior for valid values.
		 * @type {object}
		 */
		constrain: {
			default: {
				minHeight: 32,
				minWidth: 'target',
				maxWidth: 400,
				maxHeight: 300
			},
			schema: constrainSchema
		}
	},
	initialState: {
		fitStyle: {}
	},
	eventHandlers: [
		{
			events: ['click'],
			effect: ({ action, dispatch, properties, host }) => {
				if (properties.opened) {
					const { event } = action.payload;
					const path = event.composedPath ? event.composedPath() : event.path;
					const hostInPath = path.includes(host);
					if (!hostInPath) {
						dispatch(() => {
							return {
								type: 'NOW_DROPDOWN_PANEL#OPENED_SET',
								payload: {
									value: false,
									restoreFocus: false
								}
							};
						});
					}
				}
			},
			target: document
		}
	],
	actionHandlers: {
		[COMPONENT_CONNECTED]: ({ host, state, properties, dispatch }) => {
			const { targetRef, opened } = properties;
			if (targetRef && opened) {
				addOutsideScrollListener(host, state.componentId, () => {
					// Note: It is usually a VERY BAD IDEA to go reach into the component's
					// DOM and update things without going through the render cycle. In this
					// case we have to reach in and set the panel's visibility to hidden
					// immediately on scroll because dispatching will not trigger a render
					// fast enough and the panel will float there while the user scrolls.
					// It's ok. The component will re-render shortly after and set visibility
					// to hidden from state, so the DOM stays in sync with state.
					const panel = getPanelEl(host);
					if (panel) {
						panel.style.visibility = 'hidden';
					}
					dispatch('NOW_DROPDOWN#OPENED_SET', { value: false });
				});
			}
		},
		[COMPONENT_DOM_READY]: ({ properties, dispatch }) => {
			const { targetRef, opened } = properties;
			if (targetRef && opened) {
				dispatch(() => {
					return {
						type: 'PRIVATE#REFIT',
						payload: { firstOpen: true }
					};
				});
			}
		},
		[COMPONENT_PROPERTY_CHANGED]: ({
			host,
			state,
			properties,
			action,
			dispatch
		}) => {
			const {
				payload: { name, value }
			} = action;

			if (
				(value && (name === 'opened' && properties.targetRef)) ||
				(name === 'targetRef' && properties.opened)
			) {
				addOutsideScrollListener(host, state.componentId, () => {
					// Note: It is usually a VERY BAD IDEA to go reach into the component's
					// DOM and update things without going through the render cycle. In this
					// case we have to reach in and set the panel's visibility to hidden
					// immediately on scroll because dispatching will not trigger a render
					// fast enough and the panel will float there while the user scrolls.
					// It's ok. The component will re-render shortly after and set visibility
					// to hidden from state, so the DOM stays in sync with state.
					const panel = getPanelEl(host);
					if (panel) {
						panel.style.visibility = 'hidden';
					}
					dispatch('NOW_DROPDOWN#OPENED_SET', { value: false });
				});
			} else if (!value && (name === 'opened' || name === 'targetRef')) {
				removeOutsideScrollListener(host);
			}

			if (
				name === 'items' ||
				name === 'container' ||
				name === 'constrain' ||
				name === 'targetRef' ||
				name === 'position' ||
				name === 'offset' ||
				name === 'opened'
			) {
				const firstOpen = name === 'opened';
				dispatch(() => {
					return {
						type: 'PRIVATE#REFIT',
						payload: { firstOpen }
					};
				});
			}
		},
		[COMPONENT_RENDERED]: ({ state, host, updateState }) => {
			// TODO-SEISMIC-HACK: We want to focus the first item in the panel as the
			// panel becomes opened. The challenge here is that we don't know exactly
			// when the updateState that includes the fit changes has finished
			// rendering. The fit state update sets this `firstOpen` state that we
			// can immediately reset here so that we don't try to focus on every
			// render.
			const { properties: { alwaysFocusSearchOnOpen } } = state;
			if (state.firstOpen) {
				focusOnOpen(host, alwaysFocusSearchOnOpen);
				updateState({
					operation: 'set',
					path: 'firstOpen',
					value: false,
					shouldRender: false
				});
			}
		},
		'PRIVATE#REFIT': {
			effect: ({ action, state, properties, updateState, host }) => {
				const {
					targetRef: target,
					container,
					constrain,
					position,
					offset,
					opened
				} = properties;

				const content = getContentEl(host);
				const panelOpened = Boolean(opened && target);
				const fitStyle = panelOpened
					? {
						...getBestFitInfo({
							target,
							content,
							container,
							position,
							offset: Array.isArray(offset)
								? offset
								: [0, 0, offset, offset, offset, offset],
							constrain,
							canScrollVertical: true
						}).style,
						visibility: 'visible'
					}
					: {};
				if (!isEqual(fitStyle, state.fitStyle)) {
					updateState({
						fitStyle,
						firstOpen: action.payload.firstOpen
					});
				}
			},
			stopPropagation: true
		}
	},
	view,
	styles,
	dispatches: {
		/**
		 * Dispatched when the user opens or closes the panel. The payload contains
		 * a boolean of `true` when the dropdown is open or `false` when it is
		 * closed. Set the `manage-opened` property to override
		 * the default behavior and handle this action manually.
		 * @type {{value: boolean}}
		 */
		'NOW_DROPDOWN_PANEL#OPENED_SET': {},
		/**
		 * Dispatched when the user changes the selection of items in the dropdown panel.
		 * The payload contains an array containing either a single ID (`select="single"`)
		 * or multiple IDs (`select="multi"`) of the selected item(s).
		 * Set the `manage-selected-items` property to override the default behavior and
		 * handle this action manually.
		 * @type {{value: Array.<(string|number)>}}
		 */
		'NOW_DROPDOWN_PANEL#SELECTED_ITEMS_SET': {},
		/**
		 * Dispatched when the user selects a dropdown item. The payload contains
		 * a reference to the clicked item. Handle this action for dropdown menus
		 * (where `select="none"`).
		 * @type {{item: DropdownItem}}
		 */
		'NOW_DROPDOWN_PANEL#ITEM_CLICKED': {}
	},
	behaviors: [
		{
			behavior: keyBindingBehavior,
			options: {
				keyBindings: {
					moveFocus: ['Home', 'ArrowUp', 'ArrowDown', 'End'],
					dismiss: ['Escape', 'Tab'],
					select: [' ', 'Enter']
				},
				handlers: {
					moveFocus: (host, event) => {
						event.preventDefault();
						if (event.key === 'Home') {
							focusFirstItem(host);
						}
						if (event.key === 'ArrowDown') {
							focusNextItem(host);
						}
						if (event.key === 'ArrowUp') {
							focusPreviousItem(host);
						}
						if (event.key === 'End') {
							focusLastItem(host);
						}
					},
					dismiss: (host, event, dispatch) => {
						event.stopPropagation();
						dispatch(() => {
							return {
								type: 'NOW_DROPDOWN_PANEL#OPENED_SET',
								payload: {
									value: false,
									restoreFocus:
										event.key === 'Escape' ||
										(event.key === 'Tab' && event.shiftKey)
								}
							};
						});
					},
					select: (host, event) => {
						event.preventDefault();
						event.stopPropagation();
						const itemEl = getFocusedItemEl(host);
						if (itemEl && !itemEl.hasAttribute('aria-disabled')) {
							itemEl.click();
						}
					}
				}
			}
		}
	]
});
