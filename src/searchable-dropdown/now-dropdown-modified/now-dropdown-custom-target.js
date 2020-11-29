import {createEnhancedElement} from '@servicenow/library-enhanced-element';
import {Fragment} from '@servicenow/ui-renderer-snabbdom';
import focusBehavior from '@servicenow/behavior-focus';
import {makeRedispatchEffect} from '@servicenow/library-enhanced-utils';
import './now-dropdown-panel';
import {itemsSchema} from './schemas/dropdown-schema';
import {constrainSchema} from '@servicenow/behavior-fit';

const assignedElements = (slot) =>
	[...slot.assignedNodes()].filter(
		(node) => node.nodeType === Element.ELEMENT_NODE
	);

const view = (state, {dispatch, updateState}) => {
	const {targetRef} = state;
	const {
		items,
		selectedItems,
		select,
		opened,
		panelFitProps,
		disableListeners,
		configAria
	} = state.properties;

	return (
		<Fragment>
			<slot
				name="trigger"
				on-slotchange={(e) => {
					if (e.target !== e.currentTarget) {
						return; // ignore bubbling slotchange
					}
					const elements = assignedElements(e.target);
					const targetRef = elements[0] || null;
					updateState({targetRef});
				}}
				on-click={() => {
					if (!opened && !disableListeners) {
						dispatch(() => {
							return {
								type: 'NOW_DROPDOWN_CUSTOM_TARGET#OPENED_SET',
								payload: {value: true}
							};
						});
					}
				}}
			/>
			<now-dropdown-panel
				items={items}
				selected-items={selectedItems}
				manage-selected-items
				select={select}
				opened={opened}
				manage-opened
				target-ref={targetRef}
				position={panelFitProps.position}
				offset={panelFitProps.offset}
				container={panelFitProps.container}
				constrain={panelFitProps.constrain}
				configAria={configAria}
			/>
		</Fragment>
	);
};

/**
 * A dropdown with a custom target is very similar to a standard dropdown.
 * However, the trigger element (the element which toggles the panel
 * visibility) is provided via a slot, allowing more control of the overall
 * appearance.
 *
 * ```jsx
 * const dropdownItems = [{id: 'item1', label: 'Option 1'}, {id: 'item2', label: 'Option 2'}];
 *
 * <now-dropdown-custom-target items={dropdownItems}>
 *   <now-avatar user-name="Fred Luddy" slot="target" />
 * </now-dropdown-custom-target>
 * ```
 *
 * @seismicElement now-dropdown-custom-target
 * @summary A dropdown that allows user to select one or more values and
 * control the element that is responsible for opening and closing the panel.
 **/
