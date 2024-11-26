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

app.get('/api/test-users', (req, res) => {
    db.getQuery('SELECT * FROM Users')
        .then((rows) => {
            console.log(rows); // Logt alle rijen naar de console
            res.status(200).send(rows); // Stuurt de resultaten terug naar de client
        })
        .catch((err) => {
            console.error('Fout bij ophalen gegevens:', err); // Logt de fout naar de console
            res.status(500).send({ error: 'Er is een fout opgetreden' }); // Stuurt een foutmelding terug naar de client
        });
});

app.put('/api/users/:id', (req, res) => {
    const { id } = req.params;
    const { email, name, firstname } = req.body;
    const db = new Database();
    db.getQuery('UPDATE Users SET email = ?, name = ?, firstname = ? WHERE user_id = ?', [email, name, firstname, id])
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

// Registreren
app.post('/api/register', (req, res) => {
    console.log(req.body); // Debugging: toont de binnenkomende data
    const { name, firstname, email, phone, date_of_birth, country } = req.body;
    const db = new Database();
    db.getQuery(
        'INSERT INTO Users (name, firstname, email, phone, date_of_birth, country) VALUES (?, ?, ?, ?, ?, ?)',
        [name, firstname, email, phone, date_of_birth, country]
    )
    .then(() => res.status(201).send({ success: true }))
    .catch((error) => {
        console.error(error); // Debugging: toont backend-fouten
        res.status(500).send({ success: false, error });
    });
});

// Login met e-mail
app.post('/api/login', (req, res) => {
    const { email, password } = req.body; // Zorg dat het wachtwoord ook mee wordt gestuurd
    const db = new Database();

    // Controleer of gebruiker bestaat
    db.getQuery('SELECT * FROM Users WHERE email = ?', [email])
        .then(user => {
            if (user && user.password_hash === password) { // Controleer wachtwoord (indien gehasht, gebruik bcrypt.compare)
                // Als je JWT gebruikt, genereer hier een token
                const token = 'mock-token'; // Genereer een echte token met bijvoorbeeld jsonwebtoken
                res.send({ success: true, token });
            } else {
                res.status(401).send({ success: false, error: 'Ongeldige e-mail of wachtwoord' });
            }
        })
        .catch(error => res.status(500).send({ success: false, error: 'Login mislukt', details: error }));
});

app.get('/', (req, res) => {
    res.send('AirSnS API is running!');
});

// Server starten
app.listen(3000, () => {
    console.log('AirSnS API running on port 3000');
});
