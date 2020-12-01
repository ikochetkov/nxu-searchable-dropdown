const BEHAVIOR_NAME = 'screenReader';
import {actionTypes} from '@servicenow/ui-core';
import snabbdom from '@servicenow/ui-renderer-snabbdom';
import unset from 'lodash/unset';
import get from 'lodash/get';
import set from 'lodash/set';

const {
	COMPONENT_RENDERED,
	COMPONENT_BOOTSTRAPPED,
	COMPONENT_PROPERTY_CHANGED,
	COMPONENT_DISCONNECTED
} = actionTypes;

/**
 * Modifies a view function so that the resulting VDOM is patched in a way that
 * is less likely to break when rendered in a different shadowRoot
 *
 * - removes all IDs unless the node explicitly sets `screenReaderBehaviorId` attribute
 * - strips out all classes (since the containing node should be visually
 *   hidden)
 * - injects a `isScreenReaderBehaviorRender` property that the view can use
 *   to conditionally render things for the screen reader
 *
 * @param view {Function} a Seismic render function to decorate
 * @param id {string} a unique ID for the component instance that is used
 * as a prefix for any existing IDs in the original vdom tree
 *
 * @returns {Function} a new view function that can be passed to snabbdom.onStateChange
 */
const updateViewForScreenReader = (view, id) => (state, helpers) => {
	function mutateNode(node) {
		if (!node) {
			return;
		}

		unset(node, 'data.class');
		unset(node, 'data.props.className');

		// `id` is a prop and an attribute? :shrug:
		unset(node, 'data.props.id', id);
		unset(node, 'data.attrs.id', id);

		const idSuffix =
			get(node, 'data.props.screenReaderBehaviorId') ||
			get(node, 'data.props.screen-reader-behavior-id');
		if (idSuffix) {
			const newId = `${id}-${idSuffix}`;
			set(node, 'data.attrs.id', newId);
			set(node, 'data.props.id', newId);
			unset(node, 'data.props.screenReaderBehaviorId');
			unset(node, 'data.props.screen-reader-behavior-id');
		}

		if (Array.isArray(node.children)) {
			node.children.forEach((child, index) => {
				node.children[index] = mutateNode(child);
			});
		}

		return node;
	}

	const vdom = view(
		{
			...state,
			properties: {
				...state.properties,
				isScreenReaderBehaviorRender: true
			}
		},
		helpers
	);
	return mutateNode(vdom);
};

/**
 * Finds or creates a dynamically created target node.
 *
 * @param rootNode {Node} the node that will contain the target.
 * @param id {string} unique ID for the target node.
 *
 * @returns {HTMLElement} If we've already created a DOM node for the given
 * rootNode, this method will find and return that. If a created DOM node
 * cannot be found, one will be created, appended to the rootNode, and
 * returned.
 */
function getDynamicallyCreatedTarget(rootNode, id) {
	const containerId = `${BEHAVIOR_NAME}-behavior-${id}`;
	const existingNode = rootNode.querySelector(`#${containerId}`);

	if (existingNode) {
		return existingNode;
	}

	const newNode = document.createElement('div');
	newNode.id = containerId;

	// stolen from now-a11y-label mixin. Need explicit styles because
	// we might be in somebody else's shadowRoot
	newNode.style =
		'position: absolute; overflow: hidden; width: 1px; height: 1px; margin: 0; border: none; padding: 0; white-space: nowrap; clip: rect(0 0 0 0); clip-path: inset(50%);';

	rootNode.appendChild(newNode);

	return newNode;
}

function isCustomElement(node) {
	return node && node.shadowRoot && node.tagName.includes('-');
}

/**
 * Finds or creates a DOM node that we can put the screen reader content into.
 *
 * @param host {HTMLElement} The host node that is using the behavior.
 * @param id {string} unique ID for the instance of the component. When a
 * target node needs to be dynamically created, this ID is used for that
 * node.
 * @param selector {string?} If provided, used as a querySelector string
 * relative to the host's parent element to search for an existing target node.
 * If not provided, a target node is dynamically created and appended as a
 * sibling of the host. If the selector string resolves to a child Seismic
 * component, the target node will be dynamically created in that child's
 * shadowRoot.
 *
 * @returns {{node: HTMLElement?, created: boolean}} The DOM node to use to
 * append screen reader content, and whether or not that node was dynamically
 * created. `node` be null if a selector was provided that did not match
 * anything.
 */
