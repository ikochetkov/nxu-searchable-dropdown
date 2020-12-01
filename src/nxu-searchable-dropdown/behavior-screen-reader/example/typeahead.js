// import {render} from '@servicenow/library-enhanced-test';
// import {createCustomElement} from '@servicenow/ui-core';
// import {Fragment} from '@servicenow/ui-renderer-snabbdom';
// import screenReaderBehavior from '../src';
// import clamp from 'lodash/clamp';
// import inputStyles from './_input.scss';
// import panelStyles from './_panel.scss';

// createCustomElement('sample-combobox', {
// 	eventHandlers: [
// 		{
// 			events: ['keydown'],
// 			effect({action, updateState}) {
// 				const {event} = action.payload;

// 				if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
// 					event.preventDefault();

// 					const delta = event.key === 'ArrowDown' ? 1 : -1;
// 					updateState(({state}) => ({
// 						operation: 'set',
// 						path: 'focused',
// 						value: clamp(state.focused + delta, 0, state.foods.length)
// 					}));
// 				}

// 				if (event.key === ' ') {
// 					event.preventDefault();

// 					updateState(({state}) => ({
// 						operation: 'set',
// 						path: `checked.${state.focused}`,
// 						value: !state.checked[state.focused]
// 					}));
// 				}
// 			}
// 		}
// 	],
// 	initialState: {
// 		focused: 0,
// 		foods: ['Apple', 'Banana', 'Cheeto', 'Donut'],
// 		checked: {}
// 	},
// 	view: (state) => {
// 		const panelId = `panel-${state.componentId}`;

// 		return (
// 			<div>
// 				<sample-input
// 					role="combobox"
// 					configAria={{
// 						'aria-expanded': 'true',
// 						'aria-haspopup': 'listbox',
// 						'aria-owns': `${panelId}-listbox`,
// 						'aria-controls': `${panelId}-listbox`
// 					}}
// 					focused={`${panelId}-option-${state.focused}`}
// 				/>
// 				<sample-panel
// 					// required
// 					screen-reader-id={panelId}
// 					// optional, if `inject-into` is not provided, it adds content as the
// 					// last child of the parent. In this case, the content will be appended
// 					// to the `<sample-input>`s shadowRoot
// 					screen-reader-inject-into="sample-input"
// 					items={state.foods}
// 					selected-items={state.checked}
// 					focused={state.focused}
// 				/>
// 			</div>
// 		);
// 	}
// });

// const panelView = (state) => (
// 	<ul
// 		{...state.properties.configAria}
// 		role="listbox"
// 		screen-reader-behavior-id="listbox"
// 		className="listbox">
// 		{state.properties.items.map((item, index) => (
// 			<li
// 				class={{
// 					focused: index === state.properties.focused,
// 					checked: state.properties.selectedItems[index]
// 				}}
// 				screen-reader-behavior-id={`option-${index}`}
// 				aria-selected={state.properties.selectedItems[index] ? 'true' : 'false'}
// 				role="option">
// 				{item}
// 			</li>
// 		))}
// 	</ul>
// );

// createCustomElement('sample-panel', {
// 	styles: panelStyles,
// 	view: panelView,
// 	behaviors: [
// 		{
// 			behavior: screenReaderBehavior,
// 			options: {
// 				screenReaderView: panelView
// 			}
// 		}
// 	],
// 	properties: {
// 		focused: {},
// 		targetRef: {},
// 		items: {},
// 		selectedItems: {},
// 		configAria: {}
// 	}
// });

// const inputView = (state) => (
// 	<label id="label">
// 		Choose a Fruit or Vegetable
// 		<br />
// 		<input
// 			{...state.properties.configAria}
// 			type="text"
// 			aria-autocomplete="list"
// 			aria-activedescendant={state.properties.focused}
// 			id="input"
// 		/>
// 	</label>
// );

// createCustomElement('sample-input', {
// 	styles: inputStyles,
// 	view: inputView,
// 	properties: {
// 		focused: {},
// 		configAria: {}
// 	}
// });

// render(
// 	<Fragment>
// 		<h2>Typeahead</h2>
// 		<sample-combobox />
// 	</Fragment>
// );
