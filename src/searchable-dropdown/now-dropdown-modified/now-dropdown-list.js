import {createEnhancedElement} from '@servicenow/library-enhanced-element';
import {Fragment} from '@servicenow/ui-renderer-snabbdom';
import styles from './_now-dropdown-list.scss';
import {
	highlightLabels,
	canRenderDivider,
	togglePath,
	getSearchMatches
} from './utils/helpers';
import {
	doesKeyChangeActive,
	getItemForKeypress,
	updateActiveDescendant
} from './utils/focus.js';
import {t} from '@servicenow/library-translate';
import '@servicenow/now-icon';
import '@servicenow/now-avatar';
import {itemsSchema} from './schemas/dropdown-list-schema';
import screenReaderBehavior from './behavior-screen-reader';
import focusBehavior from '@servicenow/behavior-focus';
import {actionTypes} from '@servicenow/ui-core';
const {COMPONENT_PROPERTY_CHANGED} = actionTypes;

const handleItemClick = (item, select, dispatch) => {
	dispatch(() => {
		return {
			type: 'NOW_DROPDOWN_LIST#ITEM_CLICKED',
			payload: {item}
		};
	});
	if (select === 'single' || select === 'multi') {
		dispatch(({properties}) => {
			return {
				type: 'NOW_DROPDOWN_LIST#SELECTED_ITEMS_SET',
				payload: {
					value:
						properties.select === 'multi'
							? togglePath(properties.selectedItems, item.id)
							: [item.id]
				}
			};
		});
	}
};

/**
 * Workaround for this webkit bug:
 * https://bugs.webkit.org/show_bug.cgi?id=209975
 *
 * Normally, to get Safari + VO to work correctly, the listbox must not be
 * displayed at the time the input receives focus. However, we found that
 * clearing out and re-assigning the role=listbox also works, but only when
 * there is some delay :shrug:
 *
 * To test this, focus in the input field and use arrow keys to change the
 * aria-activedescendant value. Safari + VO should announce the active items as
 * they are changed.
 */
const handleSearchFocus = (event, updateState) => {
	const root = event.target.getRootNode();
	const listbox = root.querySelector('.now-dropdown-list-item-container');
	listbox.removeAttribute('role');
	setTimeout(() => {
		listbox.setAttribute('role', 'listbox');
	}, 50);

	updateState({searchHasFocus: false});
};

const renderCheckmark = (selected, select, hideCheckmark) => {
	if (hideCheckmark || select === 'none') {
		return;
	}
	if (selected) {
		return (
			<now-icon
				className="now-dropdown-list-checkmark"
				icon="check-fill"
				aria-label={t('selected')}
			/>
		);
	}
	return <div className="now-dropdown-list-checkmark" />;
};

const renderIdentifier = (icon, presence, avatarProps, selected) => {
	if (presence) {
		return (
			<now-icon-presence
				className="now-dropdown-list-identifier now-m-inline-end--xxs"
				presence={presence}
			/>
		);
	} else if (icon) {
		return (
			<now-icon
				className="now-dropdown-list-identifier now-m-inline-end--xxs"
				icon={
					selected
						? icon.replace('outline', 'fill')
						: icon.replace('fill', 'outline')
				}
			/>
		);
	} else if (avatarProps) {
		return (
			<now-avatar
				className="now-dropdown-list-identifier now-m-inline-end--sm"
				user-name={avatarProps.userName}
				image-src={avatarProps.imageSrc}
				presence={avatarProps.presence}
				size="sm"
				hide-tooltip
			/>
		);
	}
	return undefined;
};

const renderLabel = (label, count) => {
	return (
		<span className="now-line-height-crop">
			<span className="now-align">
				<span
					className="will-truncate"
					on-mouseover={({target}) => {
						if (target.offsetWidth < target.scrollWidth) {
							target.title = label;
						}
					}}>
					{label}
				</span>
				{count ? `\u00A0(${count})` : undefined}
			</span>
		</span>
	);
};

