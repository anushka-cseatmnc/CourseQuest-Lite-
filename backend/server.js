const express = require('express');
const cors = require('cors');
const pool = require('./db');
const multer = require('multer');
const csv = require('csv-parser');
const fs = require('fs');
require('dotenv').config();

const app = express();
const upload = multer({ dest: 'uploads/' });

app.use(cors());
app.use(express.json());

// Health check
app.get('/', (req, res) => {
  res.json({ message: 'CourseQuest API is running!' });
});

// Setup database (Run once)
app.post('/api/setup', async (req, res) => {
  try {
    await pool.query(`
      DROP TABLE IF EXISTS courses;
      CREATE TABLE courses (
        id SERIAL PRIMARY KEY,
        course_id VARCHAR(50) UNIQUE NOT NULL,
        course_name VARCHAR(200) NOT NULL,
        department VARCHAR(50) NOT NULL,
        level VARCHAR(10) NOT NULL,
        delivery_mode VARCHAR(20) NOT NULL,
        credits INTEGER NOT NULL,
        duration_weeks INTEGER NOT NULL,
        rating DECIMAL(3,2),
        tuition_fee_inr INTEGER NOT NULL,
        year_offered INTEGER NOT NULL
      );
      CREATE INDEX idx_dept ON courses(department);
      CREATE INDEX idx_level ON courses(level);
      CREATE INDEX idx_delivery ON courses(delivery_mode);
      CREATE INDEX idx_rating ON courses(rating);
      CREATE INDEX idx_fee ON courses(tuition_fee_inr);
    `);
    res.json({ success: true, message: 'Database ready!' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 1. GET /api/courses - Search & Filter
app.get('/api/courses', async (req, res) => {
  try {
    const { 
      page = 1, limit = 10, department, level, delivery_mode,
      min_rating, max_fee, search 
    } = req.query;

    let query = 'SELECT * FROM courses WHERE 1=1';
    const params = [];
    let idx = 1;

    if (department) {
      query += ` AND department = $${idx++}`;
      params.push(department.toUpperCase());
    }
    if (level) {
      query += ` AND level = $${idx++}`;
      params.push(level.toUpperCase());
    }
    if (delivery_mode) {
      query += ` AND delivery_mode = $${idx++}`;
      params.push(delivery_mode.toLowerCase());
    }
    if (min_rating) {
      query += ` AND rating >= $${idx++}`;
      params.push(parseFloat(min_rating));
    }
    if (max_fee) {
      query += ` AND tuition_fee_inr <= $${idx++}`;
      params.push(parseInt(max_fee));
    }
    if (search) {
      query += ` AND course_name ILIKE $${idx++}`;
      params.push(`%${search}%`);
    }

    const offset = (page - 1) * limit;
    query += ` ORDER BY course_name LIMIT $${idx++} OFFSET $${idx++}`;
    params.push(parseInt(limit), offset);

    console.log('Query:', query);
    console.log('Params:', params);

    const result = await pool.query(query, params);
    
    const countQuery = 'SELECT COUNT(*) FROM courses WHERE 1=1' + 
      (department ? ` AND department = '${department.toUpperCase()}'` : '') +
      (level ? ` AND level = '${level.toUpperCase()}'` : '') +
      (delivery_mode ? ` AND delivery_mode = '${delivery_mode.toLowerCase()}'` : '') +
      (min_rating ? ` AND rating >= ${parseFloat(min_rating)}` : '') +
      (max_fee ? ` AND tuition_fee_inr <= ${parseInt(max_fee)}` : '') +
      (search ? ` AND course_name ILIKE '%${search}%'` : '');
    
    const countResult = await pool.query(countQuery);
    
    res.json({
      success: true,
      data: {
        courses: result.rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: parseInt(countResult.rows[0].count),
          totalPages: Math.ceil(countResult.rows[0].count / limit)
        }
      }
    });
  } catch (err) {
    console.error('Courses error:', err);
    res.status(500).json({ error: err.message });
  }
});

// 2. GET /api/compare - Compare courses
app.get('/api/compare', async (req, res) => {
  try {
    const { ids } = req.query;
    if (!ids) return res.status(400).json({ error: 'ids required' });

    const idArray = ids.split(',').map(id => parseInt(id));
    if (idArray.length < 2 || idArray.length > 4) {
      return res.status(400).json({ error: 'Compare 2-4 courses' });
    }

    const result = await pool.query(
      'SELECT * FROM courses WHERE id = ANY($1)',
      [idArray]
    );

    res.json({
      success: true,
      data: { courses: result.rows }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. POST /api/ask - Natural Language Parser (FIXED VERSION)
app.post('/api/ask', async (req, res) => {
  try {
    const { question } = req.body;
    if (!question) return res.status(400).json({ error: 'question required' });

    const filters = {};
    const q = question.toLowerCase();

    // Department parsing - improved patterns
    if (q.match(/\b(cs|computer science|computer|computing)\b/)) filters.department = 'CS';
    else if (q.match(/\b(ee|electrical|electronics)\b/)) filters.department = 'EE';
    else if (q.match(/\b(me|mechanical)\b/)) filters.department = 'ME';
    else if (q.match(/\b(ce|civil)\b/)) filters.department = 'CE';
    else if (q.match(/\b(chem|chemistry|chemical)\b/)) filters.department = 'CHEM';
    else if (q.match(/\b(math|mathematics)\b/)) filters.department = 'MATH';
    else if (q.match(/\b(phys|physics)\b/)) filters.department = 'PHYS';

    // Level parsing
    if (q.match(/\b(ug|undergraduate|bachelor)\b/)) filters.level = 'UG';
    else if (q.match(/\b(pg|postgraduate|master|graduate)\b/)) filters.level = 'PG';

    // Delivery mode parsing - use match instead of includes
    if (q.match(/\bonline\b/)) filters.delivery_mode = 'online';
    else if (q.match(/\boffline\b/)) filters.delivery_mode = 'offline';
    else if (q.match(/\bhybrid\b/)) filters.delivery_mode = 'hybrid';

    // Fee parsing - improved patterns
    const feeMatch = q.match(/(?:under|below|less than|max|maximum|cheaper than)\s*(\d+)/);
    if (feeMatch) {
      let fee = parseInt(feeMatch[1]);
      if (fee < 1000) fee *= 1000; // Convert 50 to 50000
      filters.max_fee = fee;
    }

    // Rating parsing - improved
    const ratingMatch = q.match(/(?:rating|rated)\s*(?:above|over|at least|atleast|minimum)?\s*(\d+\.?\d*)/);
    if (ratingMatch) {
      filters.min_rating = parseFloat(ratingMatch[1]);
    }

    // Build query
    let query = 'SELECT * FROM courses WHERE 1=1';
    const params = [];
    let idx = 1;

    if (filters.department) {
      query += ` AND department = $${idx++}`;
      params.push(filters.department);
    }
    if (filters.level) {
      query += ` AND level = $${idx++}`;
      params.push(filters.level);
    }
    if (filters.delivery_mode) {
      query += ` AND delivery_mode = $${idx++}`;
      params.push(filters.delivery_mode);
    }
    if (filters.max_fee) {
      query += ` AND tuition_fee_inr <= $${idx++}`;
      params.push(filters.max_fee);
    }
    if (filters.min_rating) {
      query += ` AND rating >= $${idx++}`;
      params.push(filters.min_rating);
    }

    query += ' ORDER BY rating DESC LIMIT 20';

    console.log('Question:', question);
    console.log('Parsed filters:', filters);
    console.log('SQL Query:', query);
    console.log('Params:', params);

    const result = await pool.query(query, params);

    res.json({
      success: true,
      data: {
        parsed_filters: filters,
        courses: result.rows,
        count: result.rows.length,
        message: result.rows.length === 0 ? 'No matching courses found' : null
      }
    });
  } catch (err) {
    console.error('Ask AI error:', err);
    res.status(500).json({ error: err.message });
  }
});

// 4. POST /api/ingest - CSV Upload
app.post('/api/ingest', upload.single('file'), async (req, res) => {
  try {
    const token = req.headers['x-ingest-token'];
    if (token !== process.env.INGEST_TOKEN) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const courses = [];
    fs.createReadStream(req.file.path)
      .pipe(csv())
      .on('data', (row) => courses.push(row))
      .on('end', async () => {
        let count = 0;
        for (const c of courses) {
          try {
            await pool.query(`
              INSERT INTO courses (course_id, course_name, department, level, 
                delivery_mode, credits, duration_weeks, rating, tuition_fee_inr, year_offered)
              VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
              ON CONFLICT (course_id) DO UPDATE SET
                course_name = EXCLUDED.course_name,
                rating = EXCLUDED.rating
            `, [c.course_id, c.course_name, c.department, c.level, c.delivery_mode,
                parseInt(c.credits), parseInt(c.duration_weeks), parseFloat(c.rating),
                parseInt(c.tuition_fee_inr), parseInt(c.year_offered)]);
            count++;
          } catch (err) {
            console.error(err);
          }
        }
        fs.unlinkSync(req.file.path);
        res.json({ success: true, message: `Ingested ${count} courses` });
      });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 5000;

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

module.exports = app;
