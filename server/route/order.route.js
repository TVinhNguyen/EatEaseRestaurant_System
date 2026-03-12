// order.route.js - Deprecated
// Chức năng order cũ đã được thay thế bởi:
// - /api/table-order  (tableOrder.route.js)
// - /api/kitchen      (kitchen.route.js)
// File này được giữ lại để tránh lỗi nếu có import cũ.

import { Router } from 'express';
const orderRouter = Router();

// Endpoint thông báo chuyển hướng
orderRouter.all('*', (req, res) => {
    res.status(410).json({
        success: false,
        message: 'Endpoint này đã ngừng hoạt động. Vui lòng sử dụng /api/table-order thay thế.',
    });
});

export default orderRouter;