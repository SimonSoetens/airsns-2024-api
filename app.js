
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const Database = require('./database');

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Gebruikersbeheer
app.get('/api/users/:id', (req, res) => {
    const { id } = req.params;
    const db = new Database();
    db.getQuery('SELECT * FROM Users WHERE user_id = ?', [id])
        .then(user => user ? res.send(user) : res.status(404).send({ error: 'User not found' }))
        .catch(error => res.status(500).send({ error: 'Failed to fetch user', details: error }));
});

app.put('/api/users/:id', (req, res) => {
    const { id } = req.params;
    const { username, email, password_hash } = req.body;
    const db = new Database();
    db.getQuery('UPDATE Users SET username = ?, email = ?, password_hash = ? WHERE user_id = ?', [username, email, password_hash, id])
        .then(() => res.send({ message: 'User updated successfully' }))
        .catch(error => res.status(500).send({ error: 'Failed to update user', details: error }));
});

// Campingplekkenbeheer
app.get('/api/campingspots/:id', (req, res) => {
    const { id } = req.params;
    const db = new Database();
    db.getQuery('SELECT * FROM CampingSpots WHERE spot_id = ?', [id])
        .then(spot => spot ? res.send(spot) : res.status(404).send({ error: 'Camping spot not found' }))
        .catch(error => res.status(500).send({ error: 'Failed to fetch camping spot', details: error }));
});

app.post('/api/campingspots', (req, res) => {
    const { name, owner_id, description, price } = req.body;
    const db = new Database();
    db.getQuery('INSERT INTO CampingSpots (name, owner_id, description, price) VALUES (?, ?, ?, ?)', [name, owner_id, description, price])
        .then(() => res.status(201).send({ message: 'Camping spot added successfully' }))
        .catch(error => res.status(500).send({ error: 'Failed to add camping spot', details: error }));
});

app.delete('/api/campingspots/:id', (req, res) => {
    const { id } = req.params;
    const db = new Database();
    db.getQuery('DELETE FROM CampingSpots WHERE spot_id = ?', [id])
        .then(() => res.send({ message: 'Camping spot deleted successfully' }))
        .catch(error => res.status(500).send({ error: 'Failed to delete camping spot', details: error }));
});

// Boekingenbeheer
app.get('/api/bookings/user/:user_id', (req, res) => {
    const { user_id } = req.params;
    const db = new Database();
    db.getQuery('SELECT * FROM Bookings WHERE user_id = ?', [user_id])
        .then(bookings => res.send(bookings))
        .catch(error => res.status(500).send({ error: 'Failed to fetch bookings', details: error }));
});

app.delete('/api/bookings/:id', (req, res) => {
    const { id } = req.params;
    const db = new Database();
    db.getQuery('DELETE FROM Bookings WHERE booking_id = ?', [id])
        .then(() => res.send({ message: 'Booking cancelled successfully' }))
        .catch(error => res.status(500).send({ error: 'Failed to cancel booking', details: error }));
});

app.get('/', (req, res) => {
    res.send('Camping Platform API is running!');
});

// Server starten
app.listen(3000, () => {
    console.log('CampingPlatform API running on port 3000');
});
