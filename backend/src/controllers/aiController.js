const Property = require('../models/Property');
const OpenAI = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// @desc    Process natural language query to find properties
// @route   POST /api/ai/recommend
// @access  Public
const recommendProperties = async (req, res) => {
  const { query } = req.body;
  if (!query) return res.status(400).json({ message: 'Query is required' });

  try {
    // We ask OpenAI to parse the query into structured JSON for our MongoDB query
    const prompt = `
      Extract the following filters from the user's query about finding a hostel/PG:
      - minPrice (number or null)
      - maxPrice (number or null)
      - location (string or null)
      - gender ('Boys', 'Girls', 'Unisex', or null)
      - roomType ('Single', 'Double', 'Triple', 'Dormitory', or null)
      - hasAC (boolean or null)
      - hasWiFi (boolean or null)
      
      User query: "${query}"
      
      Return ONLY a valid JSON object matching these keys. Do not include markdown formatting or other text.
    `;

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 150,
      temperature: 0,
    });

    const aiFilters = JSON.parse(response.choices[0].message.content.trim());
    
    // Build MongoDB query
    let dbQuery = { availability: true };
    if (aiFilters.minPrice || aiFilters.maxPrice) {
      dbQuery.price = {};
      if (aiFilters.minPrice) dbQuery.price.$gte = aiFilters.minPrice;
      if (aiFilters.maxPrice) dbQuery.price.$lte = aiFilters.maxPrice;
    }
    if (aiFilters.location) dbQuery.location = { $regex: aiFilters.location, $options: 'i' };
    if (aiFilters.gender) dbQuery.gender = aiFilters.gender;
    if (aiFilters.roomType) dbQuery.roomType = aiFilters.roomType;
    if (aiFilters.hasAC !== null) dbQuery.hasAC = aiFilters.hasAC;
    if (aiFilters.hasWiFi !== null) dbQuery.hasWiFi = aiFilters.hasWiFi;

    const properties = await Property.find(dbQuery).limit(10).populate('ownerId', 'name contact');
    
    res.json({ filtersApplied: aiFilters, properties });
  } catch (error) {
    console.error('AI Recommendation Error:', error);
    res.status(500).json({ message: 'Error processing AI recommendation' });
  }
};

// @desc    Chatbot response
// @route   POST /api/ai/chat
// @access  Public
const chatBot = async (req, res) => {
  const { message } = req.body;

  try {
    const prompt = `You are a helpful AI assistant for StayFinder, a platform to find Hostels and PGs. 
    Answer the following user query accurately and concisely. Be friendly and helpful. 
    User: ${message}`;

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 200,
    });

    res.json({ reply: response.choices[0].message.content.trim() });
  } catch (error) {
    res.status(500).json({ message: 'Error communicating with AI Chatbot' });
  }
};

module.exports = {
  recommendProperties,
  chatBot
};
