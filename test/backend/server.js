const express = require('express');
const app = express();
const dotenv = require('dotenv');
dotenv.config();
const cors = require('cors');
const bodyParser = require('body-parser');
const { MongoClient, ObjectId } = require('mongodb');
const crypto = require('crypto');

// Initialize the secret key from the environment variable
const algorithm = 'aes-256cbc';
const secretKey = process.env.SECRET_KEY; // Get this from .env file
if (!secretKey) {
    console.error('Secret key not found');
    process.exit(1); // Exit the app if the key is not found
}
console.log(`Secret Key: ${secretKey}`);

// Encrypt function
const encrypt = (text) => {
    const iv = crypto.randomBytes(16); // Generate a random IV for each encryption
    const cipher = crypto.createCipheriv(algorithm, Buffer.from(secretKey, 'hex'), iv);
    cipher.setAutoPadding(true);  // Explicitly set padding
    let encrypted = cipher.update(text, 'utf-8', 'hex');
    encrypted += cipher.final('hex');

    console.log(`Encryption - IV: ${iv.toString('hex')}, Encrypted Data: ${encrypted}`);

    return { iv: iv.toString('hex'), encryptedData: encrypted };
};

const decrypt = (encryptedData, iv) => {
    if (!encryptedData || !iv) {
        throw new Error('Invalid input to decrypt function');
    }

    try {
        const keyBuffer = Buffer.from(secretKey, 'hex');
        const ivBuffer = Buffer.from(iv, 'hex');

        console.log(`Decrypting with IV: ${iv}, Encrypted Data: ${encryptedData}, Secret Key: ${secretKey}`);

        const decipher = crypto.createDecipheriv(algorithm, keyBuffer, ivBuffer);
        decipher.setAutoPadding(true);  // Explicitly set padding
        let decrypted = decipher.update(encryptedData, 'hex', 'utf-8');
        decrypted += decipher.final('utf-8');
        return decrypted;
    } catch (error) {
        console.error('Decryption error:', error.message);
        throw new Error('Decryption failed');
    }
};


const port = 3000;
app.use(cors());
app.use(bodyParser.json());

const url = 'mongodb://localhost:27017';
const client = new MongoClient(url);
const dbName = 'password_manager';

client.connect().then(() => {
    console.log('Connected to MongoDB');
}).catch(err => {
    console.error('Failed to connect to MongoDB', err);
});

// GET endpoint to retrieve all passwords
app.get('/', async (req, res) => {
    try {
        const db = client.db(dbName);
        const collection = db.collection('passwords');
        const findResult = await collection.find({}).toArray();

        console.log('Found documents:', findResult); // Log found documents

        const decryptedResults = findResult.map(item => {
            console.log('Item before decryption:', item);
            
            // Check if password is in the expected format
            if (typeof item.password === 'string') {
                console.error('Password is a hashed string:', item.password);
                return { ...item, password: 'Decryption failed: password is hashed' }; // Handle hashed password
            }

            if (!item.password || !item.password.encryptedData || !item.password.iv) {
                console.error('Missing password fields in item:', item);
                return { ...item, password: 'Decryption failed: missing fields' }; // Handle missing fields
            }

            // Decrypt if all fields are present
            try {
                const decryptedPassword = decrypt(item.password.encryptedData, item.password.iv);
                console.log(`Decrypted password for ${item.site}: ${decryptedPassword}`); // Print decrypted password

                return {
                    ...item,
                    password: decryptedPassword
                };
            } catch (error) {
                console.error('Decryption failed for item:', item);
                return { ...item, password: 'Decryption failed' };
            }
        });

        res.json(decryptedResults); // Send decrypted data
    } catch (error) {
        console.error('Error retrieving passwords:', error);
        res.status(500).send({ success: false, message: 'Error retrieving passwords' });
    }
});


// POST endpoint to add a new password
app.post('/', async (req, res) => {
    try {
        const { site, username, password, id } = req.body;
        const encryptedPassword = encrypt(password);

        const db = client.db(dbName);
        const collection = db.collection('passwords');
        const insertResult = await collection.insertOne({
            site,
            username,
            password: {
                iv: encryptedPassword.iv,
                encryptedData: encryptedPassword.encryptedData
            },
            id
        });
        res.status(201).send({ success: true, result: insertResult });
    } catch (error) {
        console.error('Error saving password:', error);
        res.status(500).send({ success: false, message: 'Error saving password' });
    }
});

// DELETE endpoint to delete a password
app.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params; // Get the id from the request parameters
        const db = client.db(dbName);
        const collection = db.collection('passwords');
        const deleteResult = await collection.deleteOne({ _id: new ObjectId(id) }); // Use ObjectId for MongoDB
        res.send({ success: true, result: deleteResult });
    } catch (error) {
        console.error('Error deleting password:', error);
        res.status(500).send({ success: false, message: 'Error deleting password' });
    }
});

// POST endpoint to save generated password
app.post('/generated-passwords', async (req, res) => {
    try {
        const { password, id } = req.body;
        const encryptedPassword = encrypt(password); // Encrypt the generated password

        const db = client.db(dbName);
        const collection = db.collection('generated_passwords'); // New collection
        const insertResult = await collection.insertOne({
            password: {
                iv: encryptedPassword.iv,
                encryptedData: encryptedPassword.encryptedData
            },
            id
        });
        res.status(201).send({ success: true, result: insertResult });
    } catch (error) {
        console.error('Error saving generated password:', error);
        res.status(500).send({ success: false, message: 'Error saving generated password' });
    }
});


app.listen(port, () => {
    console.log(`App listening on port ${port}`);
});
