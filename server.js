const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const cors = require("cors");
const bodyParser = require("body-parser");

const app = express();
const db = new sqlite3.Database("./chat.db");

app.use(cors());
app.use(bodyParser.json());

// Crée la table si elle n'existe pas
db.run(`CREATE TABLE IF NOT EXISTS messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT,
  message TEXT,
  parent_id INTEGER DEFAULT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)`);

// 🟢 Récupérer tous les messages
app.get("/messages", (req, res) => {
  db.all("SELECT * FROM messages ORDER BY created_at ASC", [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// 🟢 Ajouter un message ou une réponse
app.post("/messages", (req, res) => {
  const { name, message, parent_id } = req.body;
  if (!name || !message) return res.status(400).json({ error: "Champs manquants" });

  db.run(
    "INSERT INTO messages (name, message, parent_id) VALUES (?, ?, ?)",
    [name, message, parent_id || null],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id: this.lastID });
    }
  );
});

// 🔴 Supprimer un message (et ses réponses)
app.delete("/messages/:id", (req, res) => {
  const messageId = req.params.id;

  // Supprimer les réponses associées
  db.run("DELETE FROM messages WHERE parent_id = ?", [messageId], function(err) {
    if (err) return res.status(500).json({ error: err.message });

    // Supprimer le message lui-même
    db.run("DELETE FROM messages WHERE id = ?", [messageId], function(err2) {
      if (err2) return res.status(500).json({ error: err2.message });
      res.json({ success: true });
    });
  });
});

app.listen(3000, () => console.log("✅ Serveur de discussion sur http://localhost:3000"));