const renderLabels = (label, sublabel, count, searchTerm) => {
	const [highlightedLabel, highlightedSublabel] = highlightLabels(
		label,
		sublabel,
		searchTerm
	);

	return (
		<div className="now-dropdown-list-labels">
			{renderLabel(highlightedLabel, count)}
			{sublabel ? (
				<span className="now-dropdown-list-sublabel">
					<span className="now-line-height-crop">
						<span
							className="will-truncate"
							on-mouseover={({target}) => {
								if (target.offsetWidth < target.scrollWidth) {
									target.title = sublabel;
								}
							}}>
							{highlightedSublabel}
						</span>
					</span>
				</span>
			) : (
				undefined
			)}
		</div>
	);
};

const renderHeader = (item) =>
	item.label ? (
		<div
			className="now-dropdown-list-header"
			on-mousedown={(e) => e.preventDefault()}>
			<span className="will-truncate" title={item.label}>
				{item.label}
			</span>
		</div>
	) : (
		undefined
	);

const renderDivider = (index, array) =>
	canRenderDivider(index, array) ? (
		<hr className="now-dropdown-list-divider" />
	) : (
		undefined
	);

const renderDropdownListItem = ({
	label,
	sublabel,
	selected,
	select,
	onClick,
	id,
	key,
	icon,
	presence,
	avatarProps,
	count,
	disabled,
	searchTerm,
	activeItem,
	hideCheckmark,
	dispatch
}) => {
	return (
		<div
			id={id}
			key={key}
			screen-reader-behavior-id={`option-${id}`}
			class={{
				'now-dropdown-list-item': true,
				'is-disabled': disabled,
				'is-focused': id === activeItem,
				'is-multi-line': sublabel
			}}
			on-mouseover={(e) => {
				const id = e.currentTarget.id;
				dispatch(() => {
					return {
						type: 'NOW_DROPDOWN_LIST#ACTIVE_ITEM_SET',
						payload: {value: id}
					};
				});
			}}
			on-mousedown={disabled ? (e) => e.preventDefault() : undefined}
			on-click={disabled ? undefined : onClick}
			role={select === 'none' ? 'menuitem' : 'option'}
			aria-selected={
				disabled || select === 'none' ? undefined : selected ? 'true' : 'false'
			}
			aria-disabled={disabled ? 'true' : undefined}>
			{renderCheckmark(selected, select, hideCheckmark)}
			{renderIdentifier(icon, presence, avatarProps, selected)}
			{renderLabels(label, sublabel, count, searchTerm)}
		</div>
	);
};

const renderSectionsOrItems = (
	items,
	selectedItems,
	select,
	componentId,
	dispatch,
	searchTerm,
	search,
	activeItem,
	hideCheckmark
) => {
	const filteredItems = getSearchMatches(items, searchTerm, search);

	if (!filteredItems.length) {
		return (
			<div className="now-dropdown-list-header">{t('No Results Found')}</div>
		);
	}

	const renderItem = (item) => {
		return renderDropdownListItem({
			label: item.label,
			sublabel: item.sublabel,
			selected: selectedItems && selectedItems.includes(item.id),
			select,
			onClick: () => handleItemClick(item, select, dispatch),
			id: item.id,
			key: `${item.id}-${componentId}`,
			icon: item.icon,
			presence: item.presence,
			avatarProps: item.avatarProps,
			count: item.count,
			disabled: item.disabled,
			searchTerm,
			hideCheckmark,
			activeItem,
			dispatch
		});
	};

	return filteredItems.map((item, index, array) => {
		if (Array.isArray(item.children)) {
			return (
				<Fragment>
					{renderHeader(item)}
					{item.children.map(renderItem)}
					{renderDivider(index, array)}
				</Fragment>
			);
		}

		return renderItem(item);
	});
};

const renderSearch = (
	search,
	searchTerm,
	activeItem,
	componentId,
	updateState,
	dispatch
) => {
	if (search === 'none') return;
	return (
		<div
			className="now-dropdown-list-search"
			/* eslint-disable-next-line jsx-a11y/role-has-required-aria-props */
			role="combobox"
			aria-expanded="true"
			aria-owns={`${componentId}-item-container`}>
			<now-icon className="now-p-inline--sm" icon="magnifying-glass-outline" />
			<input
				className="now-dropdown-list-search-field"
				on-input={(e) =>
					dispatch('NOW_DROPDOWN_LIST#SEARCH_TERM_SET', {
						value: e.target.value
					})
				}
				on-focus={(e) => handleSearchFocus(e, updateState)}
				on-blur={() => updateState({searchHasFocus: false})}
				placeholder="Search"
				value={searchTerm}
				aria-activedescendant={activeItem}
				aria-controls={`${componentId}-item-container`}
			/>
		</div>
	);
};