createEnhancedElement('now-dropdown-custom-target', {
	initialState: {
		targetRef: null
	},
	properties: {
		/**
		 * By default, the component will listen for click & key events on the
		 * element in the `trigger` slot to cause the dropdown panel to open,
		 * and will restore focus to the `trigger` element when the panel is
		 * closed (on selection or press of the `Escape` key). Set this flag
		 * to override the default behavior and respond to user interactions
		 * manually instead.
		 * @type {boolean}
		 */
		disableListeners: {default: false, schema: {type: 'boolean'}},
		/**
		 * An array of item objects describing each item in the dropdown.
		 * Each object must have a unique id and label.
		 * Items with `disabled` will be visible but not selectable by the user.
		 * @type {(Array.<DropdownItem> | Array.<DropdownSection>)}
		 */
		items: {
			required: true,
			schema: itemsSchema
		},
		/**
		 * An array of ids representing each selected item. If multi-select mode is
		 * not enabled, each time the user selects an item, the previously selected
		 * id will be cleared out and the new id will be added. If multi-select mode is
		 * enabled, ids will be added to or removed from the list.
		 * Use `manage-selected-items` to override the default behavior and handle the
		 * `NOW_DROPDOWN#SELECTED_ITEMS_SET` action manually.
		 * @type {Array.<(string|number)>}
		 */
		selectedItems: {
			default: [],
			manageable: true,
			schema: {type: 'array', items: {type: ['string', 'number']}}
		},
		/**
		 * Determines what happens when the user clicks on a dropdown item.
		 * Choose from the following:
		 * - "single" (default) - the panel is closed, the trigger label is updated,
		 *   and the item is marked as selected
		 * - "multi" - the panel stays open, the trigger label is updated, and the
		 *   item's selected state is toggled on/off
		 * - "none" - the panel is closed, the trigger label is not updated, the
		 *   item is not marked as selected
		 * For select "single"/"multi" handle the `NOW_DROPDOWN#SELECTED_ITEMS_SET`
		 * action. For select "none" handle the `NOW_DROPDOWN#ITEM_CLICKED` action.
		 * @type {("single"|"multi"|"none")}
		 */
		select: {
			default: 'single',
			schema: {type: 'string', enum: ['single', 'multi', 'none']}
		},
		/**
		 * Automatically updated when the user opens or closes the dropdown.
		 * Use `manage-opened` to override the default behavior and handle the
		 * `NOW_DROPDOWN#OPENED_SET` action manually.
		 * @type {boolean}
		 */
		opened: {default: false, manageable: true, schema: {type: 'boolean'}},
		/**
		 * Properties to configure the dropdown panel.
		 *
		 * Valid keys are:
		 *	- position,
		 *	- offset
		 *	- container
		 *	- constrain
		 *
		 * Each of these keys are used to control how the panel is positioned and
		 * scaled relative to the dropdown target.
		 *
		 * @see Fit behavior for more information on each property and valid
		 * values.
		 *
		 * @type {{ position: Array<string>, offset: number, container: HTMLElement, constrain: object }}
		 */
		panelFitProps: {
			default: {},
			schema: {
				type: 'object',
				properties: {
					position: {type: 'array', items: {type: 'string'}},
					offset: {
						oneOf: [{type: 'number'}, {type: 'array', items: {type: 'number'}}]
					},
					container: {type: 'object'},
					constrain: constrainSchema
				}
			}
		},
		/**
		 * An object whose items, all aria properties, will be set on the inner
		 * html `<button>`.
		 * See https://www.w3.org/TR/wai-aria-1.1/#button for properties and
		 * accepted values.
		 * @type {{ 'aria-*': string }}
		 */
		configAria: {
			schema: {
				type: 'object',
				patternProperties: {
					'^aria-': {type: 'string'}
				},
				additionalProperties: false
			}
		}
	},
	view,
	behaviors: [
		{
			behavior: focusBehavior
		}
	],
	eventHandlers: [
		{
			events: ['keydown'],
			effect: ({action, dispatch, properties, state}) => {
				if (properties.disableListeners) {
					return;
				}
				const {event} = action.payload;
				const openKeys = ['ArrowDown', 'Enter', ' '];

				if (openKeys.includes(event.key)) {
					const path = event.composedPath ? event.composedPath() : event.path;
					const {targetRef} = state;
					const targetRefInPath = path.includes(targetRef);
					if (targetRefInPath) {
						event.preventDefault();
						dispatch(() => {
							return {
								type: 'NOW_DROPDOWN_CUSTOM_TARGET#OPENED_SET',
								payload: {
									value: true
								}
							};
						});
					}
				}
			}
		}
	],
	actionHandlers: {
		'NOW_DROPDOWN_PANEL#OPENED_SET': ({state, action, dispatch}) => {
			dispatch(() => {
				return {
					type: 'NOW_DROPDOWN_CUSTOM_TARGET#OPENED_SET',
					payload: action.payload
				};
			});
			if (
				action.payload.restoreFocus &&
				state.targetRef &&
				!state.properties.disableListeners
			) {
				state.targetRef.focus();
			}
		},
		'NOW_DROPDOWN_PANEL#SELECTED_ITEMS_SET': makeRedispatchEffect(
			'NOW_DROPDOWN_CUSTOM_TARGET#SELECTED_ITEMS_SET'
		),
		'NOW_DROPDOWN_PANEL#ITEM_CLICKED': makeRedispatchEffect(
			'NOW_DROPDOWN_CUSTOM_TARGET#ITEM_CLICKED'
		)
	},
	dispatches: {
		/**
		 * Dispatched when the dropdown menu is opened or closed. Payload will contain
		 * a boolean of `true` when the dropdown is opened or `false` when the dropdown is closed.
		 * Set the `manage-opened` property to override the default behavior and
		 * handle this action manually.
		 * @type {{value: boolean}}
		 */
		'NOW_DROPDOWN_CUSTOM_TARGET#OPENED_SET': {},
		/**
		 * Dispatched when the user changes the selection of items in the dropdown panel.
		 * Payload will contain an array containing either a single ID (for `select="single"`) or
		 * multiple IDs (for `select="multi"`) of the selected item(s).
		 * Set the `manage-selected-items` property to override the default behavior and
		 * handle this action manually.
		 * @type {{value: Array.<(string|number)>}}
		 */
		'NOW_DROPDOWN_CUSTOM_TARGET#SELECTED_ITEMS_SET': {},
		/**
		 * Dispatched when the user clicks on a dropdown item. Payload will contain
		 * a reference to the clicked item. Handle this action for dropdown menus (where `select="none"`).
		 * @type {{item: Object}}
		 */
		'NOW_DROPDOWN_CUSTOM_TARGET#ITEM_CLICKED': {}
	},
	slots: {
		/**
		 * Content placed in this named slot will act as the trigger element for
		 * the `now-dropdown-custom-target` component. The dropdown panel will
		 * be positioned relative to the first child element of the slot. Clicks
		 * and keyboard interaction with the slot and its content will be
		 * handled automatically unless the `disableListeners` property is set.
		 */
		trigger: {}
	}
});
