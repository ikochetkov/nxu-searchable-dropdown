import { createEnhancedElement } from '@servicenow/library-enhanced-element';
import {
	extensionSplit,
	filterAriaAttributes,
	makeRedispatchEffect
} from '@servicenow/library-enhanced-utils';
import { Fragment } from '@servicenow/ui-renderer-snabbdom';
import styles from './_now-dropdown.scss';
import { getFocusedEl, getTriggerEl } from './utils/elements.js';
import keyBindingBehavior from '@servicenow/behavior-key-binding';
import focusBehavior from '@servicenow/behavior-focus';
import '@servicenow/now-icon';
import '@servicenow/now-tooltip';
import './now-dropdown-panel';
import { t } from '@servicenow/library-translate';
import { itemsSchema } from './schemas/dropdown-schema';
import { constrainSchema } from '@servicenow/behavior-fit';
import { actionTypes } from '@servicenow/ui-core';
const { COMPONENT_BOOTSTRAPPED } = actionTypes;

const renderDropdownTrigger = ({
	label,
	icon,
	presence,
	count,
	disabled,
	variant,
	size,
	bare,
	hideCaret,
	onClick,
	updateState,
	opened,
	tooltipContent,
	fitTarget,
	hideLabel,
	showPadding,
	configAria,
	componentId
}) => {
	const setFitTarget = (ref) => setTimeout(() => updateState({ fitTarget: ref }));
	const hasLabel = label && !hideLabel;

	let renderIcon = '';
	if (presence) {
		renderIcon = (
			<now-icon-presence
				presence={presence}
				size={size}
				class={{
					'now-m-inline-end--xxs': hasLabel && size !== 'lg',
					'now-m-inline-end--xs': hasLabel && size === 'lg'
				}}
			/>
		);
	} else if (icon) {
		renderIcon = (
			<now-icon
				icon={icon}
				size={size}
				class={{
					'now-m-inline-end--xxs': hasLabel && size !== 'lg',
					'now-m-inline-end--xs': hasLabel && size === 'lg'
				}}
			/>
		);
	}
	const renderTooltip = tooltipContent ? (
		<now-tooltip
			id={`tooltip-${componentId}`}
			target-ref={fitTarget}
			content={tooltipContent}
		/>
	) : (
			undefined
		);
	const renderLabel = hasLabel ? (
		<span
			class={{
				'now-dropdown-label': true,
				'now-m-inline-start--xxs': icon
			}}
			title={label}>
			{label}
		</span>
	) : (
			<span />
		);
	const renderCount = count ? `\u00A0(${count})` : undefined;
	const renderCaret = hideCaret ? (
		''
	) : (
			<now-icon
				class={{
					'now-m-inline-start--xxs': hasLabel && size !== 'lg',
					'now-m-inline-start--xs': hasLabel && size === 'lg'
				}}
				size={size}
				icon="caret-down-fill"
			/>
		);

	return (
		<Fragment>
			<button
				id={`trigger-${componentId}`}
				class={{
					'now-dropdown': true,
					...(!disabled ? extensionSplit(variant) : {}),
					['-' + size]: size,
					'is-bare':
						bare &&
						(variant === 'secondary' ||
							variant === 'secondary-selected' ||
							variant === 'tertiary' ||
							variant === 'inherit'),
					'is-disabled': disabled,
					'has-label': !hideLabel && label,
					'has-caret': !hideCaret,
					'is-active': opened,
					'show-padding': showPadding
				}}
				disabled={disabled}
				on-click={onClick}
				on-keyup={(e) => e.preventDefault()}
				hook-insert={({ elm }) => setFitTarget(elm)}
				hook-destroy={() => setFitTarget(null)}
				{...filterAriaAttributes(configAria)}
				aria-haspopup="listbox"
				aria-expanded={opened ? 'true' : 'false'}
				aria-describedby={
					tooltipContent ? `tooltip-${componentId}` : undefined
				}>
				<slot name="trigger-content">
					{renderIcon}
					<span className="now-line-height-crop">
						<span className="now-align">
							{renderLabel}
							{renderCount}
						</span>
					</span>
					{renderCaret}
				</slot>
			</button>
			{ renderTooltip}
		</Fragment >
	);
};