const view = (state, {dispatch, updateState}) => {
	const {componentId} = state;
	const {
		items,
		selectedItems,
		select,
		search,
		searchTerm,
		activeItem,
		hideCheckmark,
		disableRole
	} = state.properties;

	const menuOrListbox = select === 'none' ? 'menu' : 'listbox';
	const role = disableRole ? undefined : menuOrListbox;

	return (
		<div className="now-dropdown-list">
			{renderSearch(
				search,
				searchTerm,
				activeItem,
				componentId,
				updateState,
				dispatch
			)}
			<div
				id={`${componentId}-item-container`}
				role={role}
				screen-reader-behavior-id={menuOrListbox}
				aria-multiselectable={select === 'multi' ? 'true' : undefined}
				className="now-dropdown-list-item-container">
				{renderSectionsOrItems(
					items,
					selectedItems,
					select,
					componentId,
					dispatch,
					searchTerm,
					search,
					activeItem,
					hideCheckmark
				)}
			</div>
		</div>
	);
};

/**
 * **NOTE**: This component is **NOT** publicly supported and is not intended
 * to be used outside of the design system. Changes to this component can
 * happen at any time without notice. If you have a similar use-case that may
 * be solved by this component, please reach out to the design system team and
 * we can work with you on the best way to move forward.
 *
 * The list portion of a dropdown menu, for displaying a list of items.
 *
 * @seismicElement now-dropdown-list
 * @summary The list portion of a dropdown menu, for displaying a list of items.
 * @private
 */
