/* TODO: Deprecate these in favor of the typedefs in dropdown-list-item once
 * dropdown has been updated to use dropdown-list */

/**
 * @typedef {Object} DropdownItem
 * @description A menu item or option to display in the dropdown panel.
 * @property {(string|number)} id - Unique identifier for the item.
 * @property {string} label - Text that describes the item.
 * @property {number} count - Numeric indicator displayed next to the item.
 * @property {string} icon - Name of the icon to display next to the item. See the `now-icon` API and icon gallery for the list of valid names.
 * @property {('available'|'away'|'busy'|'offline')} presence - Online status of a user, for displaying in a dropdown of users or statuses.
 * @property {boolean} disabled - If set, the dropdown item will be visible, but not selectable by the user.
 */
