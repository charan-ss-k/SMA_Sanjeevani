import React from 'react';
import { t } from '../utils/translations';

const DoctorRecommendation = ({ doctors, onSelectDoctor, onBack, language }) => {
  const getRatingStars = (rating) => {
    return '⭐'.repeat(Math.floor(rating)) + (rating % 1 ? '✨' : '');
  };

  const getLanguageBadges = (languages) => {
    return languages.slice(0, 3).map((lang, idx) => (
      <span key={idx} className="language-badge">
        {lang}
      </span>
    ));
  };

  return (
    <div className="doctor-recommendation-section">
      <div className="recommendation-header">
        <h2>👨‍⚕️ {doctors.length > 0 ? `Recommended Doctors (${doctors.length})` : 'No Doctors Found'}</h2>
        <button onClick={onBack} className="back-btn">
          ← Back to Search
        </button>
      </div>

      {doctors.length > 0 ? (
        <div className="doctors-grid">
          {doctors.map((doctor, idx) => (
            <div key={doctor.employee_id} className="doctor-card">
              <div className="doctor-card-header">
                <div className="doctor-info-top">
                  <h3 className="doctor-name">{doctor.doctor_name}</h3>
                  <span className="doctor-rating">
                    {getRatingStars(doctor.rating)} {doctor.rating}
                  </span>
                </div>
                <p className="specialization-badge">
                  {doctor.specialization}
                </p>
              </div>

              <div className="doctor-details">
                <div className="detail-row">
                  <span className="label">🏥 Hospital:</span>
                  <span className="value">{doctor.hospital_name}</span>
                </div>

                <div className="detail-row">
                  <span className="label">📍 Location:</span>
                  <span className="value">{doctor.locality}, {doctor.city}</span>
                </div>

                <div className="detail-row">
                  <span className="label">🗺️ State:</span>
                  <span className="value">{doctor.state}</span>
                </div>

                <div className="detail-row">
                  <span className="label">📧 Email:</span>
                  <span className="value email">{doctor.email_address}</span>
                </div>

                <div className="detail-row">
                  <span className="label">📞 Phone:</span>
                  <span className="value">{doctor.phone_number}</span>
                </div>

                <div className="languages-row">
                  <span className="label">🗣️ Languages:</span>
                  <div className="languages-list">
                    {getLanguageBadges(doctor.languages_known)}
                    {doctor.languages_known.length > 3 && (
                      <span className="language-badge more">
                        +{doctor.languages_known.length - 3} more
                      </span>
                    )}
                  </div>
                </div>

                {doctor.match_score && (
                  <div className="match-score">
                    <span className="score-label">Match Score:</span>
                    <div className="score-bar">
                      <div
                        className="score-fill"
                        style={{ width: `${Math.min(doctor.match_score, 100)}%` }}
                      ></div>
                    </div>
                    <span className="score-value">{doctor.match_score}%</span>
                  </div>
                )}
              </div>

              <button
                onClick={() => onSelectDoctor(doctor)}
                className="book-btn"
              >
                📅 Book Appointment
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="no-doctors-message">
          <p>😔 No doctors found matching your criteria.</p>
          <p>Try adjusting your search parameters.</p>
          <button onClick={onBack} className="back-btn-large">
            ← Try Again
          </button>
        </div>
      )}

      <style jsx>{`
        .doctor-recommendation-section {
          padding: 20px;
          max-width: 1400px;
          margin: 0 auto;
        }

        .recommendation-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 30px;
          border-bottom: 2px solid #e0e0e0;
          padding-bottom: 15px;
        }

        .recommendation-header h2 {
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

        .doctors-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
          gap: 20px;
          margin-bottom: 30px;
        }

        .doctor-card {
          background: white;
          border: 1px solid #ddd;
          border-radius: 10px;
          padding: 20px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          transition: all 0.3s ease;
        }

        .doctor-card:hover {
          box-shadow: 0 8px 20px rgba(46, 125, 50, 0.2);
          border-color: #2e7d32;
          transform: translateY(-5px);
        }

        .doctor-card-header {
          margin-bottom: 15px;
          border-bottom: 2px solid #f5f5f5;
          padding-bottom: 12px;
        }

        .doctor-info-top {
          display: flex;
          justify-content: space-between;
          align-items: start;
          margin-bottom: 8px;
        }

        .doctor-name {
          margin: 0;
          font-size: 1.3rem;
          color: #333;
          font-weight: 700;
        }

        .doctor-rating {
          font-size: 0.9rem;
          font-weight: 600;
          color: #f57c00;
          white-space: nowrap;
        }

        .specialization-badge {
          display: inline-block;
          background: linear-gradient(135deg, #2e7d32 0%, #1b5e20 100%);
          color: white;
          padding: 5px 12px;
          border-radius: 20px;
          font-size: 0.85rem;
          font-weight: 600;
          margin: 0;
        }

        .doctor-details {
          margin-bottom: 15px;
        }

        .detail-row {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 8px;
          font-size: 0.9rem;
        }

        .label {
          font-weight: 600;
          color: #666;
          min-width: 100px;
        }

        .value {
          color: #333;
          text-align: right;
          flex: 1;
        }

        .value.email {
          color: #2e7d32;
          font-size: 0.85rem;
          word-break: break-all;
        }

        .languages-row {
          margin-bottom: 15px;
        }

        .languages-list {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          margin-top: 6px;
        }

        .language-badge {
          background: #f1f8e9;
          color: #2e7d32;
          padding: 4px 10px;
          border-radius: 12px;
          font-size: 0.8rem;
          font-weight: 600;
          border: 1px solid #2e7d32;
        }

        .language-badge.more {
          background: #fff;
          border: 1px dashed #2e7d32;
        }

        .match-score {
          margin-bottom: 15px;
        }

        .score-label {
          font-weight: 600;
          color: #666;
          font-size: 0.85rem;
        }

        .score-bar {
          width: 100%;
          height: 8px;
          background: #e0e0e0;
          border-radius: 4px;
          margin: 6px 0;
          overflow: hidden;
        }

        .score-fill {
          height: 100%;
          background: linear-gradient(90deg, #4caf50, #8bc34a);
          border-radius: 4px;
          transition: width 0.3s ease;
        }

        .score-value {
          font-weight: 700;
          color: #4caf50;
          font-size: 0.9rem;
        }

        .book-btn {
          width: 100%;
          padding: 12px;
          background: linear-gradient(135deg, #2e7d32 0%, #1b5e20 100%);
          color: white;
          border: none;
          border-radius: 6px;
          font-size: 1rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .book-btn:hover {
          background: linear-gradient(135deg, #1b5e20 0%, #0d4012 100%);
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(46, 125, 50, 0.4);
        }

        .no-doctors-message {
          text-align: center;
          padding: 60px 20px;
          background: #f5f5f5;
          border-radius: 10px;
        }

        .no-doctors-message p {
          font-size: 1.1rem;
          color: #666;
          margin: 10px 0;
        }

        .back-btn-large {
          padding: 12px 30px;
          background: #1976d2;
          color: white;
          border: none;
          border-radius: 6px;
          font-size: 1rem;
          font-weight: 700;
          cursor: pointer;
          margin-top: 20px;
        }

        .back-btn-large:hover {
          background: #1565c0;
        }
      `}</style>
    </div>
  );
};

export default DoctorRecommendation;