createEnhancedElement('now-dropdown-list', {
	properties: {
		/**
		 * An array of `DropdownListItem` or `DropdownSection` items.
		 * @type {Array.<DropdownListItem|DropdownSection>}
		 */
		items: {
			default: [],
			schema: itemsSchema
		},
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
			schema: {type: 'array', items: {type: ['string', 'number']}}
		},
		/**
		 * Determines what happens when the user clicks on a dropdown list item.
		 * Choose from the following:
		 * - "single" (Default): The list is closed, the trigger label is updated,
		 *   and the item is marked as selected
		 * - "multi": The list stays open, the trigger label is updated, and the
		 *   item's selected state is toggled on/off
		 * - "none": The list is closed, the trigger label is not updated, and the
		 *   item is not marked as selected
		 * @type {("single"|"multi"|"none")}
		 */
		select: {
			default: 'single',
			schema: {type: 'string', enum: ['single', 'multi', 'none']}
		},

		/**
		 * If true, do not render the checkmark next to a selected item. Only
		 * applies when the value of `select` is "single".
		 * @type {boolean}
		 * @private
		 */
		hideCheckmark: {
			default: false,
			schema: {type: 'boolean'}
		},

		// TODO: this property is :blobsad:
		/**
		 * If true, the `menu` or `listbox` parent role is not set on the element
		 * containing the items. This should only be used when a parent component
		 * manages these roles instead.
		 * @type {boolean}
		 * @private
		 */
		disableRole: {
			default: false,
			schema: {type: 'boolean'}
		},
		/**
		 * Controls how to filter the items as the user types into the integrated search input.
		 * - "none": (default) dropdown list does not display an internal search field.
		 * - "managed": internal input field is rendered, but no automatic filtering will happen.
		 * Use this if you want to manually filter or search for items as the user types outside of the list.
		 * - "initial": internal input field is rendered, and items whose label
		 * or sublabel begins with the input value will be displayed. This is case-insensitive.
		 * - "contains": internal input field is rendered, and items whose label
		 * or sublabel contains the input value will be displayed. This is case-insensitive.
		 * @type {"none"|"managed"|"initial"|"contains"}
		 */
		search: {
			default: 'none',
			schema: {
				type: 'string',
				enum: ['none', 'managed', 'initial', 'contains']
			}
		},
		/**
		 * Current value of the internal search field, for use with highlighting
		 * and filtering within the dropdown list.
		 * @type {string}
		 */
		searchTerm: {default: '', manageable: true, schema: {type: 'string'}},
		/**
		 * ID of the current active descendant in the dropdown list.
		 * @type {string}
		 */
		activeItem: {manageable: true, schema: {type: ['string', 'null']}}
	},
	dispatches: {
		/**
		 * Dispatched when the user changes the selection of items in the dropdown list.
		 * The payload contains an array containing either a single ID (`select="single"`)
		 * or multiple IDs (`select="multi"`) of the selected item(s).
		 * Set the `manage-selected-items` property to override the default behavior and
		 * handle this action manually.
		 * @type {{value: Array.<(string|number)>}}
		 */
		'NOW_DROPDOWN_LIST#SELECTED_ITEMS_SET': {},
		/**
		 * Dispatched when the user selects a dropdown item. The payload contains
		 * a reference to the clicked item. Handle this action for dropdown menus
		 * (where `select="none"`).
		 * @type {{item: DropdownItem}}
		 */
		'NOW_DROPDOWN_LIST#ITEM_CLICKED': {},
		/**
		 * Dispatched when the user hovers over an item in the dropdown list or
		 * presses the `ArrowUp`, `ArrowDown`, `Home` or `End` keys while focused
		 * in the internal search field. The payload contains the ID of the item.
		 * Set the `manage-active-item` property to override the default behavior
		 * and handle this action manually.
		 * @type {{value: string}}
		 */
		'NOW_DROPDOWN_LIST#ACTIVE_ITEM_SET': {},
		/**
		 * Dispatched when the user inputs text in the internal search field.
		 * Set the `manage-search-term` property to override the default behavior
		 * and handle this action manually.
		 * @type {{value: string}}
		 */
		'NOW_DROPDOWN_LIST#SEARCH_TERM_SET': {}
	},
	initialState: {
		searchHasFocus: false
	},
	eventHandlers: [
		{
			events: ['keydown'],
			effect({action, host, dispatch, properties, state}) {
				const {key} = action.payload.event;
				const {searchHasFocus} = state;
				const root = (action.meta.hoistHost || host).shadowRoot;
				if (key === 'Enter' || (key === ' ' && !searchHasFocus)) {
					action.preventDefault();
					action.stopPropagation();
					const {activeItem} = properties;
					const itemEl = root.getElementById(activeItem);
					if (itemEl && !itemEl.hasAttribute('aria-disabled')) {
						itemEl.click();
					}
				} else if (doesKeyChangeActive(key)) {
					action.preventDefault();
					action.stopPropagation();

					const {search, items, searchTerm, activeItem} = properties;
					const filteredItems = getSearchMatches(items, searchTerm, search);
					const nextActiveItem = getItemForKeypress(
						filteredItems,
						activeItem,
						key
					);

					if (nextActiveItem) {
						if (search !== 'none') {
							const input = root.querySelector(
								'.now-dropdown-list-search-field'
							);

							// TODO: Hacks/workaround for Safari + VoiceOver. See comment in
							// function definition. This is also kind of weird because
							// dropdown-list accepts activeItem as a prop, so there's a
							// chance that this gets out of sync with the property value. But
							// we don't run into this with our current usage of dropdown-list
							// in select + typeahead + typeahead-multi.
							updateActiveDescendant(input, nextActiveItem.id);
						}

						dispatch(() => {
							return {
								type: 'NOW_DROPDOWN_LIST#ACTIVE_ITEM_SET',
								payload: {value: nextActiveItem.id}
							};
						});
					}
				}
			}
		}
	],
	actionHandlers: {
		[COMPONENT_PROPERTY_CHANGED]: ({host, action}) => {
			const {
				payload: {name, value},
				meta: {hoistHost}
			} = action;
			if (name === 'activeItem' && value) {
				const nextActiveItem = (hoistHost || host).shadowRoot.getElementById(
					value
				);
				if (nextActiveItem) {
					nextActiveItem.scrollIntoView({
						behavior: 'smooth',
						block: 'nearest',
						inline: 'start'
					});
				}
			}
		}
	},
	behaviors: [
		{
			behavior: screenReaderBehavior,
			options: {
				screenReaderView: view
			}
		},
		{
			behavior: focusBehavior
		}
	],
	styles,
	view
});
