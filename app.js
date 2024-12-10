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

app.put('/api/users/:id/password', async (req, res) => {
  const { id } = req.params; // User ID uit de URL
  const { currentPassword, newPassword } = req.body; // Data uit de request body

  if (!currentPassword || !newPassword) {
    return res.status(400).send({ success: false, message: 'Alle velden zijn verplicht.' });
  }

  const db = new Database();

  try {
    // Haal de huidige hashed wachtwoord van de gebruiker op
    const user = await db.getQuery('SELECT password_hash FROM Users WHERE user_id = ?', [id]);

    if (!user.length) {
      return res.status(404).send({ success: false, message: 'Gebruiker niet gevonden.' });
    }

    const hashedPassword = user[0].password_hash;

    // Controleer of het ingevoerde huidige wachtwoord correct is
    const isMatch = await bcrypt.compare(currentPassword, hashedPassword);
    if (!isMatch) {
      return res.status(400).send({ success: false, message: 'Huidig wachtwoord is onjuist.' });
    }

    // Hash het nieuwe wachtwoord
    const newHashedPassword = await bcrypt.hash(newPassword, 10);

    // Update het wachtwoord in de database
    await db.getQuery('UPDATE Users SET password_hash = ? WHERE user_id = ?', [newHashedPassword, id]);

    res.send({ success: true, message: 'Wachtwoord succesvol bijgewerkt!' });
  } catch (error) {
    console.error('Fout bij het wijzigen van het wachtwoord:', error);
    res.status(500).send({
      success: false,
      message: 'Er is een fout opgetreden bij het wijzigen van het wachtwoord.',
    });
  }
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
    const result = await db.executeQuery('DELETE FROM CampingSpots WHERE spot_id = ?', [spotId]);
    if (result.affectedRows > 0) {
      res.send({ success: true, message: 'Campingspot succesvol verwijderd.' });
    } else {
      res.status(404).send({ success: false, message: 'Campingspot niet gevonden.' });
    }
  } catch (error) {
    console.error('Fout bij het verwijderen van campingspot:', error);
    res.status(500).send({ success: false, message: 'Interne serverfout.' });
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

  app.get("/api/profile", async (req, res) => {
    const userId = req.query.userId;
  
    try {
      const user = await db.getQuery("SELECT * FROM Users WHERE user_id = ?", [userId]);
      if (user.length === 0) {
        return res.status(404).send({ success: false, message: "Gebruiker niet gevonden" });
      }
  
      res.send({ success: true, user: user[0] });
    } catch (err) {
      console.error("Fout bij ophalen profiel:", err);
      res.status(500).send({ success: false, message: "Interne serverfout" });
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
