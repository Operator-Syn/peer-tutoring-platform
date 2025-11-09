import React, { useState, useEffect } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import './AdminDashboard.css';
import BasicCard from '../HomePageCard/HomePageCard';

const AdminDashboard = () => {
  const [statistics, setStatistics] = useState({
    total_applications: 0,
    pending: 0,
    total_tutors: 0,
    total_tutees: 0,
    total_courses: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [processingId, setProcessingId] = useState(null);

  const API_BASE_URL = 'http://127.0.0.1:5000/api/tutor-applications';

  useEffect(() => {
    fetchData();
  }, []);


  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [appsResponse, statsResponse] = await Promise.all([
        fetch(`${API_BASE_URL}/admin/applications`),
        fetch(`${API_BASE_URL}/admin/statistics`)
      ]);

      if (!appsResponse.ok || !statsResponse.ok) {
        throw new Error('Failed to fetch data');
      }

      const appsData = await appsResponse.json();
      const statsData = await statsResponse.json();

      console.log('Applications:', appsData);
      console.log('Statistics:', statsData);

      if (appsData.applications && Array.isArray(appsData.applications)) {
        setApplications(appsData.applications);
      }

      if (statsData.statistics) {
        setStatistics(statsData.statistics);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load data. Using mock data for display.');
      setApplications(getMockApplications());
      setStatistics(getMockStatistics());
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const statsCards = [
    { key: "total_tutors", title: statistics.total_tutors || 0, description: "Number of Tutors", style: { backgroundColor: "#fff" } },
    { key: "total_applications", title: statistics.total_applications || 0, description: "Number of Applications", style: { backgroundColor: "#fff" } },
    { key: "total_tutees", title: statistics.total_tutees || 0, description: "Number of Tutees", style: { backgroundColor: "#fff" } },
    { key: "total_courses", title: statistics.total_courses || 0, description: "Total Courses", style: { backgroundColor: "#fff" } },
    { key: "active_sessions", title: statistics.active_sessions || 0, description: "Active Sessions", style: { backgroundColor: "#fff" } },
  ];

  if (loading) {
    return (
      <div className="admin-container">
        <div className="loading-state">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-container">
      <header className="admin-header">
        <div className="header-content">
          <div className="logo-section">
            <div className="logo-circle">
              <i className="bi bi-mortarboard-fill"></i>
            </div>
          </div>
          <nav className="header-nav">
            <a href="/" className="nav-link">Home</a>
            <a href="/about" className="nav-link">About</a>
            <a href="/events" className="nav-link">Events</a>
            <a href="/messages" className="nav-link">Messages</a>
            <a href="/reports" className="nav-link">Reports</a>
          </nav>
          <div className="user-section">
            <div className="user-avatar">
              <i className="bi bi-person-circle"></i>
            </div>
          </div>
        </div>
      </header>

      <div className="dashboard-content">
        <div className="page-title">
          <h1>Admin Dashboard</h1>
        </div>

        {error && (
          <div className="alert alert-warning alert-dismissible fade show" role="alert">
            <i className="bi bi-exclamation-triangle me-2"></i>
            {error}
            <button type="button" className="btn-close" onClick={() => setError(null)}></button>
          </div>
        )}

        <div className="applications-list">
        </div>

        <div className="statistics-grid">
          {statsCards.map(card => (
            <BasicCard
              key={card.key}
              title={String(card.title)}
              description={card.description}
              style={{ width: "240px", height: "140px", ...card.style }}
            />
          ))}
        </div>
      </div>
    </div>
  );
};


export default AdminDashboard;