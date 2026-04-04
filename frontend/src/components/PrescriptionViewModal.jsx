import React from 'react';
import { t } from '../utils/translations';

const PrescriptionViewModal = ({ data, onClose, language = 'en' }) => {
  if (!data || !data.structured_data) {
    return null;
  }

  const { structured_data } = data;
  const {
    hospital_details = {},
    doctor_details = {},
    patient_details = {},
    clinical_details = {},
    medicines = [],
    medical_advice = {},
    additional_notes = ''
  } = structured_data;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full my-8 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 rounded-t-2xl sticky top-0 z-10">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold mb-1">📄 Prescription Analysis Result</h2>
              <p className="text-blue-100 text-sm">Extracted & Structured Medical Information</p>
            </div>
            <button
              onClick={onClose}
              className="bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg p-2 transition"
            >
              <span className="text-2xl leading-none">×</span>
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Hospital/Clinic Information */}
          {(hospital_details?.name || hospital_details?.address) && (
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-5 border border-purple-200">
              <h3 className="text-lg font-bold text-purple-900 mb-3 flex items-center">
                <span className="text-2xl mr-2">🏥</span>
                Hospital / Clinic Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                {hospital_details.name && (
                  <div className="bg-white p-3 rounded-lg shadow-sm">
                    <span className="font-semibold text-gray-700">Hospital Name:</span>
                    <p className="text-gray-900 mt-1">{hospital_details.name}</p>
                  </div>
                )}
                {hospital_details.address && (
                  <div className="bg-white p-3 rounded-lg shadow-sm">
                    <span className="font-semibold text-gray-700">Address:</span>
                    <p className="text-gray-900 mt-1">{hospital_details.address}</p>
                  </div>
                )}
                {hospital_details.phone && (
                  <div className="bg-white p-3 rounded-lg shadow-sm">
                    <span className="font-semibold text-gray-700">📞 Phone:</span>
                    <p className="text-gray-900 mt-1">{hospital_details.phone}</p>
                  </div>
                )}
                {hospital_details.timings && (
                  <div className="bg-white p-3 rounded-lg shadow-sm">
                    <span className="font-semibold text-gray-700">⏰ Timings:</span>
                    <p className="text-gray-900 mt-1">{hospital_details.timings}</p>
                  </div>
                )}
                {hospital_details.registration && (
                  <div className="bg-white p-3 rounded-lg shadow-sm">
                    <span className="font-semibold text-gray-700">Registration:</span>
                    <p className="text-gray-900 mt-1">{hospital_details.registration}</p>
                  </div>
                )}
                {hospital_details.closed_days && (
                  <div className="bg-white p-3 rounded-lg shadow-sm">
                    <span className="font-semibold text-gray-700">Closed:</span>
                    <p className="text-gray-900 mt-1">{hospital_details.closed_days}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Doctor Information */}
          {doctor_details?.name && (
            <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl p-5 border border-blue-200">
              <h3 className="text-lg font-bold text-blue-900 mb-3 flex items-center">
                <span className="text-2xl mr-2">👨‍⚕️</span>
                Doctor Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <div className="bg-white p-3 rounded-lg shadow-sm">
                  <span className="font-semibold text-gray-700">Doctor Name:</span>
                  <p className="text-gray-900 mt-1 font-medium">{doctor_details.name}</p>
                </div>
                {doctor_details.qualifications && (
                  <div className="bg-white p-3 rounded-lg shadow-sm">
                    <span className="font-semibold text-gray-700">Qualifications:</span>
                    <p className="text-gray-900 mt-1">{doctor_details.qualifications}</p>
                  </div>
                )}
                {doctor_details.specialization && (
                  <div className="bg-white p-3 rounded-lg shadow-sm">
                    <span className="font-semibold text-gray-700">Specialization:</span>
                    <p className="text-gray-900 mt-1">{doctor_details.specialization}</p>
                  </div>
                )}
                {doctor_details.registration_number && (
                  <div className="bg-white p-3 rounded-lg shadow-sm">
                    <span className="font-semibold text-gray-700">Registration No:</span>
                    <p className="text-gray-900 mt-1">{doctor_details.registration_number}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Patient Information */}
          {patient_details?.name && (
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-5 border border-green-200">
              <h3 className="text-lg font-bold text-green-900 mb-3 flex items-center">
                <span className="text-2xl mr-2">🧑‍⚕️</span>
                Patient Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                <div className="bg-white p-3 rounded-lg shadow-sm">
                  <span className="font-semibold text-gray-700">Patient Name:</span>
                  <p className="text-gray-900 mt-1 font-medium">{patient_details.name}</p>
                </div>
                {patient_details.patient_id && (
                  <div className="bg-white p-3 rounded-lg shadow-sm">
                    <span className="font-semibold text-gray-700">Patient ID:</span>
                    <p className="text-gray-900 mt-1">{patient_details.patient_id}</p>
                  </div>
                )}
                {patient_details.age && (
                  <div className="bg-white p-3 rounded-lg shadow-sm">
                    <span className="font-semibold text-gray-700">Age:</span>
                    <p className="text-gray-900 mt-1">{patient_details.age}</p>
                  </div>
                )}
                {patient_details.gender && (
                  <div className="bg-white p-3 rounded-lg shadow-sm">
                    <span className="font-semibold text-gray-700">Gender:</span>
                    <p className="text-gray-900 mt-1">{patient_details.gender}</p>
                  </div>
                )}
                {patient_details.mobile && (
                  <div className="bg-white p-3 rounded-lg shadow-sm">
                    <span className="font-semibold text-gray-700">📱 Mobile:</span>
                    <p className="text-gray-900 mt-1">{patient_details.mobile}</p>
                  </div>
                )}
                {patient_details.address && (
                  <div className="bg-white p-3 rounded-lg shadow-sm md:col-span-2">
                    <span className="font-semibold text-gray-700">Address:</span>
                    <p className="text-gray-900 mt-1">{patient_details.address}</p>
                  </div>
                )}
                {patient_details.visit_date && (
                  <div className="bg-white p-3 rounded-lg shadow-sm">
                    <span className="font-semibold text-gray-700">📅 Visit Date:</span>
                    <p className="text-gray-900 mt-1">{patient_details.visit_date}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Clinical Details */}
          {(clinical_details?.diagnosis || clinical_details?.chief_complaints?.length > 0) && (
            <div className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-xl p-5 border border-orange-200">
              <h3 className="text-lg font-bold text-orange-900 mb-3 flex items-center">
                <span className="text-2xl mr-2">🩺</span>
                Clinical Details
              </h3>
              <div className="space-y-3 text-sm">
                {clinical_details.diagnosis && (
                  <div className="bg-white p-4 rounded-lg shadow-sm">
                    <span className="font-semibold text-gray-700 text-base">📋 Diagnosis:</span>
                    <p className="text-gray-900 mt-2 font-medium text-base">{clinical_details.diagnosis}</p>
                  </div>
                )}
                {clinical_details.chief_complaints && clinical_details.chief_complaints.length > 0 && (
                  <div className="bg-white p-4 rounded-lg shadow-sm">
                    <span className="font-semibold text-gray-700">Chief Complaints:</span>
                    <ul className="mt-2 space-y-1">
                      {clinical_details.chief_complaints.map((complaint, idx) => (
                        <li key={idx} className="text-gray-900 flex items-start">
                          <span className="mr-2">•</span>
                          <span>{complaint}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {clinical_details.weight_kg && (
                    <div className="bg-white p-3 rounded-lg shadow-sm text-center">
                      <span className="font-semibold text-gray-700 block">⚖️ Weight</span>
                      <p className="text-gray-900 mt-1 font-bold">{clinical_details.weight_kg}</p>
                    </div>
                  )}
                  {clinical_details.height_cm && (
                    <div className="bg-white p-3 rounded-lg shadow-sm text-center">
                      <span className="font-semibold text-gray-700 block">📏 Height</span>
                      <p className="text-gray-900 mt-1 font-bold">{clinical_details.height_cm}</p>
                    </div>
                  )}
                  {clinical_details.bmi && (
                    <div className="bg-white p-3 rounded-lg shadow-sm text-center">
                      <span className="font-semibold text-gray-700 block">🎯 BMI</span>
                      <p className="text-gray-900 mt-1 font-bold">{clinical_details.bmi}</p>
                    </div>
                  )}
                  {clinical_details.blood_pressure && (
                    <div className="bg-white p-3 rounded-lg shadow-sm text-center">
                      <span className="font-semibold text-gray-700 block">💓 BP</span>
                      <p className="text-gray-900 mt-1 font-bold">{clinical_details.blood_pressure}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Medicines List - MOST IMPORTANT */}
          {medicines && medicines.length > 0 && (
            <div className="bg-gradient-to-r from-red-50 to-rose-50 rounded-xl p-5 border-2 border-red-300">
              <h3 className="text-xl font-bold text-red-900 mb-4 flex items-center">
                <span className="text-3xl mr-2">💊</span>
                Prescribed Medicines ({medicines.length})
              </h3>
              <div className="space-y-4">
                {medicines.map((medicine, idx) => (
                  <div key={idx} className="bg-white rounded-lg shadow-md border-l-4 border-red-500 p-4 hover:shadow-lg transition">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="bg-red-600 text-white text-xs font-bold px-2 py-1 rounded">
                            {medicine.serial_number || idx + 1}
                          </span>
                          {medicine.medicine_type && (
                            <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2 py-1 rounded">
                              {medicine.medicine_type}
                            </span>
                          )}
                        </div>
                        <h4 className="text-lg font-bold text-gray-900">
                          {medicine.name}
                          {medicine.strength && <span className="text-red-600 ml-2">{medicine.strength}</span>}
                        </h4>
                        {medicine.composition && (
                          <p className="text-xs text-gray-600 mt-1">
                            <span className="font-semibold">Composition:</span> {medicine.composition}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                      {medicine.dosage && (
                        <div className="bg-blue-50 p-2 rounded">
                          <span className="font-semibold text-gray-700 block text-xs">💉 Dosage</span>
                          <p className="text-gray-900 font-medium">{medicine.dosage}</p>
                        </div>
                      )}
                      {medicine.timing && (
                        <div className="bg-green-50 p-2 rounded">
                          <span className="font-semibold text-gray-700 block text-xs">⏰ Timing</span>
                          <p className="text-gray-900 font-medium">{medicine.timing}</p>
                        </div>
                      )}
                      {medicine.frequency && (
                        <div className="bg-purple-50 p-2 rounded">
                          <span className="font-semibold text-gray-700 block text-xs">📊 Frequency</span>
                          <p className="text-gray-900 font-medium">{medicine.frequency}</p>
                        </div>
                      )}
                      {medicine.duration && (
                        <div className="bg-orange-50 p-2 rounded">
                          <span className="font-semibold text-gray-700 block text-xs">📅 Duration</span>
                          <p className="text-gray-900 font-medium">{medicine.duration}</p>
                        </div>
                      )}
                      {medicine.total_quantity && (
                        <div className="bg-pink-50 p-2 rounded">
                          <span className="font-semibold text-gray-700 block text-xs">📦 Total Qty</span>
                          <p className="text-gray-900 font-medium">{medicine.total_quantity}</p>
                        </div>
                      )}
                      {medicine.when_to_take && (
                        <div className="bg-yellow-50 p-2 rounded">
                          <span className="font-semibold text-gray-700 block text-xs">🍽️ When</span>
                          <p className="text-gray-900 font-medium">{medicine.when_to_take}</p>
                        </div>
                      )}
                    </div>

                    {medicine.instructions && (
                      <div className="mt-3 bg-amber-50 p-3 rounded-lg border border-amber-200">
                        <span className="font-semibold text-amber-900 text-sm">📝 Instructions:</span>
                        <p className="text-gray-800 text-sm mt-1">{medicine.instructions}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Medical Advice */}
          {(medical_advice?.advice?.length > 0 || medical_advice?.follow_up_date) && (
            <div className="bg-gradient-to-r from-indigo-50 to-blue-50 rounded-xl p-5 border border-indigo-200">
              <h3 className="text-lg font-bold text-indigo-900 mb-3 flex items-center">
                <span className="text-2xl mr-2">💡</span>
                Medical Advice
              </h3>
              <div className="space-y-3 text-sm">
                {medical_advice.advice && medical_advice.advice.length > 0 && (
                  <div className="bg-white p-4 rounded-lg shadow-sm">
                    <span className="font-semibold text-gray-700">Advice:</span>
                    <ul className="mt-2 space-y-2">
                      {medical_advice.advice.map((item, idx) => (
                        <li key={idx} className="text-gray-900 flex items-start bg-indigo-50 p-2 rounded">
                          <span className="mr-2 text-indigo-600">✓</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {medical_advice.follow_up_date && (
                  <div className="bg-white p-4 rounded-lg shadow-sm">
                    <span className="font-semibold text-gray-700">📅 Follow Up Date:</span>
                    <p className="text-gray-900 mt-2 font-bold text-lg text-indigo-600">{medical_advice.follow_up_date}</p>
                  </div>
                )}
                {medical_advice.dietary_restrictions && (
                  <div className="bg-white p-4 rounded-lg shadow-sm">
                    <span className="font-semibold text-gray-700">🍽️ Dietary Instructions:</span>
                    <p className="text-gray-900 mt-2">{medical_advice.dietary_restrictions}</p>
                  </div>
                )}
                {medical_advice.precautions && (
                  <div className="bg-white p-4 rounded-lg shadow-sm">
                    <span className="font-semibold text-gray-700">⚠️ Precautions:</span>
                    <p className="text-gray-900 mt-2">{medical_advice.precautions}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Additional Notes */}
          {additional_notes && (
            <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
              <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center">
                <span className="text-2xl mr-2">📝</span>
                Additional Notes
              </h3>
              <p className="text-gray-700 text-sm">{additional_notes}</p>
            </div>
          )}

          {/* Footer Warnings */}
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-lg">
            <div className="flex items-start">
              <span className="text-2xl mr-3">⚠️</span>
              <div className="text-sm">
                <p className="font-semibold text-yellow-800 mb-1">Important Disclaimer:</p>
                <ul className="text-yellow-700 space-y-1">
                  <li>• This is an AI-assisted analysis. Always verify with the original prescription.</li>
                  <li>• Consult with your doctor before making any changes to your medication.</li>
                  <li>• Keep this information for your medical records.</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              onClick={() => window.print()}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition shadow-md"
            >
              🖨️ Print Prescription
            </button>
            <button
              onClick={onClose}
              className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-semibold py-3 px-6 rounded-lg transition shadow-md"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrescriptionViewModal;
