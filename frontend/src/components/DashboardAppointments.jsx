import React, { useState, useEffect, useContext } from 'react';
import { playTTS } from '../utils/tts';
import { LanguageContext } from '../main';
import { t } from '../utils/translations';

const DashboardAppointments = ({ language = 'en' }) => {
  const { language: contextLanguage } = useContext(LanguageContext);
  const activeLanguage = contextLanguage || language;
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingAppointment, setEditingAppointment] = useState(null);
  const [editDate, setEditDate] = useState('');
  const [editTime, setEditTime] = useState('');
  const [editNotes, setEditNotes] = useState('');

  useEffect(() => {
    loadAppointments();
  }, []);

  const loadAppointments = async () => {
    try {
      const apiBase = window.__API_BASE__ || 'http://localhost:8000';
      const token = localStorage.getItem('access_token');
      
      // Try to fetch from API first
      const response = await fetch(`${apiBase}/api/appointments/upcoming-appointments`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setAppointments(data.appointments || []);
      } else {
        // Fallback to localStorage if API fails
        const savedAppointments = JSON.parse(localStorage.getItem('userAppointments') || '[]');
        const upcomingAppointments = savedAppointments.filter(apt => {
          const aptDate = new Date(apt.appointment_date);
          return aptDate >= new Date();
        });
        setAppointments(upcomingAppointments.sort((a, b) => 
          new Date(a.appointment_date) - new Date(b.appointment_date)
        ));
      }
    } catch (error) {
      console.error('Error loading appointments:', error);
      // Fallback to localStorage
      try {
        const savedAppointments = JSON.parse(localStorage.getItem('userAppointments') || '[]');
        const upcomingAppointments = savedAppointments.filter(apt => {
          const aptDate = new Date(apt.appointment_date);
          return aptDate >= new Date();
        });
        setAppointments(upcomingAppointments.sort((a, b) => 
          new Date(a.appointment_date) - new Date(b.appointment_date)
        ));
      } catch (e) {
        console.error('Error loading from localStorage:', e);
      }
    } finally {
      setLoading(false);
    }
  };

  const cancelAppointment = async (appointment) => {
    if (window.confirm(`Are you sure you want to cancel the appointment with Dr. ${appointment.doctor_name} on ${new Date(appointment.appointment_date).toLocaleDateString()}?`)) {
      try {
        const apiBase = window.__API_BASE__ || 'http://localhost:8000';
        const token = localStorage.getItem('access_token');
        
        console.log('🗑️ Cancelling appointment:', appointment.id);
        
        const response = await fetch(`${apiBase}/api/appointments/appointment/${appointment.id}`, {
          method: 'DELETE',
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        const data = await response.json();
        console.log('📤 Cancel response:', response.status, data);
        
        if (response.ok) {
          // Remove from state
          const updated = appointments.filter(apt => apt.id !== appointment.id);
          setAppointments(updated);
          
          // Also remove from localStorage if it exists there
          const allAppointments = JSON.parse(localStorage.getItem('userAppointments') || '[]');
          const filtered = allAppointments.filter(apt => apt.id !== appointment.id && apt.doctor_id !== appointment.doctor_id);
          localStorage.setItem('userAppointments', JSON.stringify(filtered));
          
          playTTS(`Appointment with ${appointment.doctor_name} has been cancelled`, language);
          console.log('✅ Appointment cancelled successfully');
        } else {
          const errorMsg = data.detail || 'Failed to cancel appointment';
          throw new Error(errorMsg);
        }
      } catch (error) {
        console.error('❌ Error cancelling appointment:', error);
        playTTS(`Error: ${error.message}`, language);
        alert(`Failed to cancel appointment: ${error.message}`);
      }
    }
  };

  const rescheduleAppointment = (appointment) => {
    // Open edit modal
    setEditingAppointment(appointment);
    
    // Parse current date and time
    const aptDate = new Date(appointment.appointment_date);
    const dateStr = aptDate.toISOString().split('T')[0]; // YYYY-MM-DD
    setEditDate(dateStr);
    setEditTime(appointment.appointment_time || '');
    setEditNotes(appointment.notes || '');
  };

  const handleSaveEdit = async () => {
    if (!editingAppointment) return;
    
    if (!editDate || !editTime) {
      alert('Please provide both date and time');
      return;
    }

    try {
      const apiBase = window.__API_BASE__ || 'http://localhost:8000';
      const token = localStorage.getItem('access_token');
      
      console.log('✏️ Updating appointment:', editingAppointment.id);
      
      const response = await fetch(`${apiBase}/api/appointments/appointment/${editingAppointment.id}`, {
        method: 'PUT',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          appointment_date: editDate,
          appointment_time: editTime,
          notes: editNotes
        })
      });
      
      const data = await response.json();
      console.log('📤 Update response:', response.status, data);
      
      if (response.ok) {
        // Reload appointments to get fresh data
        await loadAppointments();
        
        // Close modal
        setEditingAppointment(null);
        setEditDate('');
        setEditTime('');
        setEditNotes('');
        
        playTTS('Appointment updated successfully', activeLanguage);
        console.log('✅ Appointment updated successfully');
      } else {
        const errorMsg = data.detail || 'Failed to update appointment';
        throw new Error(errorMsg);
      }
    } catch (error) {
      console.error('❌ Error updating appointment:', error);
      playTTS(`Error: ${error.message}`, activeLanguage);
      alert(`Failed to update appointment: ${error.message}`);
    }
  };

  const handleCancelEdit = () => {
    setEditingAppointment(null);
    setEditDate('');
    setEditTime('');
    setEditNotes('');
  };

  if (loading) {
    return <div style={{ padding: '20px', textAlign: 'center' }}>{t('loadingAppointments', activeLanguage)}</div>;
  }

  return (
    <div className="appointments-section">
      <h2>{t('yourAppointments', activeLanguage)}</h2>
      {appointments.length === 0 ? (
        <div className="empty-state">
          <p>{t('noUpcomingAppointments', activeLanguage)}</p>
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
                    className="apt-btn edit"
                    onClick={() => rescheduleAppointment(apt)}
                    title="Edit appointment"
                  >
                    ✏️ {t('edit', activeLanguage)}
                  </button>
                  <button
                    className="apt-btn delete"
                    onClick={() => cancelAppointment(apt)}
                    title="Delete appointment"
                  >
                    🗑️ {t('delete', activeLanguage)}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Edit Appointment Modal */}
      {editingAppointment && (
        <div className="modal-overlay" onClick={handleCancelEdit}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>✏️ Edit Appointment</h3>
              <button className="modal-close" onClick={handleCancelEdit}>✕</button>
            </div>
            
            <div className="modal-body">
              <div className="modal-info">
                <p><strong>👨‍⚕️ Doctor:</strong> {editingAppointment.doctor_name}</p>
                <p><strong>🏥 Hospital:</strong> {editingAppointment.hospital_name}</p>
                <p><strong>📍 Location:</strong> {editingAppointment.locality}, {editingAppointment.city}</p>
              </div>

              <div className="form-group">
                <label htmlFor="edit-date">📅 Appointment Date</label>
                <input
                  id="edit-date"
                  type="date"
                  value={editDate}
                  onChange={(e) => setEditDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="edit-time">⏰ Appointment Time</label>
                <input
                  id="edit-time"
                  type="time"
                  value={editTime}
                  onChange={(e) => setEditTime(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="edit-notes">📝 Notes (Optional)</label>
                <textarea
                  id="edit-notes"
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  rows="3"
                  placeholder="Add any special notes or requirements..."
                />
              </div>
            </div>

            <div className="modal-footer">
              <button className="modal-btn cancel-btn" onClick={handleCancelEdit}>
                Cancel
              </button>
              <button className="modal-btn save-btn" onClick={handleSaveEdit}>
                💾 Save Changes
              </button>
            </div>
          </div>
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

        .apt-btn.edit {
          background: #1976d2;
          color: white;
        }

        .apt-btn.edit:hover {
          background: #1565c0;
        }

        .apt-btn.cancel {
          background: #ffebee;
          color: #dc3545;
        }

        .apt-btn.cancel:hover {
          background: #ffcdd2;
        }

        .apt-btn.delete {
          background: #ffebee;
          color: #dc3545;
        }

        .apt-btn.delete:hover {
          background: #ffcdd2;
        }

        /* Modal Styles */
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.6);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          animation: fadeIn 0.2s ease;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .modal-content {
          background: white;
          border-radius: 12px;
          max-width: 600px;
          width: 90%;
          max-height: 90vh;
          overflow-y: auto;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
          animation: slideUp 0.3s ease;
        }

        @keyframes slideUp {
          from {
            transform: translateY(20px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px 24px;
          border-bottom: 2px solid #e0e0e0;
        }

        .modal-header h3 {
          margin: 0;
          color: #333;
          font-size: 1.3rem;
        }

        .modal-close {
          background: none;
          border: none;
          font-size: 1.5rem;
          color: #666;
          cursor: pointer;
          padding: 5px 10px;
          line-height: 1;
          transition: color 0.2s;
        }

        .modal-close:hover {
          color: #dc3545;
        }

        .modal-body {
          padding: 24px;
        }

        .modal-info {
          background: #f5f5f5;
          padding: 15px;
          border-radius: 8px;
          margin-bottom: 20px;
        }

        .modal-info p {
          margin: 8px 0;
          color: #555;
          font-size: 0.95rem;
        }

        .form-group {
          margin-bottom: 20px;
        }

        .form-group label {
          display: block;
          margin-bottom: 8px;
          color: #333;
          font-weight: 600;
          font-size: 0.95rem;
        }

        .form-group input,
        .form-group textarea {
          width: 100%;
          padding: 12px;
          border: 2px solid #e0e0e0;
          border-radius: 8px;
          font-size: 1rem;
          transition: border-color 0.2s;
          box-sizing: border-box;
        }

        .form-group input:focus,
        .form-group textarea:focus {
          outline: none;
          border-color: #1976d2;
        }

        .form-group textarea {
          resize: vertical;
          font-family: inherit;
        }

        .modal-footer {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          padding: 20px 24px;
          border-top: 2px solid #e0e0e0;
        }

        .modal-btn {
          padding: 12px 24px;
          border: none;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          font-size: 0.95rem;
        }

        .cancel-btn {
          background: #f5f5f5;
          color: #666;
        }

        .cancel-btn:hover {
          background: #e0e0e0;
        }

        .save-btn {
          background: #1976d2;
          color: white;
        }

        .save-btn:hover {
          background: #1565c0;
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
