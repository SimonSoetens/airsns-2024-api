const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
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
app.post('/api/register', async (req, res) => {
    const { name, firstname, email, phone, date_of_birth, country, password } = req.body;
    const db = new Database();
  
    try {
      // Wachtwoord hashen
      const hashedPassword = await bcrypt.hash(password, 10);
  
      // Query om gebruiker te registreren
      await db.getQuery(
        `INSERT INTO Users (name, firstname, email, phone, date_of_birth, country, password_hash)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [name, firstname, email, phone, date_of_birth, country, hashedPassword]
      );
  
      res.status(201).send({ success: true });
    } catch (error) {
      console.error('Fout bij registreren:', error);
      res.status(500).send({ success: false, error: error.message });
    }
  });

// Login met e-mail
app.post("/api/login", async (req, res) => {
    const { email, password } = req.body;
    const db = new Database();
    try {
      const users = await db.getQuery("SELECT * FROM Users WHERE email = ?", [email]);
      if (users.length === 0) {
        return res.status(401).send({ success: false, error: "Gebruiker niet gevonden" });
      }
      const user = users[0];
      const isMatch = await bcrypt.compare(password, user.password_hash);
      if (!isMatch) {
        return res.status(401).send({ success: false, error: "Onjuist wachtwoord" });
      }
      res.send({ success: true, message: "Succesvol ingelogd!" });
    } catch (err) {
      res.status(500).send({ success: false, error: err.message });
    }
  });
  

app.get('/', (req, res) => {
    res.send('AirSnS API is running!');
});

// Server starten
app.listen(3000, () => {
    console.log('AirSnS API running on port 3000');
});
