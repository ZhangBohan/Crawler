const express = require('express');
const { crawlResources, RESOURCE_TYPES } = require('./crawler');

const app = express();
app.use(express.json());

app.post('/crawl', async (req, res) => {
  try {
    const { url, keyword, async = false, scroll = false, resourceType = RESOURCE_TYPES.IMAGE } = req.body;
    
    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    // 验证URL格式
    try {
      new URL(url);
    } catch (e) {
      return res.status(400).json({ error: 'Invalid URL format' });
    }

    const images = await crawlResources({ 
      url: url, 
      resourceType: resourceType, 
      keyword: keyword, 
      async: async, 
      scroll: scroll 
    });
    
    if (!images || images.length === 0) {
      return res.status(404).json({ 
        error: 'No images found',
        images: []
      });
    }

    res.json({ images });
  } catch (error) {
    console.error('Crawling error:', error);
    res.status(500).json({ 
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

app.post('/crawlHtml', async (req, res) => {
  try {
    const { url, keyword, async = false, scroll = false } = req.body;
    
    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    // 验证URL格式
    try {
      new URL(url);
    } catch (e) {
      return res.status(400).json({ error: 'Invalid URL format' });
    }

    const html = await crawlResources({ 
      url: url, 
      resourceType: RESOURCE_TYPES.TEXT, 
      keyword: keyword, 
      async: async, 
      scroll: scroll 
    });
    
    if (!html) {
      return res.status(404).json({ 
        error: 'No html found',
        html: ''
      });
    }

    res.json({ html });
  } catch (error) {
    console.error('Crawling error:', error);
    res.status(500).json({ 
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

const PORT = process.env.PORT || 3000;

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}

module.exports = app; 