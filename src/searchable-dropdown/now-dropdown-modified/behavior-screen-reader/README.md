🚨 This behavior is fragile and not intendended to be used outside of the
design-system repo. Its API and functionality may change drastically depending
on our use-cases. Treat this more as a proof-of-concept rather than a stable,
supported package. 🚨

# behavior-screen-reader

This behavior allows a component to define screen-reader content that can be
injected into different components' shadowRoots. Many aria attributes, such
as `aria-describedby`, require referencing DOM nodes via ID. These IDs must
exist within the same shadowRoot boundary as the aria attribute. This can
make it challenging to compose smaller components in a way that is supported
by a screen-reader, because often 2 different components are encapsulating
different DOM nodes that need to reference each other.

Further reading: https://github.com/whatwg/html/issues/3219

### Usage

#### Defining screen-reader content

After installation import the behavior at the top of your component JS file
and register it in your component behaviors list.

There is 1 required option, `screenReaderView`, which is a view function that
should return screen-reader content. The view function is called with the same
parameters that the normal Seismic view function is provided:

```js
(state, { dispatch, updateProperties, updateState })
```

The `screenReaderView` function should return an accessible DOM tree,
including nodes with IDs that other components can reference. These IDs are
part of the public API and **must never change**. Doing so will make your
component backwards-incompatible.

```jsx
import screenReaderBehavior from './behavior-screen-reader';

createCustomElement('my-component', {
  // ...
  behaviors: [
 	{
 		behavior: screenReaderBehavior,
 		options: {
 			screenReaderView: (state, { dispatch, updateProperties, updateState }) => (
 				<ul role="listbox" id="listbox">
 					<li role="option" id="option-1">Option 1</li>
 					<li role="option" id="option-2">Option 2</li>
 				</ul>
 			)
 		}
 	}
 ]
});
```

#### Consuming screen-reader content

Once you have a component that defines screen-reader content, a consuming
parent component can add the following properties to decide where to render
that content:

 - `screen-reader-id` (string, required): This is a unique ID to identify
 the screen-reader content. All IDs defined by the producing component will
 be prefixed with this string, which helps to ensure there are no ID
 collisions when the content is rendered in a different shadowRoot. The
 value of this property should include a componentId (or similar uuid) to
 ensure uniqueness of this value.

 - `screen-reader-inject-into` (string, optional): A selector string that
 instructs the behavior where to render the screen-reader content. If not
 provided, the screen-reader content will be appended to the consuming
 component's shadowRoot, and styled in a way that has no visual impact on
 the component. If the selector returns a child node that is another Seismic
 component, the screen-reader content will be appended to that child's
 shadowRoot. If the selector returns any other DOM node, the screen-reader
 content will be rendered into that node, replacing all existing children of
 that node. In this case, it is the consumer's responsibility to ensure that
 this node is styled in a way that visually hides the content.

Now that the consuming component has defined the ID prefix and location of the
screen-reader content, aria attributes can be provided to the necessary nodes
in order to link it all together.

Any time the producing component is rendered, the screen-reader content will
be updated to match. This ensures that both the visual content and screen-reader
content are kept in sync.

Check out the [examples](./example) for a complete usage sample.
