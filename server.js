// === Import des modules ===
const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const cors = require("cors");
const bodyParser = require("body-parser");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

// === Middleware ===
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "public")));

// === Base de données SQLite ===
const db = new sqlite3.Database("./chat.db", (err) => {
  if (err) console.error("Erreur de connexion à SQLite:", err);
  else console.log("✅ Base SQLite connectée");
});

// === Création de la table des messages ===
db.run(`
  CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    message TEXT,
    articleId TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// === Route GET : Récupération des messages d’un article ===
app.get("/messages", (req, res) => {
  const { articleId } = req.query;
  if (!articleId) return res.status(400).send("articleId manquant");
  db.all(
    "SELECT * FROM messages WHERE articleId = ? ORDER BY created_at DESC",
    [articleId],
    (err, rows) => {
      if (err) return res.status(500).send(err.message);
      res.send(rows);
    }
  );
});

// === Route POST : Envoi d’un message ===
app.post("/messages", (req, res) => {
  const { name, message, articleId } = req.body;
  if (!name || !message || !articleId)
    return res.status(400).send("Champs manquants");
  db.run(
    "INSERT INTO messages (name, message, articleId) VALUES (?, ?, ?)",
    [name, message, articleId],
    function (err) {
      if (err) return res.status(500).send(err.message);
      res.send({ id: this.lastID });
    }
  );
});

// === Route DELETE : Suppression d’un message ===
app.delete("/messages/:id", (req, res) => {
  const { id } = req.params;
  db.run("DELETE FROM messages WHERE id = ?", [id], function (err) {
    if (err) return res.status(500).send(err.message);
    res.send({ success: true });
  });
});

// === Lancement du serveur ===
app.listen(PORT, () => {
  console.log(`🚀 Serveur en ligne sur le port ${PORT}`);
});
