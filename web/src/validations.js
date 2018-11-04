const Ajv = require('ajv');
const ajv = new Ajv({ allErrors: true, coerceTypes: true, useDefaults: true});

const validate_active_scrims = ajv.compile({
    type: 'object',
    required: ['limit', 'start'],
    properties: { 
        limit: { 
            type: 'number',
            minimum: 0
        },
        start: {
            type: 'number',
            minimum: 0
        },
        regions: { 
            type: 'string',
        },
        upper_mmr: {
            type: 'number',
            minimum: 0,
            maximum: 10000,
            default: 10000,
        },
        lower_mmr: {
            type: 'number',
            minimum: 0,
            maximum: 10000,
            default: 0,
        }
    }
});

const validate_list_scrim = ajv.compile({
    type: 'object',
    required: ['team_name', 'contact', 'region', 'average_mmr'],
    properties: { 
        team_name: { 
            type: 'string',
            minLength: 2,
            maxLength: 100,
        },
        contact: {
            type: 'string',
            minLength: 2,
            maxLength: 40,
        },
        region: { 
            type: 'array',
            contains: {
                type: 'object',
                required: ['name'],
                properties: {
                    name: {
                        type: 'string',
                    },
                    abbr: {
                        type: 'string',
                    },
                },
            },
        },
        average_mmr: {
            type: 'number',
            minimum: 0,
            maximum: 10000,
            default: 10000,
        }
    }
});

const validate_renew_scrim_key = ajv.compile({
    type: 'object',
    required: ['token'],
    properties: { 
        token: { 
            type: 'string',
            minLength: 128,
            maxLength: 128,
        }
    }
});

module.exports = {
    validate_active_scrims,
    validate_list_scrim,
    validate_renew_scrim_key,
};
