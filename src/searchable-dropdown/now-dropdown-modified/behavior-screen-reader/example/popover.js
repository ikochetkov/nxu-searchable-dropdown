// import {render} from '@servicenow/library-enhanced-test';
// import {createCustomElement} from '@servicenow/ui-core';
// import {Fragment} from '@servicenow/ui-renderer-snabbdom';
// import screenReaderBehavior from '../src';
// import '@servicenow/now-popover';
// import '@servicenow/now-button';

// createCustomElement('sample-popover', {
// 	initialState: {
// 		opened: false
// 	},
// 	view: (state) => {
// 		return (
// 			<now-popover interaction-type="none">
// 				<now-button
// 					config-aria={{
// 						'aria-haspopup': 'true',
// 						'aria-expanded': state.opened ? 'true' : 'false',
// 						'aria-labelledby': state.opened
// 							? 'popover-content-description'
// 							: undefined
// 					}}
// 					label="Push me"
// 					slot="trigger"
// 				/>
// 				<sample-content
// 					screen-reader-inject-into="now-button"
// 					screen-reader-id="popover-content"
// 					slot="content"
// 				/>
// 			</now-popover>
// 		);
// 	},
// 	actionHandlers: {
// 		'NOW_POPOVER#OPENED_SET': ({action, updateState}) => {
// 			updateState({opened: action.payload.value});
// 		}
// 	}
// });

// const contentView = () => (
// 	<span role="dialog" screen-reader-behavior-id="description">
// 		I'm just a string
// 	</span>
// );

// createCustomElement('sample-content', {
// 	view: contentView,
// 	behaviors: [
// 		{
// 			behavior: screenReaderBehavior,
// 			options: {
// 				screenReaderView: contentView
// 			}
// 		}
// 	]
// });

// render(
// 	<Fragment>
// 		<h2>Popover</h2>
// 		<sample-popover />
// 	</Fragment>
// );
