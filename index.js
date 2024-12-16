const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
app.use(bodyParser.json());
app.use(cors());

// MongoDB Connection
mongoose.connect('mongodb://localhost:27017/trello-app', { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error(err));

// Models
const TileSchema = new mongoose.Schema({
    title: String,
    subtasks: [{ type: String }],
    order: Number,
});
const Tile = mongoose.model('Tile', TileSchema);

// Routes
app.get("/",(req,res)=>{
    res.send("Hii")
})
// Get all tiles
app.get('/tiles', async (req, res) => {
    const tiles = await Tile.find().sort('order');
    res.json(tiles);
});

// Create a new tile
app.post('/tiles', async (req, res) => {
    const { title, subtasks } = req.body;
    const order = await Tile.countDocuments();
    const tile = new Tile({ title, subtasks, order });
    await tile.save();
    res.json(tile);
});

// Update a tile's subtasks
app.put('/tiles/:id', async (req, res) => {
    const { subtasks } = req.body;
    const tile = await Tile.findByIdAndUpdate(req.params.id, { subtasks }, { new: true });
    res.json(tile);
});

// Reorder tiles
app.put('/reorder', async (req, res) => {
    const { tiles } = req.body;
    tiles.forEach(async (tile, index) => {
        await Tile.findByIdAndUpdate(tile._id, { order: index });
    });
    res.json({ success: true });
});

// Delete a tile by ID
app.delete('/tiles/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const tile = await Tile.findByIdAndDelete(id);
        if (!tile) {
            return res.status(404).json({ message: 'Tile not found' });
        }
        // After deletion, reorder remaining tiles
        const tiles = await Tile.find().sort('order');
        tiles.forEach(async (tile, index) => {
            await Tile.findByIdAndUpdate(tile._id, { order: index });
        });
        res.status(200).json({ message: 'Tile deleted successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

app.listen(5000, () => console.log('Server running on port 5000'));
 