# CourseQuest Lite

A lightweight university course search and comparison platform with AI-assisted natural language queries.

## Overview

CourseQuest Lite allows users to:
- Search and filter university courses
- Compare multiple courses side-by-side
- Query courses using natural language (e.g., "online PG courses under 50000")
- Manage course data through CSV ingestion


## Features

- Advanced search with multiple filters (department, level, fees, rating)
- Compare 2-4 courses in table view
- Natural language query parsing (rule-based)
- CSV data ingestion with token protection
- Pagination for efficient browsing
- Responsive UI with Tailwind CSS

## Tech Stack

**Frontend:**
- React 18 + Vite
- Tailwind CSS + PostCSS
- Axios for API calls

**Backend:**
- Node.js + Express.js
- PostgreSQL database
- CSV data handling

## Screenshots

### Search & Filter Page
<img width="1914" height="923" alt="Screenshot 2025-09-30 015348" src="https://github.com/user-attachments/assets/cb21ccd9-86d3-4289-8d43-2efd8f857b39" />
<img width="1918" height="911" alt="Screenshot 2025-09-30 020254" src="https://github.com/user-attachments/assets/e73a8fe7-daa9-4219-b37d-3689cae28b05" />
<img width="1918" height="909" alt="Screenshot 2025-09-30 020304" src="https://github.com/user-attachments/assets/a66919d8-b2b8-4237-b689-11e3bac091c6" />

Advanced filtering with course results and pagination

### Course Comparison
<img width="1918" height="899" alt="Screenshot 2025-09-30 020317" src="https://github.com/user-attachments/assets/a3f9fdc0-bc3f-47b5-b1aa-3a9e4348d026" />

Side-by-side comparison of selected courses

### Ask AI with Parsed Filters
<img width="1903" height="906" alt="Screenshot 2025-09-30 020400" src="https://github.com/user-attachments/assets/17cfaf62-e2c2-48a8-b45d-02e554fb9ba5" />

*Natural language query showing parsed filters and results* 

## Project Structure

```
CourseQuest/
├── frontend/
│   ├── src/
│   │   ├── App.jsx              # Main app component
│   │   ├── main.jsx             # Entry point
│   │   └── index.css            # Global styles
│   ├── index.html
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   └── package.json
├── backend/
│   ├── server.js             # Express server
    ├── tests.js               # tests
│   ├── db.js                    # Database operations
│   ├── courses.csv              # Sample course data (60-80 rows)
│   └── package.json
├── screenshots/                 # UI screenshots for submission
├── .gitignore
└── README.md
```

## Testing
Run Tests -   npm test

## Test Coverage
The test suite validates all core API endpoints:

## 1. GET /api/courses - Pagination & Filtering.

Verifies courses endpoint returns paginated results
Checks response structure (courses, pagination metadata)
Confirms page and limit parameters work correctly

## 2. GET /api/compare - Course Comparison

Compares 2 courses by ID
Verifies correct courses are returned for side-by-side comparison

## 3. POST /api/ask - Natural Language Parser

Tests NL query parsing (e.g., "online PG courses under 50000")
Validates parsed filters extraction (delivery_mode, level, max_fee)
Checks that matching courses are returned

## 4. POST /api/ingest - Security Test

Verifies unauthorized requests are rejected (401 status)
Confirms token-based authentication works correctly
## Getting Started

### Prerequisites

- Node.js (v16+)
- PostgreSQL (v13+)
- npm or yarn

### Environment Setup

Create a `.env` file in the `backend` folder:

```env
DATABASE_URL=postgresql://username:password@localhost:5432/coursequest
INGEST_TOKEN=your-secret-token-here
PORT=3000
```

### Installation

**1. Clone the repository**
```bash
git clone git@github.com:anushka-cseatmnc/CourseQuest-Lite-.git
cd CourseQuest-Lite-
```

**2. Setup Database**
```bash
# Create PostgreSQL database
createdb coursequest

# Run schema (if you have a schema.sql file)
psql coursequest < backend/schema.sql
```