const getSelected = (items, selectedItemId) => {
	const hasNestedChildren = items.some((item) =>
		item.hasOwnProperty('children')
	);
	if (hasNestedChildren) {
		return items
			.reduce(
				(acc, item) =>
					Array.isArray(item.children)
						? [...acc, ...item.children]
						: [...acc, item],
				[]
			)
			.find((item) => item.id === selectedItemId);
	} else {
		return items.find((item) => selectedItemId === item.id);
	}
};

const getTriggerLabel = (placeholder, selected, selectedItems) => {
	if (Array.isArray(selectedItems) && selectedItems.length > 1) {
		return t('{0} items selected', selectedItems.length);
	} else if (selected) {
		return selected.label;
	}
	return placeholder;
};

const getTriggerIcon = (icon, selected) => {
	if (selected && selected.icon) {
		return selected.icon.replace('outline', 'fill');
	}
	if (selected && selected.presence) {
		return 'presence-fill';
	}
	return icon;
};

const view = (state, { dispatch, updateState }) => {
	const { componentId, fitTarget, properties, choices, searchText } = state;
	const {
		opened,
		select,
		items,
		selectedItems,
		placeholder,
		icon,
		disabled,
		variant,
		size,
		bare,
		hideCaret,
		tooltipContent,
		panelFitProps = {},
		hideLabel,
		showPadding,
		configAria,
		alwaysFocusSearchOnOpen,
		searchIcon,
		focusOnHover
	} = properties;

	const onToggleOpened = (evt) => {
		if (!disabled) {
			evt.preventDefault();
			dispatch(({ properties }) => {
				return {
					type: 'NOW_DROPDOWN#OPENED_SET',
					payload: { value: !properties.opened }
				};
			});
		}
	};

	let selected;
	if (Array.isArray(selectedItems) && selectedItems.length === 1) {
		selected = getSelected(items, selectedItems[0]);
	}


	return (
		<Fragment>
			{renderDropdownTrigger({
				label: getTriggerLabel(placeholder, selected, selectedItems),
				icon: getTriggerIcon(icon, selected),
				presence: selected && selected.presence ? selected.presence : undefined,
				count: selected && selected.count ? selected.count : undefined,
				disabled,
				variant,
				size,
				bare,
				hideCaret,
				onClick: onToggleOpened,
				updateState,
				opened,
				tooltipContent,
				fitTarget,
				hideLabel,
				showPadding,
				configAria,
				componentId
			})}
			<now-dropdown-panel
				id={`panel-${componentId}`}
				items={choices}
				selected-items={selectedItems}
				manage-selected-items
				select={select}
				opened={opened}
				manage-opened
				target-ref={fitTarget}
				position={panelFitProps.position}
				offset={panelFitProps.offset}
				container={panelFitProps.container}
				constrain={panelFitProps.constrain}
				searchText={searchText}
				searchIcon={searchIcon}
				alwaysFocusSearchOnOpen={alwaysFocusSearchOnOpen}
				focusOnHover={focusOnHover}
			/>
		</Fragment>
	);
};

