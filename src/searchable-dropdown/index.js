import { createCustomElement } from '@servicenow/ui-core';
import snabbdom from '@servicenow/ui-renderer-snabbdom';
import styles from './styles.scss';
import "./now-dropdown-modified";
import { actionTypes } from '@servicenow/ui-core';
const { COMPONENT_BOOTSTRAPPED } = actionTypes;


const view = (state, { updateState }) => {
	const { properties } = state;

	return (
		<div>
			<now-dropdown
				items={state.Choices}
				searchText={state.searchText}
				searchIcon={properties.searchIcon}
				manageSelected="true"
				selectedItems={state.selectedValue}
				select={properties.select}
				placeholder={properties.placeholder}
				variant={properties.variant}
				size="md"
				alwaysFocusSearchOnOpen={properties.alwaysFocusSearchOnOpen}
				focusOnHover={properties.focusOnHover}
				tooltipContent="" />
		</div>
	);
};

createCustomElement('searchable-dropdown', {
	renderer: { type: snabbdom },
	view,
	styles,
	initialState: {
		Choices: [],
		searchText: null,
		selectedValue: []
	},
	properties: {
		initialItemList: {
			default: []
		},
		alwaysFocusSearchOnOpen: { default: true },
		select: { default: 'single' },
		placeholder: { default: '(empty)' },
		searchIcon: { default: "magnifying-glass-fill" },
		focusOnHover: { default: false },
		variant: { default: 'secondary' }
	},
	actionHandlers: {
		[COMPONENT_BOOTSTRAPPED]: ({ properties, updateState }) => {
			updateState({ Choices: properties.initialItemList })
		},
		"SEARCHABLE_DROPDOWN#FILTERED": ({ updateState, properties, action: { payload: searchText } }) => {
			const { initialItemList } = properties;
			const choicesToShow = searchText
				? initialItemList.filter(item => item.label.toLowerCase().includes(searchText.toLowerCase()))
				: initialItemList;
			updateState({ Choices: choicesToShow, searchText: searchText });

		},
		"NOW_DROPDOWN_PANEL#OPENED_SET": ({ dispatch }) => {
			dispatch("SEARCHABLE_DROPDOWN#FILTERED", "");
		},
		'NOW_DROPDOWN_PANEL#SELECTED_ITEMS_SET': ({ updateState, action }) => {
			const { payload: { value } } = action;
			updateState({ selectedValue: value });
		}
	}
});
