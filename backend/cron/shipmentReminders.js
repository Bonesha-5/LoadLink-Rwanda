import cron from 'node-cron';
import pool from '../config/db.js';
import { sendEmail } from '../utils/emailService.js';

export const initShipmentReminders = () => {
  // Run every hour
  cron.schedule('0 * * * *', async () => {
    console.log('[Cron] Running shipment reminders check...');

    try {
      // Find shipments in AWAITING_CONFIRMATION where delivered_at is between 20 and 21 hours ago
      const query = `
        SELECT s.id, s.pickup_district, s.dropoff_district, u.name as shipper_name, u.email as shipper_email
        FROM shipments s
        JOIN users u ON s.shipper_id = u.id
        WHERE s.status = 'AWAITING_CONFIRMATION'
          AND s.delivered_at <= NOW() - INTERVAL '20 hours'
          AND s.delivered_at > NOW() - INTERVAL '21 hours'
      `;

      const result = await pool.query(query);
      const shipments = result.rows;

      if (shipments.length === 0) {
        return;
      }

      for (const shipment of shipments) {
          await sendEmail(
              shipment.shipper_email,
              'Action needed — confirm your delivery or raise a dispute',
              'reminder',
              {
                  shipper_name: shipment.shipper_name,
                  shipment_id: shipment.id,
                  pickup_district: shipment.pickup_district,
                  dropoff_district: shipment.dropoff_district,
                  login_url: process.env.FRONTEND_URL || 'http://localhost:5173'
              }
          );
      }
    } catch (error) {
      console.error('[Cron] Error in shipment reminders:', error.message);
    }
  });
};
