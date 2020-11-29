const avatarSchema = {
	type: 'object',
	properties: {
		userName: {type: 'string'},
		imageSrc: {type: 'string'},
		presence: {type: 'string', enum: ['available', 'away', 'busy', 'offline']}
	}
};

const itemSchema = {
	type: 'object',
	properties: {
		id: {type: ['string', 'number']},
		label: {type: 'string'},
		sublabel: {type: 'string'},
		count: {type: 'number'},
		icon: {type: 'string'},
		presence: {type: 'string', enum: ['available', 'away', 'busy', 'offline']},
		disabled: {type: 'boolean'},
		avatarProps: avatarSchema
	},
	dependencies: {
		avatarProps: {
			properties: {
				icon: false,
				presence: false
			}
		},
		icon: {
			properties: {
				avatarProps: false,
				presence: false
			}
		},
		presence: {
			properties: {
				icon: false,
				avatarProps: false
			}
		}
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

// similar to popover constrain, but can't use `target` for any of the height
// related properties
export const constrainSchema = {
	type: 'object',
	properties: {
		width: {oneOf: [{const: 'target'}, {type: 'number'}]},
		minWidth: {oneOf: [{const: 'target'}, {type: 'number'}]},
		maxWidth: {oneOf: [{const: 'target'}, {type: 'number'}]},
		height: {type: 'number'},
		minHeight: {type: 'number'},
		maxHeight: {type: 'number'}
	},
	additionalProperties: false
};
