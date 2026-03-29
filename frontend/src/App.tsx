import { Routes, Route, Navigate } from 'react-router-dom'
import Home from './pages/Home'
import CompanyLayout from './components/CompanyLayout'
import ShipperLayout from './components/ShipperLayout'
import Layout from './components/Layout'
import Login from './pages/Login'
import Register from './pages/Register'
import Shipment from './pages/Shipment'
import Profile from './pages/Profile'
import PostShipment from './pages/PostShipment'
import Loads from './pages/Loads'
import CompanyDashboard from './pages/CompanyDashboard'
import CompanyTrucks from './pages/CompanyTrucks'
import CompanyShipments from './pages/CompanyShipments'
import CompanyActiveShipments from './pages/CompanyActiveShipments'
import ProtectedRoute from './components/ProtectedRoute'
import ShipperInterestedTrucks from './pages/ShipperInterestedTrucks'
import ShipperPayments from './pages/ShipperPayments'
import ShipperRatings from './pages/ShipperRatings'
import DeliveryConfirmation from './pages/DeliveryConfirmation'
import PaymentsHistory from './pages/PaymentsHistory'
import AdminLayout from './components/AdminLayout'
import AdminCompanyVerification from './pages/AdminCompanyVerification'
import AdminShipmentMonitoring from './pages/AdminShipmentMonitoring'
import AdminDisputes from './pages/AdminDisputes'
import AdminAuditLog from './pages/AdminAuditLog'
import AdminUsers from './pages/AdminUsers'
import AdminAnalytics from './pages/AdminAnalytics'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="login" element={<Navigate to="/login/shipper" replace />} />
      <Route path="login/:role" element={<Login />} />
      <Route path="register" element={<Navigate to="/register/shipper" replace />} />
      <Route path="register/:role" element={<Register />} />
      <Route element={<ProtectedRoute role="shipper"><ShipperLayout /></ProtectedRoute>}>
        <Route path="profile" element={<Profile />} />
        <Route path="post-shipment" element={<PostShipment />} />
        <Route path="loads" element={<Loads />} />
        <Route path="interested-trucks" element={<ShipperInterestedTrucks />} />
        <Route path="shipment/:id/trucks" element={<ShipperInterestedTrucks />} />
        <Route path="shipment/:id/pay" element={<ShipperPayments />} />
        <Route path="shipment/:id/confirm" element={<DeliveryConfirmation />} />
        <Route path="shipment/:id/rate" element={<ShipperRatings />} />
        <Route path="ratings" element={<ShipperRatings />} />
        <Route path="payments" element={<PaymentsHistory />} />
      </Route>
      <Route element={<ProtectedRoute role="company"><CompanyLayout /></ProtectedRoute>}>
        <Route path="company/dashboard" element={<CompanyDashboard />} />
        <Route path="company/trucks" element={<CompanyTrucks />} />
        <Route path="company/shipments" element={<CompanyShipments />} />
        <Route path="company/active-shipments" element={<CompanyActiveShipments />} />
      </Route>
      <Route element={<ProtectedRoute role="admin"><AdminLayout /></ProtectedRoute>}>
        <Route path="admin/overview" element={<AdminAnalytics />} />
        <Route path="admin/companies" element={<AdminCompanyVerification />} />
        <Route path="admin/shipments" element={<AdminShipmentMonitoring />} />
        <Route path="admin/disputes" element={<AdminDisputes />} />
        <Route path="admin/audit-log" element={<AdminAuditLog />} />
        <Route path="admin/users" element={<AdminUsers />} />
      </Route>
      <Route element={<Layout />}>
        <Route path="about" element={<Navigate to="/" replace />} />
        <Route path="trucks" element={<Navigate to="/" replace />} />
        <Route path="shipment/:id" element={<Shipment />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
