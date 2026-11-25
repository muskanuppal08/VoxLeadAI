import { logger } from '../utils/logger.js';
import { v4 as uuidv4 } from 'uuid';

export class CalendarService {
  constructor() {
    // In-memory confirmed bookings store for demo
    this.confirmedBookings = [];
  }

  /**
   * Checks available meeting slots for a given date
   */
  async checkAvailability(dateStr) {
    logger.info(`Checking calendar availability for date: ${dateStr}`);
    
    // Simulate real working slots between 10:00 AM and 6:00 PM
    const availableSlots = [
      '11:00 AM IST',
      '02:00 PM IST',
      '03:30 PM IST',
      '05:00 PM IST'
    ];

    return {
      date: dateStr,
      timeZone: 'Asia/Kolkata (IST)',
      availableSlots: availableSlots,
      message: `We have 4 open demo slots on ${dateStr}: ${availableSlots.join(', ')}.`
    };
  }

  /**
   * Books a confirmed demo slot
   */
  async bookAppointment({ date, time, prospectName = 'Prospective Client', prospectEmail = 'lead@company.com', note = '' }) {
    logger.success(`Booking demo appointment: ${date} at ${time} for ${prospectName}`);

    const bookingId = `DEMO-${Date.now().toString().slice(-4)}`;
    const meetId = `${Math.random().toString(36).substring(2, 5)}-${Math.random().toString(36).substring(2, 6)}-${Math.random().toString(36).substring(2, 5)}`;
    const meetingLink = `https://meet.google.com/${meetId}`;

    const appointment = {
      id: uuidv4(),
      bookingId,
      prospectName,
      prospectEmail,
      date,
      time,
      meetingLink,
      status: 'confirmed',
      bookedAt: new Date().toISOString(),
      note: note || 'Demo call with Solutions Engineering',
    };

    this.confirmedBookings.unshift(appointment);

    return {
      success: true,
      bookingId,
      date,
      time,
      meetingLink,
      message: `Confirmed! Your demo has been scheduled for ${date} at ${time}. A Google Meet link (${meetingLink}) has been sent to your email.`
    };
  }

  getAppointments() {
    return this.confirmedBookings;
  }
}

export const calendarService = new CalendarService();
