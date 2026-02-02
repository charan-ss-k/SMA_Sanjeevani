import React, { useRef } from 'react';

const ProfessionalReportView = ({ reportData, onClose }) => {
  const printRef = useRef();

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    // Create downloadable version
    const element = printRef.current;
    const opt = {
      margin: 10,
      filename: 'medical-report.pdf',
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };
    
    // For now, just print
    window.print();
  };

  const data = reportData.structured_data || {};
  const hospital = data.hospital_details || {};
  const doctor = data.doctor_details || {};
  const patient = data.patient_details || {};
  const clinical = data.clinical_details || {};
  const medicines = data.medicines || [];
  const advice = data.medical_advice || {};
  
  // Check if we have minimal required data
  const hasHospitalData = hospital.name || hospital.address || hospital.phone;
  const hasDoctorData = doctor.name || doctor.qualifications;
  const hasPatientData = patient.name || patient.patient_id || patient.age;
  const hasClinicalData = clinical.diagnosis || clinical.chief_complaints?.length > 0;
  const isIncompleteData = data.additional_information?.includes("regex fallback");

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl max-w-5xl w-full my-8 relative">
        {/* Action Buttons */}
        <div className="no-print sticky top-0 bg-white border-b px-6 py-3 flex justify-between items-center rounded-t-xl z-10">
          <h2 className="text-xl font-bold text-gray-800">📋 Medical Report</h2>
          <div className="flex gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              🖨️ Print
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
            >
              ✕ Close
            </button>
          </div>
        </div>

        {/* Professional Report Content */}
        <div ref={printRef} className="p-8 print:p-12">
          {/* Warning for Incomplete Data */}
          {isIncompleteData && (
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
              <div className="flex items-start">
                <span className="text-2xl mr-3">⚠️</span>
                <div>
                  <h4 className="font-bold text-yellow-800 mb-1">Incomplete Data Extraction</h4>
                  <p className="text-sm text-yellow-700">
                    Some details could not be extracted. Only medicine information is available. 
                    Please verify with the original prescription.
                  </p>
                </div>
              </div>
            </div>
          )}
          
          {/* Header - Hospital Details */}
          {hasHospitalData && (
            <div className="text-center border-b-4 border-blue-600 pb-6 mb-6">
              <h1 className="text-3xl font-bold text-blue-900 mb-2">
                {hospital.name || 'Medical Center'}
              </h1>
              {hospital.address && (
                <p className="text-gray-700 text-sm mb-1">{hospital.address}</p>
              )}
              <div className="flex justify-center gap-6 text-sm text-gray-600 mt-2">
                {hospital.phone && <span>📞 {hospital.phone}</span>}
                {hospital.email && <span>✉️ {hospital.email}</span>}
              </div>
              {hospital.timings && (
                <p className="text-xs text-gray-500 mt-2">
                  🕒 {hospital.timings} {hospital.closed_days && `• ${hospital.closed_days}`}
                </p>
              )}
            </div>
          )}

          {/* Doctor Details */}
          {hasDoctorData && (
            <div className="bg-blue-50 rounded-lg p-4 mb-6 border-l-4 border-blue-600">
              <h3 className="font-bold text-blue-900 mb-2 text-lg">👨‍⚕️ Doctor Information</h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
              {doctor.name && (
                <div>
                  <span className="text-gray-600">Name:</span>
                  <p className="font-semibold text-gray-900">{doctor.name}</p>
                </div>
              )}
              {doctor.qualifications && (
                <div>
                  <span className="text-gray-600">Qualifications:</span>
                  <p className="font-semibold text-gray-900">{doctor.qualifications}</p>
                </div>
              )}
              {doctor.specialization && (
                <div>
                  <span className="text-gray-600">Specialization:</span>
                  <p className="font-semibold text-gray-900">{doctor.specialization}</p>
                </div>
              )}
              {doctor.registration_number && (
                <div>
                  <span className="text-gray-600">Registration No:</span>
                  <p className="font-semibold text-gray-900">{doctor.registration_number}</p>
                </div>
              )}
            </div>
            </div>
          )}

          {/* Patient Details */}
          {hasPatientData && (
            <div className="bg-green-50 rounded-lg p-4 mb-6 border-l-4 border-green-600">
            <h3 className="font-bold text-green-900 mb-2 text-lg">🧑 Patient Information</h3>
            <div className="grid grid-cols-3 gap-3 text-sm">
              {patient.name && (
                <div>
                  <span className="text-gray-600">Name:</span>
                  <p className="font-semibold text-gray-900">{patient.name}</p>
                </div>
              )}
              {patient.patient_id && (
                <div>
                  <span className="text-gray-600">Patient ID:</span>
                  <p className="font-semibold text-gray-900">{patient.patient_id}</p>
                </div>
              )}
              {patient.age && (
                <div>
                  <span className="text-gray-600">Age:</span>
                  <p className="font-semibold text-gray-900">{patient.age}</p>
                </div>
              )}
              {patient.gender && (
                <div>
                  <span className="text-gray-600">Gender:</span>
                  <p className="font-semibold text-gray-900">{patient.gender}</p>
                </div>
              )}
              {patient.mobile && (
                <div>
                  <span className="text-gray-600">Contact:</span>
                  <p className="font-semibold text-gray-900">{patient.mobile}</p>
                </div>
              )}
              {patient.visit_date && (
                <div>
                  <span className="text-gray-600">Visit Date:</span>
                  <p className="font-semibold text-gray-900">{patient.visit_date}</p>
                </div>
              )}
              {patient.address && (
                <div className="col-span-3">
                  <span className="text-gray-600">Address:</span>
                  <p className="font-semibold text-gray-900">{patient.address}</p>
                </div>
              )}
            </div>
            </div>
          )}

          {/* Clinical Details */}
          {hasClinicalData && (
            <div className="bg-orange-50 rounded-lg p-4 mb-6 border-l-4 border-orange-600">
            <h3 className="font-bold text-orange-900 mb-2 text-lg">🩺 Clinical Information</h3>
            
            {/* Vitals */}
            {(clinical.weight_kg || clinical.height_cm || clinical.bmi || clinical.blood_pressure) && (
              <div className="mb-3">
                <p className="text-xs font-semibold text-gray-600 mb-1">VITAL SIGNS</p>
                <div className="grid grid-cols-4 gap-2 text-sm">
                  {clinical.weight_kg && (
                    <div className="bg-white p-2 rounded">
                      <span className="text-gray-600 text-xs">Weight:</span>
                      <p className="font-bold text-orange-700">{clinical.weight_kg} kg</p>
                    </div>
                  )}
                  {clinical.height_cm && (
                    <div className="bg-white p-2 rounded">
                      <span className="text-gray-600 text-xs">Height:</span>
                      <p className="font-bold text-orange-700">{clinical.height_cm} cm</p>
                    </div>
                  )}
                  {clinical.bmi && (
                    <div className="bg-white p-2 rounded">
                      <span className="text-gray-600 text-xs">BMI:</span>
                      <p className="font-bold text-orange-700">{clinical.bmi}</p>
                    </div>
                  )}
                  {clinical.blood_pressure && (
                    <div className="bg-white p-2 rounded">
                      <span className="text-gray-600 text-xs">BP:</span>
                      <p className="font-bold text-orange-700">{clinical.blood_pressure}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Complaints */}
            {clinical.chief_complaints && clinical.chief_complaints.length > 0 && (
              <div className="mb-3">
                <p className="text-xs font-semibold text-gray-600 mb-1">CHIEF COMPLAINTS</p>
                <ul className="list-disc list-inside text-sm text-gray-800 bg-white p-2 rounded">
                  {clinical.chief_complaints.map((complaint, idx) => (
                    <li key={idx}>{complaint}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Diagnosis */}
            {clinical.diagnosis && (
              <div>
                <p className="text-xs font-semibold text-gray-600 mb-1">DIAGNOSIS</p>
                <p className="font-bold text-orange-900 bg-white p-2 rounded">{clinical.diagnosis}</p>
              </div>
            )}
            </div>
          )}

          {/* Medicines - Most Important Section */}
          {medicines.length > 0 && (
            <div className="bg-red-50 rounded-lg p-4 mb-6 border-l-4 border-red-600">
              <h3 className="font-bold text-red-900 mb-3 text-lg">💊 Prescription</h3>
              <div className="space-y-3">
                {medicines.map((med, idx) => (
                  <div key={idx} className="bg-white p-4 rounded-lg border border-red-200">
                    <div className="flex items-start gap-3">
                      <span className="bg-red-600 text-white font-bold rounded-full w-7 h-7 flex items-center justify-center text-sm flex-shrink-0">
                        {med.serial_number || idx + 1}
                      </span>
                      <div className="flex-1">
                        <h4 className="font-bold text-gray-900 text-base mb-1">
                          {med.medicine_type && <span className="text-red-600">{med.medicine_type}. </span>}
                          {med.name}
                          {med.strength && <span className="text-gray-600 font-normal ml-2">{med.strength}</span>}
                        </h4>
                        
                        <div className="grid grid-cols-2 gap-2 text-sm mt-2">
                          {med.dosage && (
                            <div>
                              <span className="text-gray-600">Dosage:</span>
                              <p className="font-medium text-gray-900">{med.dosage}</p>
                            </div>
                          )}
                          {med.timing && (
                            <div>
                              <span className="text-gray-600">Timing:</span>
                              <p className="font-medium text-gray-900">{med.timing}</p>
                            </div>
                          )}
                          {med.frequency && (
                            <div>
                              <span className="text-gray-600">Frequency:</span>
                              <p className="font-medium text-gray-900">{med.frequency}</p>
                            </div>
                          )}
                          {med.duration && (
                            <div>
                              <span className="text-gray-600">Duration:</span>
                              <p className="font-medium text-gray-900">{med.duration}</p>
                            </div>
                          )}
                          {med.when_to_take && (
                            <div>
                              <span className="text-gray-600">When to take:</span>
                              <p className="font-medium text-gray-900">{med.when_to_take}</p>
                            </div>
                          )}
                          {med.total_quantity && (
                            <div>
                              <span className="text-gray-600">Total:</span>
                              <p className="font-medium text-gray-900">{med.total_quantity}</p>
                            </div>
                          )}
                        </div>
                        
                        {med.instructions && (
                          <div className="mt-2 text-xs text-gray-600 bg-gray-50 p-2 rounded">
                            ℹ️ {med.instructions}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Medical Advice */}
          {(advice.advice?.length > 0 || advice.dietary_restrictions || advice.precautions || advice.follow_up_date) && (
            <div className="bg-purple-50 rounded-lg p-4 mb-6 border-l-4 border-purple-600">
              <h3 className="font-bold text-purple-900 mb-2 text-lg">📝 Medical Advice & Instructions</h3>
              
              {advice.advice && advice.advice.length > 0 && (
                <div className="mb-3">
                  <p className="text-xs font-semibold text-gray-600 mb-1">GENERAL ADVICE</p>
                  <ul className="list-disc list-inside text-sm text-gray-800 space-y-1">
                    {advice.advice.map((item, idx) => (
                      <li key={idx}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}

              {advice.dietary_restrictions && (
                <div className="mb-3">
                  <p className="text-xs font-semibold text-gray-600 mb-1">DIETARY RESTRICTIONS</p>
                  <p className="text-sm text-gray-800">{advice.dietary_restrictions}</p>
                </div>
              )}

              {advice.precautions && (
                <div className="mb-3">
                  <p className="text-xs font-semibold text-gray-600 mb-1">PRECAUTIONS</p>
                  <p className="text-sm text-gray-800">{advice.precautions}</p>
                </div>
              )}

              {advice.follow_up_date && (
                <div className="bg-purple-100 p-2 rounded">
                  <p className="text-xs font-semibold text-gray-600">FOLLOW UP</p>
                  <p className="font-bold text-purple-900">{advice.follow_up_date}</p>
                </div>
              )}
            </div>
          )}

          {/* Footer */}
          <div className="border-t-2 border-gray-300 pt-4 mt-6 text-center">
            <p className="text-xs text-gray-500 mb-1">
              This is an AI-assisted analysis of the medical document. Please verify all information with the original prescription.
            </p>
            <p className="text-xs text-gray-400">
              Generated on {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}
            </p>
          </div>
        </div>
      </div>

      <style jsx>{`
        @media print {
          .no-print {
            display: none !important;
          }
          body {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }
        }
      `}</style>
    </div>
  );
};

export default ProfessionalReportView;
