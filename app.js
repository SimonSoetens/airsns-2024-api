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

app.put('/api/profile/:id', (req, res) => {
  const { id } = req.params;
  const { email, name, firstname, phone, date_of_birth, country } = req.body;

  console.log('Updating user:', id, req.body); // Debug log

  const db = new Database();
  db.getQuery(
      'UPDATE Users SET email = ?, name = ?, firstname = ?, phone = ?, date_of_birth = ?, country = ? WHERE user_id = ?',
      [email, name, firstname, phone, date_of_birth, country, id]
  )
      .then(() => res.send({ message: 'User updated successfully' }))
      .catch((error) => {
          console.error('Error updating user:', error);
          res.status(500).send({ error: 'Failed to update user', details: error });
      });
});

app.delete('/api/campingspots/:id', async (req, res) => {
  const spotId = req.params.id;
  const db = new Database();
  try {
    // Eerst de gerelateerde boekingen verwijderen
    await db.executeQuery('DELETE FROM Bookings WHERE spot_id = ?', [spotId]);

    // Daarna de campingspot verwijderen
    const result = await db.executeQuery('DELETE FROM CampingSpots WHERE spot_id = ?', [spotId]);

    if (result.affectedRows > 0) {
      res.send({ success: true, message: 'Campingspot succesvol verwijderd.' });
    } else {
      res.status(404).send({ success: false, message: 'Campingspot niet gevonden.' });
    }
  } catch (error) {
    console.error('Fout bij het verwijderen van campingspot:', error);
    res.status(500).send({ success: false, message: 'Interne serverfout.', details: error });
  }
});

// Campingplekkenbeheer
app.get('/api/campingspots', async (req, res) => {
  const db = new Database();

  try {
    const spots = await db.getQuery('SELECT * FROM CampingSpots');
    res.send({ success: true, campingSpots: spots });
  } catch (error) {
    console.error('Fout bij het ophalen van campingspots:', error);
    res.status(500).send({ success: false, message: 'Interne serverfout.' });
  }
});

app.post('/api/campingspots', async (req, res) => {
  const { name, location, description, price } = req.body;
  console.log('Ontvangen data:', req.body);


  // Controleer of alle velden aanwezig zijn, zet anders op null
  if (!name || !location || !description || price == null) {
      return res.status(400).send({ success: false, message: 'Alle velden zijn verplicht.' });
  }

  const db = new Database();
  const ownerId = 1; // Hardcoded eigenaar ID

  try {
      const result = await db.executeQuery(
          'INSERT INTO campingspots (name, location, description, price, owner_id) VALUES (?, ?, ?, ?, ?)',
          [name || null, location || null, description || null, price || null, ownerId]
      );

      if (result.affectedRows > 0) {
          res.send({ success: true, message: 'Campingspot succesvol toegevoegd.' });
      } else {
          res.status(500).send({ success: false, message: 'Kon de campingspot niet toevoegen.' });
      }
  } catch (error) {
      console.error('Fout bij het toevoegen van de campingspot:', error);
      res.status(500).send({ success: false, message: 'Interne serverfout.' });
  }
});

app.delete('/api/campingspots/:id', (req, res) => {
    const { id } = req.params;
    const db = new Database();
    db.getQuery('DELETE FROM CampingSpots WHERE spot_id = ?', [id])
        .then(() => res.send({ message: 'Camping spot deleted successfully' }))
        .catch(error => res.status(500).send({ error: 'Failed to delete camping spot', details: error }));
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

// Endpoint om gebruikersinformatie op te halen
app.get('/api/profile/:id', async (req, res) => {
    const userId = req.params.id; // Haal user ID op uit de URL
    const db = new Database();
  
    try {
      const user = await db.getQuery('SELECT name, firstname, email, phone, date_of_birth, country FROM Users WHERE user_id = ?', [userId]);
      if (user.length === 0) {
        return res.status(404).send({ success: false, message: 'Gebruiker niet gevonden' });
      }
      res.status(200).send({ success: true, user: user[0] });
    } catch (err) {
      console.error('Fout bij ophalen gebruikersinformatie:', err);
      res.status(500).send({ success: false, message: 'Interne serverfout' });
    }
  });

  app.get('/api/bookings/:user_id', async (req, res) => {
    const { user_id } = req.params;
    const db = new Database();
  
    try {
      console.log("Ontvangen user_id:", user_id); // Debugging log
      const bookings = await db.getQuery(
        `SELECT b.booking_id, b.status, b.created_at, 
       IFNULL(c.name, 'Geen naam beschikbaar') AS name, 
       IFNULL(c.description, 'Geen beschrijving beschikbaar') AS description, 
       IFNULL(c.price, 'Onbekend') AS price
      FROM Bookings b
      INNER JOIN CampingSpots c ON b.spot_id = c.spot_id
      WHERE b.user_id = ?`,
        [user_id]
      );
  
      console.log("Boekingen ontvangen in API:", bookings); // Log resultaten
      res.send({ success: true, bookings });
    } catch (error) {
      console.error("Fout bij ophalen boekingen:", error); // Debugging log
      res.status(500).send({ success: false, message: 'Interne serverfout.', details: error });
    }
  });
  
  app.post('/api/bookings', async (req, res) => {
    const { userId, spotId } = req.body;
  
    // Controleer of de vereiste gegevens aanwezig zijn
    if (!userId || !spotId) {
      return res.status(400).send({ success: false, message: 'Gebruiker en campingspot zijn verplicht.' });
    }
  
    const db = new Database();
  
    try {
      // Voeg een nieuwe boeking toe aan de database
      const result = await db.executeQuery(
        'INSERT INTO Bookings (user_id, spot_id) VALUES (?, ?)',
        [userId, spotId]
      );
  
      if (result.affectedRows > 0) {
        res.send({ success: true, message: 'Boeking succesvol opgeslagen.' });
      } else {
        res.status(500).send({ success: false, message: 'Kon de boeking niet opslaan.' });
      }
    } catch (error) {
      console.error('Fout bij het opslaan van de boeking:', error);
      res.status(500).send({ success: false, message: 'Interne serverfout.' });
    }
  }); 

// Login met e-mail
app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;
    const db = new Database(); // Zorg dat de Database klasse correct wordt gebruikt

    if (email === "owner@AirSnS.com" && password === "AirSnS2025") {
      console.log('Inloggen als eigenaar gelukt.'); // Debug logging
      return res.send({
          success: true,
          isOwner: true,
          message: "Logged in as owner",
      });
    }
    else
    {
      try {
        const [user] = await db.getQuery('SELECT * FROM Users WHERE email = ?', [email]);
        if (!user) {
            return res.status(400).send({ success: false, message: 'Gebruiker niet gevonden.' });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password_hash);
        if (!isPasswordValid) {
            return res.status(400).send({ success: false, message: 'Onjuist wachtwoord.' });
        }

        res.send({ success: true, userId: user.user_id });
      } catch (err) {
          console.error('Interne fout bij inloggen:', err);
          res.status(500).send({ success: false, message: 'Interne serverfout.' });
      }
    }
});

app.get('/', (req, res) => {
    res.send('AirSnS API is running!');
});

// Server starten
app.listen(3000, () => {
    console.log('AirSnS API running on port 3000');
});
