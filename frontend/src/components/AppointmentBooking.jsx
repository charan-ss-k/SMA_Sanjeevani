import React, { useState } from 'react';
import { playTTS } from '../utils/tts';

const AppointmentBooking = ({ doctor, onComplete, onBack, language }) => {
  const [bookingData, setBookingData] = useState({
    patient_name: '',
    appointment_date: '',
    appointment_time: '',
    symptoms_brief: '',
    phone_number: '',
    email: '',
    notes: ''
  });
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setBookingData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleBookAppointment = async () => {
    // Validate required fields
    if (!bookingData.patient_name || !bookingData.appointment_date || 
        !bookingData.appointment_time || !bookingData.phone_number || !bookingData.email) {
      alert('Please fill all required fields');
      return;
    }

    setLoading(true);
    try {
      const apiBase = window.__API_BASE__ || 'http://localhost:8000';
      const response = await fetch(`${apiBase}/api/appointments/book`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...bookingData,
          doctor_id: doctor.employee_id
        })
      });

      const data = await response.json();
      
      if (data.success) {
        setSuccessMessage(data.message);
        playTTS(`Appointment booked successfully with ${doctor.doctor_name}`, language);
        
        // Save appointment to local storage
        const appointments = JSON.parse(localStorage.getItem('userAppointments') || '[]');
        appointments.push({
          ...data.appointment,
          booking_date: new Date().toISOString()
        });
        localStorage.setItem('userAppointments', JSON.stringify(appointments));
        
        setTimeout(() => {
          onComplete();
        }, 2000);
      }
    } catch (error) {
      console.error('Error booking appointment:', error);
      alert('Error booking appointment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="appointment-booking-section">
      <div className="booking-header">
        <h2>📅 Book Appointment</h2>
        <button onClick={onBack} className="back-btn">
          ← Back
        </button>
      </div>

      {successMessage && (
        <div className="success-message">
          <p>✅ {successMessage}</p>
        </div>
      )}

      <div className="booking-container">
        {/* Doctor Info */}
        <div className="doctor-info-card">
          <div className="doctor-info-header">
            <h3>{doctor.doctor_name}</h3>
            <span className="specialization">{doctor.specialization}</span>
          </div>
          <div className="doctor-info-details">
            <p><strong>🏥 Hospital:</strong> {doctor.hospital_name}</p>
            <p><strong>📍 Location:</strong> {doctor.locality}, {doctor.city}</p>
            <p><strong>📧 Email:</strong> {doctor.email_address}</p>
            <p><strong>📞 Phone:</strong> {doctor.phone_number}</p>
          </div>
        </div>

        {/* Booking Form */}
        <div className="booking-form">
          <h3>Patient Details</h3>

          <div className="form-group">
            <label>👤 Patient Name (Required) *</label>
            <input
              type="text"
              name="patient_name"
              value={bookingData.patient_name}
              onChange={handleInputChange}
              placeholder="Enter your full name"
              className="form-input"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>📅 Appointment Date (Required) *</label>
              <input
                type="date"
                name="appointment_date"
                value={bookingData.appointment_date}
                onChange={handleInputChange}
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label>⏰ Appointment Time (Required) *</label>
              <input
                type="time"
                name="appointment_time"
                value={bookingData.appointment_time}
                onChange={handleInputChange}
                className="form-input"
              />
            </div>
          </div>

          <div className="form-group">
            <label>🩺 Symptoms Brief (Required) *</label>
            <textarea
              name="symptoms_brief"
              value={bookingData.symptoms_brief}
              onChange={handleInputChange}
              placeholder="Briefly describe your symptoms"
              rows="3"
              className="form-textarea"
            />
          </div>

          <div className="form-group">
            <label>📞 Phone Number (Required) *</label>
            <input
              type="tel"
              name="phone_number"
              value={bookingData.phone_number}
              onChange={handleInputChange}
              placeholder="Enter your phone number"
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label>📧 Email (Required) *</label>
            <input
              type="email"
              name="email"
              value={bookingData.email}
              onChange={handleInputChange}
              placeholder="Enter your email"
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label>📝 Additional Notes (Optional)</label>
            <textarea
              name="notes"
              value={bookingData.notes}
              onChange={handleInputChange}
              placeholder="Any additional information..."
              rows="2"
              className="form-textarea"
            />
          </div>

          <button
            onClick={handleBookAppointment}
            disabled={loading}
            className="book-appointment-btn"
          >
            {loading ? '⏳ Booking...' : '✅ Confirm Appointment'}
          </button>
        </div>
      </div>

      <style jsx>{`
        .appointment-booking-section {
          padding: 20px;
          max-width: 1000px;
          margin: 0 auto;
        }

        .booking-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 30px;
          border-bottom: 2px solid #e0e0e0;
          padding-bottom: 15px;
        }

        .booking-header h2 {
          font-size: 1.8rem;
          color: #2e7d32;
          margin: 0;
        }

        .back-btn {
          padding: 10px 20px;
          background: #f5f5f5;
          border: 1px solid #ddd;
          border-radius: 5px;
          cursor: pointer;
          font-weight: 600;
          transition: all 0.3s ease;
        }

        .back-btn:hover {
          background: #f1f8e9;
          border-color: #2e7d32;
          color: #2e7d32;
        }

        .success-message {
          background: #c8e6c9;
          border: 2px solid #4caf50;
          border-radius: 8px;
          padding: 15px;
          margin-bottom: 20px;
          color: #2e7d32;
          font-weight: 600;
          text-align: center;
        }

        .booking-container {
          display: grid;
          grid-template-columns: 1fr 2fr;
          gap: 30px;
          margin-bottom: 30px;
        }

        .doctor-info-card {
          background: white;
          border: 2px solid #2e7d32;
          border-radius: 10px;
          padding: 20px;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
          height: fit-content;
          position: sticky;
          top: 20px;
        }

        .doctor-info-header {
          border-bottom: 2px solid #e0e0e0;
          padding-bottom: 15px;
          margin-bottom: 15px;
        }

        .doctor-info-header h3 {
          margin: 0 0 8px 0;
          font-size: 1.4rem;
          color: #333;
        }

        .specialization {
          display: inline-block;
          background: linear-gradient(135deg, #2e7d32 0%, #1b5e20 100%);
          color: white;
          padding: 5px 12px;
          border-radius: 20px;
          font-size: 0.85rem;
          font-weight: 600;
        }

        .doctor-info-details p {
          margin: 10px 0;
          color: #666;
          font-size: 0.9rem;
        }

        .booking-form {
          background: white;
          border: 1px solid #ddd;
          border-radius: 10px;
          padding: 25px;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
        }

        .booking-form h3 {
          font-size: 1.3rem;
          color: #333;
          margin: 0 0 20px 0;
          border-bottom: 2px solid #e0e0e0;
          padding-bottom: 10px;
        }

        .form-group {
          margin-bottom: 20px;
        }

        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
        }

        .form-group label {
          display: block;
          font-weight: 600;
          color: #333;
          margin-bottom: 8px;
          font-size: 0.95rem;
        }

        .form-input,
        .form-textarea {
          width: 100%;
          padding: 12px;
          border: 1px solid #ddd;
          border-radius: 6px;
          font-size: 0.95rem;
          font-family: inherit;
          transition: all 0.3s ease;
          box-sizing: border-box;
        }

        .form-input:focus,
        .form-textarea:focus {
          outline: none;
          border-color: #2e7d32;
          box-shadow: 0 0 0 3px rgba(46, 125, 50, 0.1);
        }

        .form-textarea {
          resize: vertical;
          min-height: 100px;
        }

        .book-appointment-btn {
          width: 100%;
          padding: 14px;
          background: linear-gradient(135deg, #4caf50 0%, #388e3c 100%);
          color: white;
          border: none;
          border-radius: 6px;
          font-size: 1rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.3s ease;
          margin-top: 10px;
        }

        .book-appointment-btn:hover:not(:disabled) {
          background: linear-gradient(135deg, #388e3c 0%, #2e7d32 100%);
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(76, 175, 80, 0.4);
        }

        .book-appointment-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        @media (max-width: 768px) {
          .booking-container {
            grid-template-columns: 1fr;
          }

          .doctor-info-card {
            position: relative;
            top: 0;
          }

          .form-row {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};

export default AppointmentBooking;