**3. Install Backend**
```bash
cd backend
npm install
```

**4. Install Frontend**
```bash
cd ../frontend
npm install
```

### Running the App

**Terminal 1 - Backend:**
```bash
cd backend
npm start
# Runs on http://localhost:3000
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
# Runs on http://localhost:5173
```

Open `http://localhost:5173` in your browser.

### Load Sample Data

```bash
curl -X POST http://localhost:3000/api/ingest \
  -H "x-ingest-token: your-secret-token-here" \
  -F "file=@backend/courses.csv"
```

## API Endpoints

### 1. Get Courses (with filters)
```http
GET /api/courses?page=1&limit=10&department=CS&level=UG&min_fee=0&max_fee=100000
```

**Filters:**
- `page`, `limit` - Pagination
- `department` - Filter by dept (e.g., CS, EE)
- `level` - UG, PG, or Diploma
- `delivery_mode` - online, offline, hybrid
- `min_fee`, `max_fee` - Fee range (INR)
- `min_rating`, `max_rating` - Rating (0-5)
- `search` - Search course names

### 2. Compare Courses
```http
GET /api/compare?ids=1,2,3
```

Returns 2-4 courses for comparison.

### 3. Ask AI (Natural Language)
```http
POST /api/ask
Content-Type: application/json

{
  "question": "Show me online PG courses under 50000"
}
```

Returns parsed filters and matching courses.

### 4. Ingest CSV (Protected)
```http
POST /api/ingest
x-ingest-token: your-secret-token-here
Content-Type: multipart/form-data

file: courses.csv
```

## Database Schema

**Courses Table:**
```sql
CREATE TABLE courses (
    course_id SERIAL PRIMARY KEY,
    course_name VARCHAR(255) NOT NULL,
    department VARCHAR(50) NOT NULL,
    level VARCHAR(20) CHECK (level IN ('UG', 'PG', 'Diploma')),
    delivery_mode VARCHAR(20) CHECK (delivery_mode IN ('online', 'offline', 'hybrid')),
    credits INTEGER,
    duration_weeks INTEGER,
    rating DECIMAL(3,2),
    tuition_fee_inr INTEGER,
    year_offered INTEGER
);

-- Indexes for performance
CREATE INDEX idx_department ON courses(department);
CREATE INDEX idx_level ON courses(level);
CREATE INDEX idx_rating ON courses(rating);
CREATE INDEX idx_fee ON courses(tuition_fee_inr);
```

## Ask AI Examples

The AI feature uses rule-based parsing to understand queries:

- "online PG courses in Computer Science"
- "courses under 50000 rupees"
- "UG programs with rating above 4.5"
- "offline MBA courses"
- "Engineering courses with more than 3 credits"

**Parsing Logic:**
- Extracts: department, level, delivery mode, fee ranges, rating ranges
- Leftover keywords are used to search in course names
- Shows all parsed filters transparently in UI

## Testing

```bash
# Run backend tests (if implemented)
cd backend
npm test

# Test API endpoints
curl http://localhost:3000/api/courses
```

## Deployment (Optional Bonus)

Deploy to free cloud services:
- **Render**: PostgreSQL + Node.js
- **Railway**: Full-stack deployment
- **Fly.io**: Docker-based deployment

## Design Notes

**Architecture Decisions:**
- Single-table design for simplicity (60-80 rows)
- Rule-based NL parsing (no ML/LLMs needed)
- Token-based auth for ingestion
- Indexed queries for performance
- React SPA with Vite for fast dev

**Tradeoffs:**
- Simple schema vs normalized (chose simple for scope)
- Rule-based vs ML parsing (chose rules for reliability)
- Client-side routing vs server (chose client for SPA experience)

## Author

**Anushka**
- GitHub: [@anushka-cseatmnc](https://github.com/anushka-cseatmnc)

## License

MIT License - see [LICENSE](LICENSE) file

---

If you find this helpful, please star the repo!


