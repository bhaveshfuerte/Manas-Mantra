import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import AddCompany from './pages/company/AddCompany';
import AllCompany from './pages/company/AllCompany';
import EditCompany from './pages/company/EditCompany';
import AddUser from './pages/company/AddUser';
import AllUsers from './pages/company/AllUsers';
import AddFingerprint from './pages/fingerprint/AddFingerprint';
import AllFingerprints from './pages/fingerprint/AllFingerprints';
import ViewFingerprint from './pages/fingerprint/ViewFingerprint';
import AdminSettings from './pages/AdminSettings';

// Security Protocol: Force an absolute logout if the browser tab/app is completely closed and reopened.
// This prevents persistent tokens from automatically logging the next user into the dashboard.
if (!sessionStorage.getItem('session_active')) {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  sessionStorage.setItem('session_active', '1');
}

function App() {
  return (
    <Router>
      <Routes>
        {/* Public Routes without Sidebar */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Protected Routes with Sidebar via Layout */}
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="company/add-company" element={<AddCompany />} />
          <Route path="company/all-company" element={<AllCompany />} />
          <Route path="company/edit-company" element={<EditCompany />} />
          <Route path="company/add-user" element={<AddUser />} />
          <Route path="company/all-users" element={<AllUsers />} />

          <Route path="fingerprint/add" element={<AddFingerprint />} />
          <Route path="fingerprint/all" element={<AllFingerprints />} />
          <Route path="fingerprint/view/:id" element={<ViewFingerprint />} />
          <Route path="admin" element={<AdminSettings />} />
        </Route>

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
