'use strict';

const AWS = require('aws-sdk');
const uuid = require('uuid');
const jwt = require('jsonwebtoken');


const docClient = new AWS.DynamoDB.DocumentClient({
    endpoint: 'http://localhost:4566', // Localstack DynamoDB endpoint
    region: 'us-east-1'
});

const TABLE_NAME = "car-management-system-cars";

const JWT_SECRET = "secret"

// Middleware to validate JWT
const authenticateJWT = (event) => {
    const token = event.headers.Authorization || event.headers.authorization;
    if (!token) {
        throw new Error('No token provided');
    }
    try {
        return jwt.verify(token, JWT_SECRET);
    } catch (error) {
        throw new Error('Unauthorized');
    }
};


// Login
module.exports.login = async (event) => {
    const {username, password} = JSON.parse(event.body);
    if (username === 'admin' && password === 'admin') {
        return {
            statusCode: 200,
            body: JSON.stringify({
                token: jwt.sign({username}, JWT_SECRET)
            })
        };
    }
    // Auto-invoking function
    await module.exports.handleUserLogin(event);

    return {
        statusCode: 401,
        body: JSON.stringify({error: 'Unauthorized'})
    };
};


// Create Event
module.exports.createCar = async (event) => {
    const user = authenticateJWT(event)
    const {brand, model} = JSON.parse(event.body);
    const id = uuid.v4();
    const newCar = {id, brand, model, user: user.username};
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
    authenticateJWT(event)
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
    authenticateJWT(event)
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


module.exports.scheduledTask = async () => {
    console.log('Scheduled task running...');
};

module.exports.processCarChanges = async (event) => {
    for (const record of event.Records) {
        console.log('DynamoDB Record: %j', record.dynamodb);
    }
};

module.exports.handleUserLogin = async (event) => {
    const {username} = JSON.parse(event.body);
    console.log(`User ${username} logged in at ${new Date().toISOString()}`);
    return {
        statusCode: 200,
        body: JSON.stringify({message: `User ${username} login processed`})
    };
};

// Handle SNS Notification
module.exports.handleSnsNotification = async (event) => {
    for (const record of event.Records) {
        const snsMessage = record.Sns.Message;
        console.log('SNS Message:', snsMessage);
    }
    return {
        statusCode: 200,
        body: JSON.stringify({ message: 'SNS notification processed successfully' })
    };
};