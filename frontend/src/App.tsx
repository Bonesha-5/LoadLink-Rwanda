import { Routes, Route, Navigate } from 'react-router-dom'
import Home from './pages/Home'
import ShipperLayout from './components/ShipperLayout'
import CompanyLayout from './components/CompanyLayout'
import Layout from './components/Layout'
import Loads from './pages/Loads'
import Trucks from './pages/Trucks'
import Login from './pages/Login'
import Register from './pages/Register'
import Profile from './pages/Profile'
import PostShipment from './pages/PostShipment'
import Shipment from './pages/Shipment'
import CompanyDashboard from './pages/CompanyDashboard'
import CompanyTrucks from './pages/CompanyTrucks'
import CompanyShipments from './pages/CompanyShipments'
import ProtectedRoute from './components/ProtectedRoute'
import ShipperInterestedTrucks from './pages/ShipperInterestedTrucks'
import ShipperPayments from './pages/ShipperPayments'
import ShipperRatings from './pages/ShipperRatings'
import DeliveryConfirmation from './pages/DeliveryConfirmation'
import PaymentsHistory from './pages/PaymentsHistory'

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
        <Route path="shipment/:id/trucks" element={<ShipperInterestedTrucks />} />
        <Route path="shipment/:id/pay" element={<ShipperPayments />} />
        <Route path="shipment/:id/confirm" element={<DeliveryConfirmation />} />
        <Route path="shipment/:id/rate" element={<ShipperRatings />} />
        <Route path="payments" element={<PaymentsHistory />} />
      </Route>
      <Route element={<ProtectedRoute role="company"><CompanyLayout /></ProtectedRoute>}>
        <Route path="company/dashboard" element={<CompanyDashboard />} />
        <Route path="company/trucks" element={<CompanyTrucks />} />
        <Route path="company/shipments" element={<CompanyShipments />} />
      </Route>
      <Route element={<Layout />}>
        <Route path="trucks" element={<Trucks />} />
        <Route path="shipment/:id" element={<Shipment />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
