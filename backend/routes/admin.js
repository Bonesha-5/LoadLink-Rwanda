import express from 'express';
import {
    getPendingCompanies,
    getCompanyDocs,
    approveCompany,
    rejectCompany,
    getAllShipments,
    getDisputes,
    suspendUser,
    reinstateUser,
    getAuditLog
} from '../controllers/adminController.js';
import { verifyToken, requiredRole } from '../middleware/auth.js';

const router = express.Router();

router.get('/companies/pending', verifyToken, requiredRole('ADMIN'), getPendingCompanies);
router.get('/companies/:id/docs', verifyToken, requiredRole('ADMIN'), getCompanyDocs);
router.patch('/companies/:id/approve', verifyToken, requiredRole('ADMIN'), approveCompany);
router.patch('/companies/:id/reject', verifyToken, requiredRole('ADMIN'), rejectCompany);
router.get('/shipments', verifyToken, requiredRole('ADMIN'), getAllShipments);
router.get('/disputes', verifyToken, requiredRole('ADMIN'), getDisputes);
router.patch('/users/:id/suspend', verifyToken, requiredRole('ADMIN'), suspendUser);
router.patch('/users/:id/reinstate', verifyToken, requiredRole('ADMIN'), reinstateUser);
router.get('/audit', verifyToken, requiredRole('ADMIN'), getAuditLog);

export default router;