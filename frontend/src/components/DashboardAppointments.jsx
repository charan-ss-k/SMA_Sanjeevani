import React, { useState, useEffect } from 'react';
import { playTTS } from '../utils/tts';

const DashboardAppointments = ({ language = 'en' }) => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAppointments();
  }, []);

  const loadAppointments = () => {
    try {
      const savedAppointments = JSON.parse(localStorage.getItem('userAppointments') || '[]');
      const upcomingAppointments = savedAppointments.filter(apt => {
        const aptDate = new Date(apt.appointment_date);
        return aptDate >= new Date();
      });
      setAppointments(upcomingAppointments.sort((a, b) => 
        new Date(a.appointment_date) - new Date(b.appointment_date)
      ));
    } catch (error) {
      console.error('Error loading appointments:', error);
    } finally {
      setLoading(false);
    }
  };

  const cancelAppointment = (appointmentId) => {
    if (window.confirm('Are you sure you want to cancel this appointment?')) {
      const updated = appointments.filter(apt => apt.doctor_id !== appointmentId);
      setAppointments(updated);
      
      const allAppointments = JSON.parse(localStorage.getItem('userAppointments') || '[]');
      const filtered = allAppointments.filter(apt => apt.doctor_id !== appointmentId);
      localStorage.setItem('userAppointments', JSON.stringify(filtered));

      playTTS('Appointment cancelled', language);
    }
  };

  const rescheduleAppointment = (appointment) => {
    const newDate = prompt('Enter new appointment date (YYYY-MM-DD):');
    if (newDate) {
      const updated = appointments.map(apt => 
        apt.doctor_id === appointment.doctor_id 
          ? { ...apt, appointment_date: newDate }
          : apt
      );
      setAppointments(updated);

      const allAppointments = JSON.parse(localStorage.getItem('userAppointments') || '[]');
      const updatedAll = allAppointments.map(apt =>
        apt.doctor_id === appointment.doctor_id
          ? { ...apt, appointment_date: newDate }
          : apt
      );
      localStorage.setItem('userAppointments', JSON.stringify(updatedAll));

      playTTS('Appointment rescheduled successfully', language);
    }
  };

  if (loading) {
    return <div style={{ padding: '20px', textAlign: 'center' }}>Loading appointments...</div>;
  }

  return (
    <div className="appointments-section">
      <h2>📅 Your Appointments</h2>
      {appointments.length === 0 ? (
        <div className="empty-state">
          <p>No upcoming appointments. Book one to get started!</p>
        </div>
      ) : (
        <div className="appointments-grid">
          {appointments.map((apt, idx) => {
            const aptDate = new Date(apt.appointment_date);
            const daysUntil = Math.ceil((aptDate - new Date()) / (1000 * 60 * 60 * 24));
            
            return (
              <div key={idx} className="appointment-card">
                <div className="apt-status">
                  {daysUntil <= 1 ? '🔴 Urgent' : daysUntil <= 3 ? '🟡 Soon' : '🟢 Upcoming'}
                </div>
                
                <div className="apt-doctor">
                  <h3>🩺 {apt.doctor_name}</h3>
                  <p className="apt-spec">{apt.specialization}</p>
                </div>

                <div className="apt-details">
                  <div className="apt-item">
                    <span className="apt-label">🏥</span> {apt.hospital_name}
                  </div>
                  <div className="apt-item">
                    <span className="apt-label">📅</span> {new Date(apt.appointment_date).toLocaleDateString()}
                  </div>
                  <div className="apt-item">
                    <span className="apt-label">⏰</span> {apt.appointment_time}
                  </div>
                </div>

                <div className="apt-actions">
                  <button
                    className="apt-btn reschedule"
                    onClick={() => rescheduleAppointment(apt)}
                  >
                    Reschedule
                  </button>
                  <button
                    className="apt-btn cancel"
                    onClick={() => cancelAppointment(apt.doctor_id)}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <style jsx>{`
        .appointments-section h2 {
          margin: 0 0 20px 0;
          color: #333;
          border-bottom: 2px solid #e0e0e0;
          padding-bottom: 10px;
        }

        .empty-state {
          text-align: center;
          padding: 40px 20px;
          color: #999;
          background: #f9f9f9;
          border-radius: 8px;
        }

        .appointments-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 20px;
        }

        .appointment-card {
          border: 1px solid #ddd;
          border-radius: 10px;
          padding: 20px;
          background: white;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          transition: all 0.3s ease;
        }

        .appointment-card:hover {
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
          transform: translateY(-2px);
        }

        .apt-status {
          font-weight: 600;
          margin-bottom: 10px;
          font-size: 0.9rem;
        }

        .apt-doctor h3 {
          margin: 0 0 5px 0;
          color: #333;
          font-size: 1.1rem;
        }

        .apt-spec {
          color: #666;
          font-size: 0.85rem;
          margin: 0;
        }

        .apt-details {
          margin: 15px 0;
          padding: 15px 0;
          border-top: 1px solid #eee;
          border-bottom: 1px solid #eee;
        }

        .apt-item {
          margin: 8px 0;
          font-size: 0.9rem;
          color: #666;
        }

        .apt-label {
          font-weight: 600;
          margin-right: 8px;
        }

        .apt-actions {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
          margin-top: 15px;
        }

        .apt-btn {
          padding: 10px;
          border: none;
          border-radius: 5px;
          cursor: pointer;
          font-weight: 600;
          transition: all 0.3s ease;
          font-size: 0.85rem;
        }

        .apt-btn.reschedule {
          background: #1976d2;
          color: white;
        }

        .apt-btn.reschedule:hover {
          background: #1565c0;
        }

        .apt-btn.cancel {
          background: #ffebee;
          color: #dc3545;
        }

        .apt-btn.cancel:hover {
          background: #ffcdd2;
        }

        @media (max-width: 768px) {
          .appointments-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};

export default DashboardAppointments;
