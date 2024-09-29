const BigQuery = require('BigQuery');
const Firestore = require('Firestore');
const getEventData = require('getEventData');
const getType = require('getType');
const getTimestampMillis = require('getTimestampMillis');
const getRequestQueryString = require('getRequestQueryString');
const createRegex = require('createRegex');
const testRegex = require('testRegex');
const logToConsole = require('logToConsole');
const getAllEventData = require('getAllEventData');

/* 
This function checks the Items array for GA4 ecommerce events against a schema for items. 
By default it is assumed the title of the "schema" is "product"
*/
function validateAdditionalItemSchema(errors, productSchema) {

    if (productSchema.length > 0) {
        const schema = productSchema[0].data;
        const items_payload = getEventData("items");
        // Is an array so we need to loop through each individual product to check
        items_payload.forEach(function (product) {

            errors = data_contract_checks.validate(schema, product, errors, null, 1);
        });
    }

    return errors;
}

/* 
If BigQuery logging is enabled,this function inserts a new row in a destination table
whenever an event passes a validation check against a schema
*/
function log_failed_checks_to_BQ(errors) {

    const timestamp = getTimestampMillis();
    let rows = [];

    errors.forEach(err => {
        rows.push({
            event_id: getEventData('event_id'),
            event_name: getEventData('event_name'),
            parameter_name: err.parameter_name,
            failed_check: err.failed_check,
            message: err.message,
            event_timestamp: timestamp,
            full_request: getRequestQueryString(),
            hostname: getEventData('host_name'),
            user_agent: getEventData('user_agent'),
        });
    });

    // Call BigQuery API and insert a new row for each error into table
    BigQuery.insert({
        projectId: data.bq_project_id,
        datasetId: data.bq_dataset_id,
        tableId: data.bq_table_id,
    }, rows, {}, () => {

    }, (errors) => {

    });
}


const data_contract_checks = {
    /* 
        Function to validate the GA4 event payload against a schema
        Parameters:
          - schema: schema stored in Firestore for the GA4 event
          - paylod: Payload of GA4 event data
          - productSchema: schema for each product in a GA4 items array
          - isItems: Boolean to check if current validation is checking against an event or items in a GA4 items array
    */
    validate: function (schema, payload, errors, productSchema, isItems) {
        let field_name_for_error = ''; // name of parameter we will use for logging into BigQuery

        // Check for required fields in payload
        if (schema.required) {
            schema.required.forEach(field => {
                if (payload[field] === undefined || payload[field] === null) {
                    field_name_for_error = isItems === 1 ? ("items." + field) : field;
                    errors.push({
                        message: field_name_for_error + ' is required but missing',
                        parameter_name: field_name_for_error,
                        failed_check: 'required'
                    });
                }
            });
        }

        // Loop over each key in the schema properties
        for (let key in schema.properties) {
            if (schema.properties.hasOwnProperty(key)) {
                let rules = schema.properties[key];
                let value = payload[key];
                field_name_for_error = isItems === 1 ? ("items." + key) : key;
                // If the value is provided, perform further checks
                if (value !== undefined && value !== null) {
                    // Check: Value is the correct type (string, number etc)
                    if (typeof (rules.type) !== 'undefined' && getType(value) !== rules.type) {
                        errors.push({
                            message: field_name_for_error + ' should be of type ' + rules.type,
                            parameter_name: field_name_for_error,
                            failed_check: 'type'
                        });
                    }

                    // Check: Number is at least a minimum value
                    if (typeof (rules.minimum) !== undefined && value < rules.minimum) {
                        errors.push({
                            message: field_name_for_error + ' should not be less than ' + rules.minimum,
                            parameter_name: field_name_for_error,
                            failed_check: 'minimum'
                        });
                    }

                    // Check: Number is less than a maximum value
                    if (typeof (rules.maximum) !== undefined && value > rules.maximum) {
                        errors.push({
                            message: field_name_for_error + ' should not be greater than ' + rules.maximum,
                            parameter_name: field_name_for_error,
                            failed_check: 'maximum'
                        });
                    }

                    // Check: Enum - is value one of a given list of values
                    if (typeof (rules.enum) !== 'undefined' && rules.enum.indexOf(value) === -1) {
                        errors.push({
                            message: field_name_for_error + ' should be one of ' + rules.enum.join(', '),
                            parameter_name: field_name_for_error,
                            failed_check: 'enum'
                        });
                    }

                    // Check: Regex pattern check - does value match a provided regex pattern?
                    if (typeof (rules.pattern) !== 'undefined') {
                        const regexCheck = createRegex(rules.pattern, 'i');
                        var testResult = testRegex(regexCheck, value);
                        if (!testResult) {
                            errors.push({
                                message: field_name_for_error + ' should match the regex pattern ' + rules.pattern,
                                parameter_name: field_name_for_error,
                                failed_check: 'regex_pattern'
                            });
                        }
                    }

                    // Check: Is value length at least a minimum character length?
                    if (typeof (rules.minLength) !== 'undefined' && typeof (value) == 'string') {
                        if (value.length < rules.minLength) {
                            errors.push({
                                message: field_name_for_error + ' should be at least ' + rules.minLength + ' characters',
                                parameter_name: field_name_for_error,
                                failed_check: 'minLength'
                            });
                        }
                    }
                    // Check: Is value length is less than a maximum character length?
                    if (typeof (rules.maxLength) !== 'undefined' && typeof (value) == 'string') {
                        if (value.length > rules.maxLength) {
                            errors.push({
                                message: field_name_for_error + ' should not be greater than ' + rules.maxLength + ' characters',
                                parameter_name: field_name_for_error,
                                failed_check: 'maxLength'
                            });
                        }
                    }

                    // Checking GA4 items array in event schema rules. 
                    // If it exists, by default we will check for a "product" document in Firestore which will contain the rules for elements in this array separately
                    if (key === 'items') {
                        // Call function to fetch and validate against the additional schema for items
                        errors = validateAdditionalItemSchema(errors, productSchema);
                    }
                }
            }
        }


        return errors;
    }
};

// Main code
const event_to_check = getEventData('event_name');

// Searches for schema for the event and a default "product" schema (if it exists) for a GA4 product inside a GA4 items array
const queries = [['title', 'in', [event_to_check, 'product']]];

return Firestore.query(data.firestore_collection_name, queries, {
    projectId: data.gcp_project_id,
    limit: 2,
}).then((documents) => {

    // Assume by default no contract rules exist for event
    let validation_result = 1;

    if (documents.length > 0) {
        // Schema for the GA4 event
        let eventSchema = documents.filter(schema => schema.data.title !== 'product');

        if (eventSchema.length > 0) {
            const schema = eventSchema[0].data;
            const payload = getAllEventData();

            // Schema for a single product inside a GA4 ecommerce items array
            let productSchema = documents.filter(schema => schema.data.title === 'product');

             // Any failed validation checks will be stored in this "errors" array
            let errors = [];
            errors = data_contract_checks.validate(schema, payload, errors, productSchema);

            if (errors.length > 0) {
                errors.forEach(error => {
                    logToConsole('ERROR', error);
                });

                // Failed validation check to be returned as transformation variable
                validation_result = 0;

                // Log the errors to a destination BigQuery table
                if (data.log_errors_to_bq) {
                    log_failed_checks_to_BQ(errors);
                }

            } else {
                // If no errors, log success
                logToConsole('INFO', 'Payload is valid');
            }
        }
    }
    // Return 1 if event matches and validates successfully against an provided schema. Return 0 if failed.
    return validation_result;
});