function createIdSelector(prefix) {
	return function(host) {
		const componentId = host.getAttribute('component-id');
		return host.shadowRoot.getElementById(`${prefix}-${componentId}`);
	};
}

export const getListboxEl = (host) =>
	host.shadowRoot.querySelector('.now-dropdown-list');

export const getFocusedEl = (host) => host.shadowRoot.activeElement;

export const getTriggerEl = createIdSelector('trigger');

export const getItemEls = (host) => {
	return [...host.shadowRoot.querySelectorAll('.now-dropdown-list-item')];
};

export const getSelectedItemEls = (host) => {
	return [
		...host.shadowRoot.querySelectorAll(
			'.now-dropdown-list-item[aria-selected="true"]'
		)
	];
};

export const getFocusedItemEl = (host) => {
	return host.shadowRoot.activeElement;
};

export const getFocusedItemIndex = (host) => {
	return getItemEls(host).findIndex(
		(element) => element.id === getFocusedItemEl(host).id
	);
};

export const getShadowRootHost = (el) => {
	if (el.parentElement) {
		return getShadowRootHost(el.parentElement);
	}
	if (el.parentNode && el.parentNode instanceof DocumentFragment) {
		return el.parentNode.host;
	}
	return null;
};

export const isPanelList = (el) =>
	el.getAttribute('role') === 'listbox' || el.getAttribute('role') === 'menu';
