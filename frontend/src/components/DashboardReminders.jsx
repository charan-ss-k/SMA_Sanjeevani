import React, { useState, useEffect } from 'react';
import { playTTS } from '../utils/tts';

const DashboardReminders = ({ language = 'en' }) => {
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReminders();
  }, []);

  const loadReminders = () => {
    try {
      const savedAppointments = JSON.parse(localStorage.getItem('userAppointments') || '[]');
      const upcomingAppointments = savedAppointments.filter(apt => {
        const aptDate = new Date(apt.appointment_date);
        return aptDate >= new Date();
      });

      const appointmentReminders = upcomingAppointments.map(apt => {
        const aptDate = new Date(apt.appointment_date);
        const daysUntil = Math.ceil((aptDate - new Date()) / (1000 * 60 * 60 * 24));
        return {
          id: apt.doctor_id,
          type: 'appointment',
          title: `Appointment with ${apt.doctor_name}`,
          description: `Your appointment is in ${daysUntil} day${daysUntil !== 1 ? 's' : ''}`,
          date: apt.appointment_date,
          status: daysUntil <= 1 ? 'urgent' : daysUntil <= 3 ? 'upcoming' : 'normal'
        };
      });

      setReminders(appointmentReminders);
    } catch (error) {
      console.error('Error loading reminders:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div style={{ padding: '20px', textAlign: 'center' }}>Loading reminders...</div>;
  }

  return (
    <div className="reminders-section">
      <h2>🔔 Your Reminders</h2>
      {reminders.length === 0 ? (
        <div className="empty-state">
          <p>No reminders yet. Book an appointment to receive reminders!</p>
        </div>
      ) : (
        <div className="reminders-list">
          {reminders.map((reminder, idx) => (
            <div key={idx} className={`reminder-item status-${reminder.status}`}>
              <div className="reminder-icon">
                {reminder.status === 'urgent' ? '🔴' : reminder.status === 'upcoming' ? '🟡' : '🟢'}
              </div>
              <div className="reminder-details">
                <h4>{reminder.title}</h4>
                <p>{reminder.description}</p>
                <small>📅 {new Date(reminder.date).toLocaleDateString()}</small>
              </div>
              <div className="reminder-badge">
                {reminder.status === 'urgent' ? 'URGENT' : reminder.status === 'upcoming' ? 'SOON' : 'NORMAL'}
              </div>
            </div>
          ))}
        </div>
      )}

      <style jsx>{`
        .reminders-section h2 {
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

        .reminders-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .reminder-item {
          display: flex;
          gap: 15px;
          padding: 15px;
          border-radius: 8px;
          border-left: 4px solid #ddd;
          background: #f9f9f9;
        }

        .reminder-item.status-urgent {
          border-left-color: #dc3545;
          background: #ffe5e5;
        }

        .reminder-item.status-upcoming {
          border-left-color: #ffc107;
          background: #fff9e6;
        }

        .reminder-item.status-normal {
          border-left-color: #28a745;
          background: #e8f5e9;
        }

        .reminder-icon {
          font-size: 1.5rem;
          min-width: 30px;
          text-align: center;
        }

        .reminder-details {
          flex: 1;
        }

        .reminder-details h4 {
          margin: 0 0 5px 0;
          color: #333;
          font-size: 1rem;
        }

        .reminder-details p {
          margin: 0 0 5px 0;
          color: #666;
          font-size: 0.9rem;
        }

        .reminder-details small {
          color: #999;
        }

        .reminder-badge {
          font-size: 0.75rem;
          font-weight: 700;
          padding: 6px 10px;
          border-radius: 4px;
          background: white;
          align-self: center;
          min-width: 60px;
          text-align: center;
        }

        .reminder-item.status-urgent .reminder-badge {
          color: #dc3545;
        }

        .reminder-item.status-upcoming .reminder-badge {
          color: #ffc107;
        }

        .reminder-item.status-normal .reminder-badge {
          color: #28a745;
        }

        @media (max-width: 768px) {
          .reminder-item {
            flex-wrap: wrap;
          }

          .reminder-badge {
            width: 100%;
            margin-top: 10px;
          }
        }
      `}</style>
    </div>
  );
};

export default DashboardReminders;
