import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import AddCompany from './pages/company/AddCompany';
import AddUser from './pages/company/AddUser';
import AllCompany from './pages/company/AllCompany';
import AllUsers from './pages/company/AllUsers';
import AddFingerprint from './pages/fingerprint/AddFingerprint';
import AllFingerprints from './pages/fingerprint/AllFingerprints';

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
          <Route path="company/add-user" element={<AddUser />} />
          <Route path="company/all-company" element={<AllCompany />} />
          <Route path="company/all-users" element={<AllUsers />} />

          <Route path="fingerprint/add" element={<AddFingerprint />} />
          <Route path="fingerprint/all" element={<AllFingerprints />} />
        </Route>

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
