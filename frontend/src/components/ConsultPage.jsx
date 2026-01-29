import React, { useState, useEffect, useContext } from 'react';
import { LanguageContext } from '../main';
import { t } from '../utils/translations';
import { playTTS, stopAllTTS } from '../utils/tts';
import './ConsultPage.css';

const ConsultPage = () => {
  const { language } = useContext(LanguageContext);
  const [isMuted, setIsMuted] = useState(false);
  
  // State management
  const [tab, setTab] = useState('book'); // book, history, reminders
  const [step, setStep] = useState('search'); // search, results, booking
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  
  // Search form
  const [searchOptions, setSearchOptions] = useState({
    states: [],
    cities: [],
    localities: [],
    specializations: [],
    native_languages: [],
    languages: []
  });
  
  const [searchForm, setSearchForm] = useState({
    state: '',
    city: '',
    locality: '',
    specialization: '',
    native_language: '',
    languages_known: ''
  });
  
  // Results
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  
  // Booking form
  const [bookingForm, setBookingForm] = useState({
    patient_name: '',
    patient_email: '',
    patient_phone: '',
    appointment_date: '',
    appointment_time: '',
    notes: ''
  });

  // Appointment History
  const [appointmentHistory, setAppointmentHistory] = useState([]);
  const [upcomingAppointments, setUpcomingAppointments] = useState([]);
  
  // Load search options and appointments on mount
  useEffect(() => {
    loadSearchOptions();
    loadAppointments();
  }, []);
  
  const loadSearchOptions = async () => {
    try {
      const apiBase = window.__API_BASE__ || 'http://localhost:8000';
      console.log('📍 Fetching search options from:', `${apiBase}/api/appointments/search/options`);
      const response = await fetch(`${apiBase}/api/appointments/search/options`);
      
      console.log('📊 Response status:', response.status);
      if (!response.ok) {
        throw new Error(`Failed to load search options: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('✅ Search options loaded:', data);
      if (data.success) {
        setSearchOptions(data.options);
        console.log('✅ Search options set in state:', data.options);
      }
    } catch (err) {
      console.error('❌ Error loading search options:', err);
      setError('Failed to load doctor information');
    }
  };

  const loadAppointments = async () => {
    try {
      const apiBase = window.__API_BASE__ || 'http://localhost:8000';
      
      // Fetch all appointments
      const allResponse = await fetch(`${apiBase}/api/appointments/my-appointments`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('access_token')}` }
      });
      
      if (allResponse.ok) {
        const allData = await allResponse.json();
        setAppointmentHistory(allData.appointments || []);
      }
      
      // Fetch upcoming appointments
      const upcomingResponse = await fetch(`${apiBase}/api/appointments/upcoming-appointments`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('access_token')}` }
      });
      
      if (upcomingResponse.ok) {
        const upcomingData = await upcomingResponse.json();
        setUpcomingAppointments(upcomingData.appointments || []);
      }
    } catch (err) {
      console.error('❌ Error loading appointments:', err);
    }
  };
  
  const handleSearchChange = (e) => {
    const { name, value } = e.target;
    setSearchForm(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSearch = async (e) => {
    e.preventDefault();
    
    // Validate at least one criterion
    if (!Object.values(searchForm).some(val => val)) {
      setError('Please select at least one search criterion');
      if (!isMuted) playTTS('Please select at least one search criterion', language);
      return;
    }
    
    setLoading(true);
    setError('');
    setMessage('');
    
    try {
      const apiBase = window.__API_BASE__ || 'http://localhost:8000';
      const response = await fetch(`${apiBase}/api/appointments/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(searchForm)
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.detail || 'Search failed');
      }
      
      if (data.doctors && data.doctors.length > 0) {
        setDoctors(data.doctors);
        setStep('results');
        setMessage(`Found ${data.doctors.length} matching doctors`);
        if (!isMuted) playTTS(`Found ${data.doctors.length} matching doctors`, language);
      } else {
        setError('No doctors found matching your criteria');
        if (!isMuted) playTTS('No doctors found', language);
      }
    } catch (err) {
      console.error('Search error:', err);
      setError(err.message || 'Error searching doctors');
      if (!isMuted) playTTS('Error searching doctors', language);
    } finally {
      setLoading(false);
    }
  };
  
  const handleBookAppointment = (doctor) => {
    setSelectedDoctor(doctor);
    setStep('booking');
    setBookingForm({
      patient_name: '',
      patient_email: '',
      patient_phone: '',
      appointment_date: '',
      appointment_time: '',
      notes: ''
    });
    if (!isMuted) playTTS(`Booking appointment with ${doctor.name}`, language);
  };
  
  const handleBookingChange = (e) => {
    const { name, value } = e.target;
    setBookingForm(prev => ({ ...prev, [name]: value }));
  };
  
  const handleConfirmBooking = async (e) => {
    e.preventDefault();
    
    // Validate all required fields
    if (!bookingForm.patient_name || !bookingForm.patient_email || !bookingForm.patient_phone ||
        !bookingForm.appointment_date || !bookingForm.appointment_time) {
      setError('Please fill all required fields');
      if (!isMuted) playTTS('Please fill all required fields', language);
      return;
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(bookingForm.patient_email)) {
      setError('Please enter a valid email address');
      return;
    }
    
    // Validate phone format
    if (bookingForm.patient_phone.length < 10) {
      setError('Please enter a valid phone number');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      const apiBase = window.__API_BASE__ || 'http://localhost:8000';
      const token = localStorage.getItem('access_token');
      
      const payload = {
        doctor_id: selectedDoctor.employee_id,
        patient_name: bookingForm.patient_name.trim(),
        patient_email: bookingForm.patient_email.trim(),
        patient_phone: bookingForm.patient_phone.trim(),
        appointment_date: bookingForm.appointment_date, // YYYY-MM-DD format from date input
        appointment_time: bookingForm.appointment_time, // HH:MM format from time input
        notes: bookingForm.notes || null
      };
      
      console.log('📤 Sending appointment booking:', payload);
      
      const response = await fetch(`${apiBase}/api/appointments/book`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      
      const data = await response.json();
      console.log('📋 Booking response:', response.status, data);
      
      if (!response.ok) {
        // Better error handling
        let errorMsg = 'Booking failed';
        if (data.detail) {
          errorMsg = typeof data.detail === 'string' ? data.detail : JSON.stringify(data.detail);
        } else if (data.message) {
          errorMsg = data.message;
        }
        throw new Error(errorMsg);
      }
      
      if (data.success) {
        setMessage(`✅ Appointment booked successfully! ID: ${data.appointment_id}`);
        if (!isMuted) playTTS('Appointment booked successfully', language);
        
        // Reload appointments
        loadAppointments();
        
        // Reset and go back to search
        setTimeout(() => {
          setStep('search');
          setSearchForm({
            state: '',
            city: '',
            locality: '',
            specialization: '',
            native_language: '',
            languages_known: ''
          });
          setDoctors([]);
          setSelectedDoctor(null);
          setError('');
        }, 2000);
      }
    } catch (err) {
      console.error('Booking error:', err);
      setError(err.message || 'Error booking appointment');
      if (!isMuted) playTTS('Error booking appointment', language);
    } finally {
      setLoading(false);
    }
  };
  
  const handleMuteToggle = () => {
    if (!isMuted) {
      stopAllTTS();
    }
    setIsMuted(!isMuted);
    if (isMuted) {
      playTTS('Voice enabled', language);
    }
  };
  
  return (
    <div className="consult-page">
      {/* Header */}
      <div className="consult-header">
        <div className="header-content">
          <h1>🏥 Doctor Consultation</h1>
          <p>Book appointments and manage your consultations</p>
        </div>
        <button
          onClick={handleMuteToggle}
          className={`mute-btn ${isMuted ? 'muted' : ''}`}
          title={isMuted ? 'Unmute' : 'Mute'}
        >
          {isMuted ? '🔇' : '🔊'}
        </button>
      </div>
      
      {/* Tabs */}
      <div className="section" style={{ marginBottom: '30px' }}>
        <div className="tabs">
          <button
            className={`tab-btn ${tab === 'book' ? 'active' : ''}`}
            onClick={() => {
              setTab('book');
              setStep('search');
              setError('');
              setMessage('');
            }}
          >
            📅 Book Appointment
          </button>
          <button
            className={`tab-btn ${tab === 'history' ? 'active' : ''}`}
            onClick={() => {
              setTab('history');
              setError('');
              setMessage('');
            }}
          >
            📋 Appointment History
          </button>
          <button
            className={`tab-btn ${tab === 'reminders' ? 'active' : ''}`}
            onClick={() => {
              setTab('reminders');
              setError('');
              setMessage('');
            }}
          >
            ⏰ Reminders & Upcoming
          </button>
        </div>
      </div>
      
      {/* Messages */}
      {message && (
        <div className="message-box success">
          {message}
        </div>
      )}
      {error && (
        <div className="message-box error">
          ⚠️ {error}
        </div>
      )}
      
      {/* BOOKING TAB */}
      {tab === 'book' && (
        <>
      
      {/* Step 1: Search */}
      {step === 'search' && (
        <div className="section search-section">
          <div className="section-content">
            <h2>Search for a Doctor</h2>
            <p className="section-subtitle">Fill in your preferences to find the right doctor</p>
            
            <form onSubmit={handleSearch} className="search-form">
              <div className="form-grid">
                {/* State */}
                <div className="form-group">
                  <label>🗺️ State</label>
                  <select
                    name="state"
                    value={searchForm.state}
                    onChange={handleSearchChange}
                    className="form-control"
                  >
                    <option value="">-- Select State --</option>
                    {searchOptions.states.map(state => (
                      <option key={state} value={state}>{state}</option>
                    ))}
                  </select>
                </div>
                
                {/* City */}
                <div className="form-group">
                  <label>🏙️ City</label>
                  <select
                    name="city"
                    value={searchForm.city}
                    onChange={handleSearchChange}
                    className="form-control"
                  >
                    <option value="">-- Select City --</option>
                    {searchOptions.cities.map(city => (
                      <option key={city} value={city}>{city}</option>
                    ))}
                  </select>
                </div>
                
                {/* Locality */}
                <div className="form-group">
                  <label>📍 Locality</label>
                  <select
                    name="locality"
                    value={searchForm.locality}
                    onChange={handleSearchChange}
                    className="form-control"
                  >
                    <option value="">-- Select Locality --</option>
                    {searchOptions.localities.map(locality => (
                      <option key={locality} value={locality}>{locality}</option>
                    ))}
                  </select>
                </div>
                
                {/* Specialization */}
                <div className="form-group">
                  <label>👨‍⚕️ Specialization</label>
                  <select
                    name="specialization"
                    value={searchForm.specialization}
                    onChange={handleSearchChange}
                    className="form-control"
                  >
                    <option value="">-- Select Specialization --</option>
                    {searchOptions.specializations.map(spec => (
                      <option key={spec} value={spec}>{spec}</option>
                    ))}
                  </select>
                </div>
                
                {/* Native Language */}
                <div className="form-group">
                  <label>🗣️ Doctor's Native Language</label>
                  <select
                    name="native_language"
                    value={searchForm.native_language}
                    onChange={handleSearchChange}
                    className="form-control"
                  >
                    <option value="">-- Select Language --</option>
                    {searchOptions.native_languages.map(lang => (
                      <option key={lang} value={lang}>{lang}</option>
                    ))}
                  </select>
                </div>
                
                {/* Languages Known */}
                <div className="form-group">
                  <label>💬 Languages Doctor Speaks</label>
                  <select
                    name="languages_known"
                    value={searchForm.languages_known}
                    onChange={handleSearchChange}
                    className="form-control"
                  >
                    <option value="">-- Select Language --</option>
                    {searchOptions.languages.map(lang => (
                      <option key={lang} value={lang}>{lang}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary btn-lg"
              >
                {loading ? '⏳ Searching...' : '🔍 Search Doctors'}
              </button>
            </form>
          </div>
        </div>
      )}
      
      {/* Step 2: Results */}
      {step === 'results' && (
        <div className="section results-section">
          <div className="section-content">
            <div className="results-header">
              <div>
                <h2>👨‍⚕️ {doctors.length} Doctors Found</h2>
              </div>
              <button
                onClick={() => setStep('search')}
                className="btn btn-secondary"
              >
                ← New Search
              </button>
            </div>
            
            <div className="doctors-grid">
              {doctors.map((doctor, idx) => (
                <div key={doctor.employee_id} className="doctor-card">
                  <div className="doctor-rank">#{idx + 1}</div>
                  
                  <div className="doctor-header">
                    <h3>{doctor.name}</h3>
                    <span className="specialization-badge">{doctor.specialization}</span>
                  </div>
                  
                  <div className="doctor-info">
                    <div className="info-item">
                      <span className="label">🏥 Hospital</span>
                      <span className="value">{doctor.hospital}</span>
                    </div>
                    <div className="info-item">
                      <span className="label">📍 Location</span>
                      <span className="value">{doctor.locality}, {doctor.city}</span>
                    </div>
                    <div className="info-item">
                      <span className="label">🗺️ State</span>
                      <span className="value">{doctor.state}</span>
                    </div>
                    <div className="info-item">
                      <span className="label">📞 Phone</span>
                      <span className="value">{doctor.phone}</span>
                    </div>
                    <div className="info-item">
                      <span className="label">📧 Email</span>
                      <span className="value email">{doctor.email}</span>
                    </div>
                    <div className="info-item">
                      <span className="label">🗣️ Native Language</span>
                      <span className="value">{doctor.native_language}</span>
                    </div>
                  </div>
                  
                  <div className="languages">
                    <span className="label">💬 Languages Spoken:</span>
                    <div className="language-badges">
                      {doctor.languages_known.map((lang, i) => (
                        <span key={i} className="badge">{lang}</span>
                      ))}
                    </div>
                  </div>
                  
                  <button
                    onClick={() => handleBookAppointment(doctor)}
                    className="btn btn-primary btn-book"
                  >
                    📅 Book Appointment
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      
      {/* Step 3: Booking */}
      {step === 'booking' && selectedDoctor && (
        <div className="section booking-section">
          <div className="section-content">
            <h2>📅 Book Appointment</h2>
            
            <div className="doctor-summary">
              <h3>{selectedDoctor.name}</h3>
              <p>{selectedDoctor.specialization} at {selectedDoctor.hospital}</p>
              <p>{selectedDoctor.locality}, {selectedDoctor.city}</p>
            </div>
            
            <form onSubmit={handleConfirmBooking} className="booking-form">
              <div className="form-grid">
                <div className="form-group">
                  <label>Your Name *</label>
                  <input
                    type="text"
                    name="patient_name"
                    value={bookingForm.patient_name}
                    onChange={handleBookingChange}
                    placeholder="Enter your full name"
                    className="form-control"
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label>Email *</label>
                  <input
                    type="email"
                    name="patient_email"
                    value={bookingForm.patient_email}
                    onChange={handleBookingChange}
                    placeholder="Enter your email"
                    className="form-control"
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label>Phone Number *</label>
                  <input
                    type="tel"
                    name="patient_phone"
                    value={bookingForm.patient_phone}
                    onChange={handleBookingChange}
                    placeholder="Enter your phone number"
                    className="form-control"
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label>Appointment Date *</label>
                  <input
                    type="date"
                    name="appointment_date"
                    value={bookingForm.appointment_date}
                    onChange={handleBookingChange}
                    className="form-control"
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label>Appointment Time *</label>
                  <input
                    type="time"
                    name="appointment_time"
                    value={bookingForm.appointment_time}
                    onChange={handleBookingChange}
                    className="form-control"
                    required
                  />
                </div>
              </div>
              
              <div className="form-group full-width">
                <label>Additional Notes</label>
                <textarea
                  name="notes"
                  value={bookingForm.notes}
                  onChange={handleBookingChange}
                  placeholder="Any additional notes or concerns..."
                  className="form-control"
                  rows="4"
                ></textarea>
              </div>
              
              <div className="form-actions">
                <button
                  type="submit"
                  disabled={loading}
                  className="btn btn-primary btn-lg"
                >
                  {loading ? '⏳ Booking...' : '✅ Confirm Appointment'}
                </button>
                <button
                  type="button"
                  onClick={() => setStep('results')}
                  className="btn btn-secondary btn-lg"
                >
                  ← Back to Results
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
        </>
      )}
      
      {/* HISTORY TAB */}
      {tab === 'history' && (
        <div className="section">
          <div className="section-content">
            <h2>📋 Your Appointment History</h2>
            <p className="section-subtitle">View all your past and current appointments</p>
            
            {appointmentHistory && appointmentHistory.length > 0 ? (
              <div className="appointment-list">
                {appointmentHistory.map(apt => {
                  const aptDate = new Date(apt.appointment_date);
                  const now = new Date();
                  const isPast = aptDate < now;
                  
                  return (
                    <div key={apt.id} className={`appointment-card ${isPast ? 'past' : 'upcoming'}`}>
                      <span className={`appointment-status ${apt.status}`}>
                        {apt.status.toUpperCase()}
                      </span>
                      <h3>Dr. {apt.doctor_name}</h3>
                      <div className="appointment-detail">
                        <span className="label">Specialization:</span>
                        <span className="value">{apt.specialization}</span>
                      </div>
                      <div className="appointment-detail">
                        <span className="label">Hospital:</span>
                        <span className="value">{apt.hospital}</span>
                      </div>
                      <div className="appointment-detail">
                        <span className="label">Location:</span>
                        <span className="value">{apt.city}, {apt.state}</span>
                      </div>
                      <div className="appointment-detail">
                        <span className="label">Date & Time:</span>
                        <span className="value">
                          {new Date(apt.appointment_date).toLocaleDateString()} {apt.appointment_time}
                        </span>
                      </div>
                      <div className="appointment-detail">
                        <span className="label">Doctor Phone:</span>
                        <span className="value">{apt.doctor_phone}</span>
                      </div>
                      {apt.notes && (
                        <div className="appointment-detail">
                          <span className="label">Notes:</span>
                          <span className="value">{apt.notes}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="empty-state">
                <div className="empty-state-icon">📭</div>
                <h3>No Appointment History</h3>
                <p>You haven't booked any appointments yet. Book one now!</p>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* REMINDERS & UPCOMING TAB */}
      {tab === 'reminders' && (
        <div className="section">
          <div className="section-content">
            <h2>⏰ Upcoming Appointments & Reminders</h2>
            <p className="section-subtitle">Your scheduled appointments coming up</p>
            
            {upcomingAppointments && upcomingAppointments.length > 0 ? (
              <div className="appointment-list">
                {upcomingAppointments.map(apt => {
                  const aptDate = new Date(apt.appointment_date);
                  const daysUntil = Math.ceil((aptDate - new Date()) / (1000 * 60 * 60 * 24));
                  
                  return (
                    <div key={apt.id} className="appointment-card upcoming">
                      <span className="appointment-status scheduled">
                        {daysUntil === 0 ? 'TODAY' : daysUntil === 1 ? 'TOMORROW' : `${daysUntil} DAYS`}
                      </span>
                      <h3>Dr. {apt.doctor_name}</h3>
                      <div className="appointment-detail">
                        <span className="label">Specialization:</span>
                        <span className="value">{apt.specialization}</span>
                      </div>
                      <div className="appointment-detail">
                        <span className="label">Hospital:</span>
                        <span className="value">{apt.hospital}</span>
                      </div>
                      <div className="appointment-detail">
                        <span className="label">Location:</span>
                        <span className="value">{apt.locality}, {apt.city}</span>
                      </div>
                      <div className="appointment-detail">
                        <span className="label">⏰ Time:</span>
                        <span className="value">{apt.appointment_time}</span>
                      </div>
                      <div className="appointment-detail">
                        <span className="label">📞 Contact:</span>
                        <span className="value">{apt.doctor_phone}</span>
                      </div>
                      {apt.notes && (
                        <div className="appointment-detail">
                          <span className="label">Notes:</span>
                          <span className="value">{apt.notes}</span>
                        </div>
                      )}
                      <div className="appointment-actions">
                        <button className="btn btn-primary" onClick={() => {
                          if (!isMuted) playTTS(`Your appointment with Dr. ${apt.doctor_name} is coming up in ${daysUntil} days at ${apt.appointment_time}`, language);
                        }}>
                          🔔 Set Reminder
                        </button>
                        <button className="btn btn-secondary" onClick={() => {
                          if (window.confirm('Cancel this appointment?')) {
                            // TODO: Add cancel appointment functionality
                          }
                        }}>
                          ❌ Cancel
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="empty-state">
                <div className="empty-state-icon">✅</div>
                <h3>No Upcoming Appointments</h3>
                <p>You don't have any upcoming appointments. Book one in the "Book Appointment" tab!</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ConsultPage;