createEnhancedElement('now-dropdown', {
	initialState: {
		choices: [],
		searchText: '',
		selectedValue: []
	},
	properties: {
		items: {
			required: true, schema: itemsSchema, default: [
				{ "id": "al", "label": "Alabama" },
				{ "id": "ak", "label": "Alaska" },
				{ "id": "az", "label": "Arizona" },
				{ "id": "ar", "label": "Arkansas" },
				{ "id": "ca", "label": "California" },
				{ "id": "co", "label": "Colorado" }
			]
		},
		searchIcon: { default: "magnifying-glass-fill" },
		alwaysFocusSearchOnOpen: {
			default: false
		},
		focusOnHover: { default: true },
		selectedItems: {
			default: [],
			manageable: true,
			schema: { type: 'array', items: { type: ['string', 'number'] } }
		},
		select: {
			default: 'single',
			schema: { type: 'string', enum: ['single', 'multi', 'none'] }
		},
		opened: { default: false, manageable: true, schema: { type: 'boolean' } },
		placeholder: { schema: { type: 'string' }, default: "(empty)" },
		disabled: { default: false, schema: { type: 'boolean' } },
		icon: { schema: { type: 'string' } },
		variant: {
			default: 'secondary',
			schema: {
				type: 'string',
				enum: [
					'primary',
					'secondary',
					'secondary-selected',
					'tertiary',
					'tertiary-selected',
					'inherit'
				]
			}
		},
		size: { default: 'md', schema: { type: 'string', enum: ['sm', 'md', 'lg'] } },
		bare: { default: false, schema: { type: 'boolean' } },
		hideCaret: { default: false, schema: { type: 'boolean' } },
		tooltipContent: { schema: { type: 'string' } },

		panelFitProps: {
			default: {},
			schema: {
				type: 'object',
				properties: {
					position: { type: 'array', items: { type: 'string' } },
					offset: {
						oneOf: [{ type: 'number' }, { type: 'array', items: { type: 'number' } }]
					},
					container: { type: 'object' },
					constrain: constrainSchema
				}
			}
		},
		hideLabel: { default: false, schema: { type: 'boolean' } },
		showPadding: { default: false, schema: { type: 'boolean' } },
		configAria: {
			schema: {
				type: 'object',
				patternProperties: {
					'^aria-': { type: 'string' }
				},
				additionalProperties: false
			}
		}
	},
	view,
	styles,
	actionHandlers: {
		'NOW_DROPDOWN_PANEL#OPENED_SET': ({ action, dispatch, state }) => {
			dispatch(() => {
				return {
					type: 'NOW_DROPDOWN#OPENED_SET',
					payload: action.payload
				};
			});
			if (action.payload.restoreFocus) {
				state.fitTarget.focus();
			}
		},
		// 'NOW_DROPDOWN#OPENED_SET': (coeffects) => {
		// 	const { properties, updateProperties } = coeffects;
		// 	updateProperties({ opened: !properties.opened })
		// },

		'NOW_DROPDOWN_PANEL#SELECTED_ITEMS_SET': makeRedispatchEffect(
			'NOW_DROPDOWN#SELECTED_ITEMS_SET'
		),
		'NOW_DROPDOWN_PANEL#ITEM_CLICKED': makeRedispatchEffect(
			'NOW_DROPDOWN#ITEM_CLICKED'
		),
		[COMPONENT_BOOTSTRAPPED]: ({ properties, updateState }) => {
			updateState({ choices: properties.items })
		},
		"SEARCHABLE_DROPDOWN#FILTERED": ({ updateState, properties, action: { payload: searchText } }) => {
			const { items } = properties;
			const choicesToShow = searchText
				? items.filter(item => item.label.toLowerCase().includes(searchText.toLowerCase()))
				: items;
			updateState({ choices: choicesToShow, searchText: searchText });

		},
		"NOW_DROPDOWN_PANEL#OPENED_SET": ({ state, dispatch, action, updateProperties }) => {
			const { payload: { value } } = action;
			updateProperties({ opened: value });
			if (!value) state.fitTarget.focus();
			dispatch("SEARCHABLE_DROPDOWN#FILTERED", "");
		},
		'NOW_DROPDOWN_PANEL#SELECTED_ITEMS_SET': ({ updateState, action, updateProperties, properties }) => {
			const { payload: { value } } = action; console.log(value);
			updateState({ selectedValue: value });
			if (properties.select != 'multi') updateProperties({ opened: false });
		},
		'NOW_DROPDOWN_PANEL#SELECTED_ITEMS_SET': (coeffects) => {
			console.log(coeffects.action.payload.value);
			coeffects.updateProperties({ selectedItems: coeffects.action.payload.value });
		}
	},
	dispatches: {
		'NOW_DROPDOWN#OPENED_SET': {},
		'NOW_DROPDOWN#SELECTED_ITEMS_SET': {},
		'NOW_DROPDOWN#ITEM_CLICKED': {}
	},
	slots: {
		'trigger-content': {}
	},
	behaviors: [
		{
			behavior: focusBehavior
		},
		{
			behavior: keyBindingBehavior,
			options: {
				keyBindings: {
					open: ['ArrowDown', ' ', 'Enter'],
					dismiss: ['Escape']
				},
				handlers: {
					open: (host, event, dispatch) => {
						const focused = getFocusedEl(host);
						const trigger = getTriggerEl(host);
						if (!host.disabled && focused === trigger) {
							event.preventDefault();
							dispatch(() => {
								return {
									type: 'NOW_DROPDOWN#OPENED_SET',
									payload: { value: true }
								};
							});
						}
					},
					dismiss: (host) => {
						const focused = getFocusedEl(host);
						const trigger = getTriggerEl(host);
						if (focused !== trigger) {
							trigger.focus();
						}
					}
				}
			}
		}
	]
});