function getRenderTarget(host, id, selector) {
	let parentRoot = host.getRootNode();

	if (parentRoot === document) {
		parentRoot = document.body;
	}

	// use a dynamically created DOM node that is appended to the parent's
	// shadowRoot
	if (!selector) {
		return {
			node: getDynamicallyCreatedTarget(parentRoot, id),
			created: true
		};
	}

	const target = parentRoot.querySelector(selector);

	// if we selected a child component, use a dynamically created DOM node that
	// is appended to that child's shadowRoot
	if (isCustomElement(target)) {
		return {
			node: getDynamicallyCreatedTarget(target.shadowRoot, id),
			created: true
		};
	}

	return {
		node: target,
		created: false
	};
}

/**
 * Removes screen reader content and any dynamically created container node.
 *
 * @param node {HTMLElement?} The node that contains screen reader content
 * @param created {boolean} Whether nor not this node was dynamically created by the behavior
 */
function unmount(node, created) {
	if (!node) {
		return;
	}

	// If this behavior created the node, then it's safe to remove the entire
	// node.
	if (created) {
		node.remove();
	} else {
		// Otherwise we just want to clear out its children. This still goes
		// through `onStateChange` so that function can do some additional cleanup.
		snabbdom.onStateChange(node, () => null);
	}
}

/**
 * This behavior allows a component to define screen-reader content that can be
 * injected into different components' shadowRoots. Many aria attributes, such
 * as `aria-describedby`, require referencing DOM nodes via ID. These IDs must
 * exist within the same shadowRoot boundary as the aria attribute. This can
 * make it challenging to compose smaller components in a way that is supported
 * by a screen-reader, because often 2 different components are encapsulating
 * different DOM nodes that need to reference each other.
 *
 * Further reading: https://github.com/whatwg/html/issues/3219
 *
 * Usage, defining screen-reader content:
 *
 * After installation import the behavior at the top of your component JS file
 * and register it in your component behaviors list.
 *
 * There is 1 required option, `screenReaderView`, which is a view function that
 * should return screen-reader content. The view function is called with the same
 * parameters that the normal Seismic view function is provided:
 *
 * `(state, { dispatch, updateProperties, updateState })`
 *
 * The `screenReaderView` function should return an accessible DOM tree,
 * including nodes with IDs that other components can reference. These IDs are
 * part of the public API and **must never change**. Doing so will make your
 * component backwards-incompatible.
 *
 * ```jsx
 * import screenReaderBehavior from '@servicenow/behavior-screen-reader';
 *
 * createCustomElement('my-component', {
 *   // ...
 *   behaviors: [
 *		{
 *			behavior: screenReaderBehavior,
 *			options: {
 *				screenReaderView: (state, { dispatch, updateProperties, updateState }) => (
 *					<ul role="listbox" id="listbox">
 *						<li role="option" id="option-1">Option 1</li>
 *						<li role="option" id="option-2">Option 2</li>
 *					</ul>
 *				)
 *			}
 *		}
 *	]
 * });
 * ```
 *
 * Usage, consuming screen-reader content:
 *
 * Once you have a component that defines screen-reader content, a consuming
 * parent component can add the following properties to decide where to render
 * that content:
 *
 *	- `screen-reader-id` (string, required): This is a unique ID to identify
 *	the screen-reader content. All IDs defined by the producing component will
 *	be prefixed with this string, which helps to ensure there are no ID
 *	collisions when the content is rendered in a different shadowRoot. The
 *	value of this property should include a componentId (or similar uuid) to
 *	ensure uniqueness of this value.
 *
 *	- `screen-reader-inject-into` (string, optional): A selector string that
 *	instructs the behavior where to render the screen-reader content. If not
 *	provided, the screen-reader content will be appended to the consuming
 *	component's shadowRoot, and styled in a way that has no visual impact on
 *	the component. If the selector returns a child node that is another Seismic
 *	component, the screen-reader content will be appended to that child's
 *	shadowRoot. If the selector returns any other DOM node, the screen-reader
 *	content will be rendered into that node, replacing all existing children of
 *	that node. In this case, it is the consumer's responsibility to ensure that
 *	this node is styled in a way that visually hides the content.
 *
 * Now that the consuming component has defined the ID prefix and location of the
 * screen-reader content, aria attributes can be provided to the necessary nodes
 * in order to link it all together.
 *
 * Any time the producing component is rendered, the screen-reader content will
 * be updated to match. This ensures that both the visual content and screen-reader
 * content are kept in sync.
 *
 * Check out the examples for a complete usage sample.
 *
 * @seismicBehavior screenReaderBehavior
 * @summary Provides a way to define screen-reader content that can be used in
 * different shadowRoots
 */
