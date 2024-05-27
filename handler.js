'use strict';

const AWS = require('aws-sdk');
const uuid = require('uuid');

const docClient = new AWS.DynamoDB.DocumentClient({
    endpoint: 'http://localhost:4566', // Localstack DynamoDB endpoint
    region: 'us-east-1'
});

const TABLE_NAME = "car-management-system-cars";

module.exports.createCar = async (event) => {
    const {brand, model} = JSON.parse(event.body);
    const id = uuid.v4();
    const newCar = {id, brand, model};
    await docClient.put({
        TableName: TABLE_NAME,
        Item: newCar
    }).promise();
    return {
        statusCode: 201,
        body: JSON.stringify(newCar)
    };
};
//
// Get All Events
module.exports.getCars = async () => {
    const data = await docClient.scan({TableName: TABLE_NAME}).promise();
    return {
        statusCode: 200,
        body: JSON.stringify(data.Items)
    };
};

// Get Event by ID
module.exports.getCarById = async (event) => {
    const {id} = event.pathParameters;
    const data = await docClient.get({
        TableName: TABLE_NAME,
        Key: {id}
    }).promise();
    if (!data.Item) {
        return {
            statusCode: 404,
            body: JSON.stringify({error: 'Car not found'})
        };
    }
    return {
        statusCode: 200,
        body: JSON.stringify(data.Item)
    };
};

// Update Event
module.exports.updateCar = async (event) => {
    const {id} = event.pathParameters;
    const {model, brand} = JSON.parse(event.body);
    await docClient.update({
        TableName: TABLE_NAME,
        Key: {id},
        UpdateExpression: 'set model = :model, brand = :brand',
        ExpressionAttributeValues: {
            ':brand': brand,
            ':model': model,
        }
    }).promise();
    return {
        statusCode: 200,
        body: JSON.stringify({id, model, brand})
    };
};

// Delete Event
module.exports.deleteCar = async (event) => {
    const {id} = event.pathParameters;
    await docClient.delete({
        TableName: TABLE_NAME,
        Key: {id}
    }).promise();
    return {
        statusCode: 200,
        body: JSON.stringify({message: 'Car deleted successfully'})
    };
};