/* TODO: Deprecate these in favor of the schemas in dropdown-list-schemas once
 * dropdown has been updated to use dropdown-list */

const itemSchema = {
	type: 'object',
	properties: {
		id: {type: ['string', 'number']},
		label: {type: 'string'},
		count: {type: 'number'},
		icon: {type: 'string'},
		presence: {type: 'string', enum: ['available', 'away', 'busy', 'offline']},
		disabled: {type: 'boolean'}
	},
	required: ['id', 'label']
};

const sectionSchema = {
	type: 'object',
	properties: {
		id: {type: ['string', 'number']},
		label: {type: 'string'},
		children: {type: 'array', items: itemSchema}
	},
	required: ['children']
};

export const itemsSchema = {
	type: 'array',
	items: {
		anyOf: [itemSchema, sectionSchema]
	}
};
