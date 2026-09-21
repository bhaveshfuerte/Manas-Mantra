import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import RequirePermission from './components/RequirePermission';
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
import EditFingerprint from './pages/fingerprint/EditFingerprint';
import AdminSettings from './pages/AdminSettings';

function App() {
  return (
    <Router>
      <Routes>
        {/* Public Routes without Sidebar */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Protected Routes with Sidebar via Layout */}
        <Route path="/" element={<Layout />}>
          <Route index element={<RequirePermission modules="dashboard"><Dashboard /></RequirePermission>} />
          <Route path="company/add-company" element={<RequirePermission modules="add-company"><AddCompany /></RequirePermission>} />
          <Route path="company/all-company" element={<RequirePermission modules="all-company"><AllCompany /></RequirePermission>} />
          <Route path="company/edit-company" element={<RequirePermission modules="all-company"><EditCompany /></RequirePermission>} />
          <Route path="company/add-user" element={<RequirePermission modules="add-user"><AddUser /></RequirePermission>} />
          <Route path="company/all-users" element={<RequirePermission modules="all-users"><AllUsers /></RequirePermission>} />

          <Route path="fingerprint/add" element={<RequirePermission modules="add-fingerprint"><AddFingerprint /></RequirePermission>} />
          <Route path="fingerprint/all" element={<RequirePermission modules="all-fingerprints"><AllFingerprints /></RequirePermission>} />
          <Route path="fingerprint/view/:id" element={<RequirePermission modules="all-fingerprints"><ViewFingerprint /></RequirePermission>} />
          <Route path="fingerprint/edit/:id" element={<RequirePermission modules="all-fingerprints"><EditFingerprint /></RequirePermission>} />
          <Route path="admin" element={<RequirePermission requireSuperAdmin><AdminSettings /></RequirePermission>} />
        </Route>

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