export default {
	name: BEHAVIOR_NAME,
	properties: {
		screenReaderInjectInto: {},
		screenReaderId: {}
	},
	actionHandlers: {
		[COMPONENT_BOOTSTRAPPED]: ({action, host}) => {
			if (action.payload.options.screenReaderView) {
				return;
			}

			// eslint-disable-next-line no-undef
			if (process.env.NODE_ENV === 'development') {
				// eslint-disable-next-line no-console
				console.warn(
					`[@servicenow/behavior-screen-reader <${host.tagName.toLowerCase()} component-id="${
						action.meta.id
					}">]: tried to use the ${BEHAVIOR_NAME} behavior but did not provide required \`screenReaderView\` function :(`
				);
			}
		},
		[COMPONENT_RENDERED]: ({
			action,
			host,
			state,
			properties,
			dispatch,
			updateState,
			updateProperties
		}) => {
			const {screenReaderInjectInto: selector, screenReaderId: id} = properties;
			const {screenReaderView} = action.payload.options;

			if (!screenReaderView || !id || !host.isConnected) {
				return;
			}

			const {node, created} = getRenderTarget(host, id, selector);

			if (!node) {
				/* eslint-disable-next-line no-console */
				console.error(
					`[@servicenow/behavior-screen-reader <${host.tagName.toLowerCase()} component-id="${
						action.meta.id
					}">]: Could not locate target DOM node "${selector}" to append screen-reader content. Verify that this node exists in the shadowRoot.`
				);
				return;
			}

			// This is kinda ugly. Ideally we'd like to not keep DOM references in
			// state and instead query for them when we need them. However, this
			// doesn't work all the time because this behavior tries to query for
			// nodes relative to the host's parent element. When this element
			// disconnects, it can no longer traverse up to its parent to do any
			// cleanup. So, back to shoving DOM nodes in state :sob:
			updateState(({state}) => {
				const prevState = state.behaviors[BEHAVIOR_NAME];
				if (prevState.node !== node) {
					unmount(prevState.node, prevState.created);
				}

				return {
					operation: 'assign',
					path: `behaviors.${BEHAVIOR_NAME}`,
					value: {
						node,
						created
					},
					shouldRender: false
				};
			});

			snabbdom.onStateChange(
				node,
				updateViewForScreenReader(screenReaderView, id),
				state,
				{
					dispatch,
					updateState,
					updateProperties
				}
			);
		},
		[COMPONENT_PROPERTY_CHANGED]: ({action, state}) => {
			const {name, value} = action.payload;

			// allow consumer to tear down screen reader view without disconnecting
			// the component by setting screen-reader-id to falsey
			if (name === 'screenReaderId' && !value) {
				const {node, created} = state.behaviors[BEHAVIOR_NAME];
				unmount(node, created);
			}
		},
		[COMPONENT_DISCONNECTED]: ({state, updateState}) => {
			const {node, created} = state.behaviors[BEHAVIOR_NAME];
			unmount(node, created);

			// avoid keeping around stale DOM node references when this behavior is
			// disconnected. We can find them again on next render
			//
			// TODO in Seismic 18.2.0: This will no longer be necessary. Seismic will
			// store disconnected state on the element rather than in the central
			// store, which means this gets cleaned up for free
			updateState({
				operation: 'set',
				path: `behaviors.${BEHAVIOR_NAME}`,
				value: {},
				shouldRender: false
			});
		}
	}
};
