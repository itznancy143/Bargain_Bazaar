const express = require('express');
const router = express.Router();
const Offer = require('../models/Offer');

// Get all offers
router.get('/', async (req, res) => {
  try {
    const offers = await Offer.find()
      .populate('product', 'name originalPrice currentPrice')
      .populate('buyer', 'username rating')
      .populate('seller', 'username rating');
    res.json(offers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get offers for a product
router.get('/product/:productId', async (req, res) => {
  try {
    const offers = await Offer.find({ product: req.params.productId })
      .populate('buyer', 'username rating')
      .populate('seller', 'username rating');
    res.json(offers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get offers for a user (buyer or seller)
router.get('/user/:userId', async (req, res) => {
  try {
    const offers = await Offer.find({
      $or: [{ buyer: req.params.userId }, { seller: req.params.userId }]
    })
      .populate('product', 'name originalPrice currentPrice')
      .populate('buyer', 'username rating')
      .populate('seller', 'username rating');
    res.json(offers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create offer
router.post('/', async (req, res) => {
  try {
    const offer = new Offer(req.body);
    await offer.save();
    await offer.populate('product').populate('buyer').populate('seller');
    res.status(201).json(offer);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update offer (accept/reject/counter-offer)
router.put('/:id', async (req, res) => {
  try {
    const offer = await Offer.findByIdAndUpdate(req.params.id, req.body, { new: true })
      .populate('product')
      .populate('buyer')
      .populate('seller');
    res.json(offer);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete offer
router.delete('/:id', async (req, res) => {
  try {
    await Offer.findByIdAndDelete(req.params.id);
    res.json({ message: 'Offer deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
