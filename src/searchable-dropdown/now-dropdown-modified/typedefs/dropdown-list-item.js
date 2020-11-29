/**
 * @typedef {Object} DropdownListItem
 * @description A menu item or option to display in the dropdown list.
 * @property {(string|number)} id - Unique identifier for the item.
 * @property {string} label - Text that describes the item.
 * @property {string} sublabel - Additional text for the item.
 * @property {number} count - Numeric indicator displayed next to the item.
 * @property {string} icon - Name of the icon to display next to the item. See the `now-icon` API and icon gallery for the list of valid names. Cannot be used with `presence` or `avatarProps`.
 * @property {boolean} disabled - If set, the dropdown item will be visible, but not selectable by the user.
 * @property {('available'|'away'|'busy'|'offline')} presence - Online status of a user, for displaying in a dropdown of users or statuses. Cannot be used with `icon` or `avatarProps`.
 * @property {{userName: string, imageSrc: string, presence: ('available', 'away', 'busy', 'offline')}} avatarProps - Properties used to render an avatar next to an item. See the `now-avatar` API for more information. Cannot be used with `icon` or `presence`.
 */
