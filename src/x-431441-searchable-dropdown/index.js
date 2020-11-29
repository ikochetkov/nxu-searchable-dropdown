import { createCustomElement } from '@servicenow/ui-core';
import snabbdom from '@servicenow/ui-renderer-snabbdom';
import styles from './styles.scss';
import "./now-dropdown";

const updateList = (updateState, searchText, initialItemList) => {
	const filteredChoiceList = initialItemList.filter(item => item.label.toLowerCase().includes(searchText));
	const choicesToShow = searchText ? filteredChoiceList : initialItemList;
	updateState({ Choices: choicesToShow, searchText: searchText });
}


const view = (state, { updateState }) => {
	return (
		<div>
			<now-dropdown
				items={state.Choices}
				searchText={state.searchText}
				manageSelected="true"
				selectedItems={state.selectedValue}
				select="single"
				placeholder="--None(empty)--"
				variant="secondary"
				size="md"
				multiple={true}
				tooltipContent=""
				panelFitProps={{}}
				configAria={{}} />
		</div>
	);
};

createCustomElement('searchable-dropdown', {
	renderer: { type: snabbdom },
	view,
	styles,
	initialState: {
		Choices: [
				{ "id": "al", "label": "Alabama" },
				{ "id": "ak", "label": "Alaska" },
				{ "id": "az", "label": "Arizona" },
				{ "id": "ar", "label": "Arkansas" },
				{ "id": "ca", "label": "California" },
				{ "id": "co", "label": "Colorado" }
			],
		searchText: null,
		selectedValue: [""]
	},
	properties: {
		initialItemList: {
			default: [
				{ "id": "al", "label": "Alabama" },
				{ "id": "ak", "label": "Alaska" },
				{ "id": "az", "label": "Arizona" },
				{ "id": "ar", "label": "Arkansas" },
				{ "id": "ca", "label": "California" },
				{ "id": "co", "label": "Colorado" }
			]
		}
	},
	actionHandlers: {
		"SEARCHABLE_DROPDOWN#FILTERED": ({ action, updateState, properties: { initialItemList } }) => {
			const { payload: searchText } = action;
			console.log("SEARCHABLE_DROPDOWN#FILTERED", searchText);
			updateList(updateState, searchText, initialItemList);

		},
		"NOW_DROPDOWN_PANEL#OPENED_SET": ({ updateState, roperties: { initialItemList } }) => {
			updateList(updateState, null, initialItemList);
		},
		'NOW_DROPDOWN_PANEL#SELECTED_ITEMS_SET': ({ updateState, action: { payload: { value } } }) => {
			updateState({ selectedValue: value });
		}
	}
});
