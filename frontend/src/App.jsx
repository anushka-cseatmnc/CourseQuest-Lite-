import { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = 'http://localhost:5000';

function App() {
  const [page, setPage] = useState('search');
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState([]);
  const [compared, setCompared] = useState([]);
  
  const [filters, setFilters] = useState({
    department: '',
    level: '',
    delivery_mode: '',
    min_rating: '',
    max_fee: '',
    search: ''
  });
  
  const [question, setQuestion] = useState('');
  const [parsedFilters, setParsedFilters] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1 });

  const fetchCourses = async (pageNum = 1) => {
    setLoading(true);
    try {
      const params = { ...filters, page: pageNum, limit: 10 };
      Object.keys(params).forEach(key => !params[key] && delete params[key]);
      
      const res = await axios.get(`${API_URL}/api/courses`, { params });
      setCourses(res.data.data.courses);
      setPagination(res.data.data.pagination);
    } catch (err) {
      console.error(err);
      alert('Error fetching courses');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  const toggleSelect = (course) => {
    if (selected.find(c => c.id === course.id)) {
      setSelected(selected.filter(c => c.id !== course.id));
    } else if (selected.length < 4) {
      setSelected([...selected, course]);
    } else {
      alert('Maximum 4 courses');
    }
  };

  const loadComparison = async () => {
    if (selected.length < 2) {
      alert('Select at least 2 courses');
      return;
    }
    setLoading(true);
    try {
      const ids = selected.map(c => c.id).join(',');
      const res = await axios.get(`${API_URL}/api/compare?ids=${ids}`);
      setCompared(res.data.data.courses);
    } catch (err) {
      alert('Error loading comparison');
    }
    setLoading(false);
  };

  const askAI = async () => {
    if (!question.trim()) {
      alert('Please enter a question');
      return;
    }
    setLoading(true);
    console.log('Asking:', question);
    try {
      const res = await axios.post(`${API_URL}/api/ask`, { question: question.trim() });
      console.log('Response:', res.data);
      setCourses(res.data.data.courses);
      setParsedFilters(res.data.data.parsed_filters);
    } catch (err) {
      console.error('Error:', err);
      alert(err.response?.data?.error || 'Error processing question');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-blue-600 text-white p-4 shadow-lg">
        <h1 className="text-3xl font-bold">CourseQuest Lite</h1>
        <nav className="flex gap-6 mt-3">
          <button 
            onClick={() => setPage('search')}
            className={`hover:underline font-medium ${page === 'search' ? 'underline' : ''}`}>
            Search
          </button>
          <button 
            onClick={() => { setPage('compare'); loadComparison(); }}
            className={`hover:underline font-medium ${page === 'compare' ? 'underline' : ''}`}>
            Compare ({selected.length})
          </button>
          <button 
            onClick={() => setPage('ask')}
            className={`hover:underline font-medium ${page === 'ask' ? 'underline' : ''}`}>
            Ask AI
          </button>
        </nav>
      </header>

      {page === 'search' && (
        <div className="p-6 max-w-7xl mx-auto">
          <h2 className="text-2xl font-bold mb-4">Search Courses</h2>
          
          <div className="bg-white p-4 rounded-lg shadow mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <select 
                value={filters.department}
                onChange={(e) => setFilters({...filters, department: e.target.value})}
                className="border p-2 rounded">
                <option value="">All Departments</option>
                <option value="CS">Computer Science</option>
                <option value="EE">Electrical Engineering</option>
                <option value="ME">Mechanical Engineering</option>
                <option value="CE">Civil Engineering</option>
                <option value="CHEM">Chemistry</option>
                <option value="MATH">Mathematics</option>
                <option value="PHYS">Physics</option>
              </select>

              <select 
                value={filters.level}
                onChange={(e) => setFilters({...filters, level: e.target.value})}
                className="border p-2 rounded">
                <option value="">All Levels</option>
                <option value="UG">Undergraduate</option>
                <option value="PG">Postgraduate</option>
              </select>

              <select 
                value={filters.delivery_mode}
                onChange={(e) => setFilters({...filters, delivery_mode: e.target.value})}
                className="border p-2 rounded">
                <option value="">All Modes</option>
                <option value="online">Online</option>
                <option value="offline">Offline</option>
                <option value="hybrid">Hybrid</option>
              </select>

              <input
                type="number"
                placeholder="Min Rating (e.g. 4.0)"
                value={filters.min_rating}
                onChange={(e) => setFilters({...filters, min_rating: e.target.value})}
                className="border p-2 rounded"
              />

              <input
                type="number"
                placeholder="Max Fee (₹)"
                value={filters.max_fee}
                onChange={(e) => setFilters({...filters, max_fee: e.target.value})}
                className="border p-2 rounded"
              />

              <input
                type="text"
                placeholder="Search by name..."
                value={filters.search}
                onChange={(e) => setFilters({...filters, search: e.target.value})}
                className="border p-2 rounded"
              />
            </div>

            <button 
              onClick={() => fetchCourses(1)}
              className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700">
              Search
            </button>
          </div>

          {loading ? (
            <p className="text-center">Loading...</p>
          ) : (
            <>
              <div className="grid gap-4">
                {courses.map(c => (
                  <div key={c.id} className="bg-white p-4 rounded-lg shadow hover:shadow-lg transition">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-lg font-bold">{c.course_name}</h3>
                        <p className="text-sm text-gray-600">
                          {c.department} | {c.level} | {c.delivery_mode}
                        </p>
                        <p className="text-sm mt-1">
                          <span className="font-semibold">₹{c.tuition_fee_inr.toLocaleString()}</span> | 
                          <span className="ml-2">⭐ {c.rating}</span> | 
                          <span className="ml-2">{c.credits} credits</span> |
                          <span className="ml-2">{c.duration_weeks} weeks</span>
                        </p>
                      </div>
                      <button 
                        onClick={() => toggleSelect(c)}
                        className={`px-4 py-2 rounded text-white ${
                          selected.find(s => s.id === c.id) 
                            ? 'bg-red-500 hover:bg-red-600' 
                            : 'bg-green-500 hover:bg-green-600'
                        }`}>
                        {selected.find(s => s.id === c.id) ? 'Remove' : 'Add'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {courses.length === 0 && <p className="text-center text-gray-500">No courses found</p>}

              {pagination.totalPages > 1 && (
                <div className="flex justify-center gap-2 mt-6">
                  <button
                    disabled={pagination.page === 1}
                    onClick={() => fetchCourses(pagination.page - 1)}
                    className="px-4 py-2 bg-blue-600 text-white rounded disabled:bg-gray-300">
                    Previous
                  </button>
                  <span className="px-4 py-2">
                    Page {pagination.page} of {pagination.totalPages}
                  </span>
                  <button
                    disabled={pagination.page === pagination.totalPages}
                    onClick={() => fetchCourses(pagination.page + 1)}
                    className="px-4 py-2 bg-blue-600 text-white rounded disabled:bg-gray-300">
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {page === 'compare' && (
        <div className="p-6 max-w-7xl mx-auto">
          <h2 className="text-2xl font-bold mb-4">Compare Courses</h2>
          
          {compared.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 mb-4">No courses to compare. Select 2-4 courses from Search.</p>
              <button
                onClick={() => setPage('search')}
                className="bg-blue-600 text-white px-6 py-2 rounded">
                Go to Search
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full bg-white shadow rounded-lg">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="p-3 text-left font-bold">Feature</th>
                    {compared.map(c => (
                      <th key={c.id} className="p-3 text-left font-bold">{c.course_name}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-t">
                    <td className="p-3 font-semibold">Department</td>
                    {compared.map(c => <td key={c.id} className="p-3">{c.department}</td>)}
                  </tr>
                  <tr className="border-t bg-gray-50">
                    <td className="p-3 font-semibold">Level</td>
                    {compared.map(c => <td key={c.id} className="p-3">{c.level}</td>)}
                  </tr>
                  <tr className="border-t">
                    <td className="p-3 font-semibold">Delivery Mode</td>
                    {compared.map(c => <td key={c.id} className="p-3">{c.delivery_mode}</td>)}
                  </tr>
                  <tr className="border-t bg-gray-50">
                    <td className="p-3 font-semibold">Credits</td>
                    {compared.map(c => <td key={c.id} className="p-3">{c.credits}</td>)}
                  </tr>
                  <tr className="border-t">
                    <td className="p-3 font-semibold">Duration</td>
                    {compared.map(c => <td key={c.id} className="p-3">{c.duration_weeks} weeks</td>)}
                  </tr>
                  <tr className="border-t bg-gray-50">
                    <td className="p-3 font-semibold">Rating</td>
                    {compared.map(c => <td key={c.id} className="p-3">⭐ {c.rating}</td>)}
                  </tr>
                  <tr className="border-t">
                    <td className="p-3 font-semibold">Tuition Fee</td>
                    {compared.map(c => (
                      <td key={c.id} className="p-3">₹{c.tuition_fee_inr.toLocaleString()}</td>
                    ))}
                  </tr>
                  <tr className="border-t bg-gray-50">
                    <td className="p-3 font-semibold">Year</td>
                    {compared.map(c => <td key={c.id} className="p-3">{c.year_offered}</td>)}
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {page === 'ask' && (
        <div className="p-6 max-w-7xl mx-auto">
          <h2 className="text-2xl font-bold mb-4">Ask AI</h2>
          
          <div className="bg-white p-6 rounded-lg shadow mb-6">
            <p className="text-gray-600 mb-4">
              Try: "online CS courses under 50000" or "PG courses with rating above 4.5"
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && askAI()}
                placeholder="Ask about courses..."
                className="flex-1 border p-3 rounded"
              />
              <button
                onClick={askAI}
                className="bg-blue-600 text-white px-8 py-3 rounded hover:bg-blue-700">
                Ask
              </button>
            </div>
          </div>

          {parsedFilters && (
            <div className="bg-blue-50 p-4 rounded-lg mb-6">
              <h3 className="font-bold mb-2">Parsed Filters:</h3>
              <pre className="text-sm">{JSON.stringify(parsedFilters, null, 2)}</pre>
            </div>
          )}

          {loading ? (
            <p className="text-center">Processing...</p>
          ) : (
            <div className="grid gap-4">
              {courses.map(c => (
                <div key={c.id} className="bg-white p-4 rounded-lg shadow">
                  <h3 className="text-lg font-bold">{c.course_name}</h3>
                  <p className="text-sm text-gray-600">
                    {c.department} | {c.level} | {c.delivery_mode}
                  </p>
                  <p className="text-sm mt-1">
                    ₹{c.tuition_fee_inr.toLocaleString()} | ⭐ {c.rating} | {c.credits} credits
                  </p>
                </div>
              ))}
              {courses.length === 0 && parsedFilters && (
                <p className="text-center text-gray-500">No matching courses found</p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default App;