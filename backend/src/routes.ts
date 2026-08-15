import { Router } from 'express';
import authRoutes from './modules/auth/auth.routes.js';
import userRoutes from './modules/users/user.routes.js';
import clientRoutes from './modules/clients/client.routes.js';
import invoiceRoutes from './modules/invoices/invoice.routes.js';
import billingRoutes from './modules/billing/billing.routes.js';
import uploadRoutes from './modules/uploads/upload.routes.js';

const router = Router();

router.use('/apitest',(req,res)=>{
    res.json({
        message: 'API Test',
        status: 'success',
        data: {
            name: 'John Doe',
            email: 'john.doe@example.com',
        },
    });
});

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/clients', clientRoutes);
router.use('/invoices', invoiceRoutes);
router.use('/billing', billingRoutes);
router.use('/uploads', uploadRoutes);

export default router;
