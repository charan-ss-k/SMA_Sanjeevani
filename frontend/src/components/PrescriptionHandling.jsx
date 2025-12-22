import React from 'react';
import logo from '../assets/Sanjeevani Logo.png';

const MedicineCard = ({ name = 'Paracetamol', dose = '500mg', qty = 10, onDelete, onEdit, onSpeak }) => (
  <div className="bg-white rounded-lg shadow p-4 flex gap-3 items-start">
    <div className="h-16 w-16 bg-gray-100 rounded-md flex items-center justify-center">
      <img src="/src/assets/Sanjeevani Logo.png" alt="med" className="h-10 w-10 object-contain" />
    </div>
    <div className="flex-1">
      <div className="flex items-center justify-between">
        <h4 className="font-semibold text-gray-800">{name}</h4>
        <div className="flex items-center gap-2">
          <button 
            onClick={onSpeak} 
            aria-label="play" 
            className="p-2 bg-amber-50 rounded hover:bg-amber-100"
          >
            🔊
          </button>
          <button 
            onClick={onEdit} 
            aria-label="edit" 
            className="p-2 bg-amber-50 rounded hover:bg-amber-100"
          >✏️</button>
          <button 
            onClick={onDelete} 
            aria-label="delete" 
            className="p-2 bg-amber-50 rounded hover:bg-amber-100"
          >🗑️</button>
        </div>
      </div>
      <p className="text-sm text-gray-500">{dose} • Qty: {qty}</p>
    </div>
  </div>
);

const PrescriptionHandling = () => {
  const [medicines, setMedicines] = React.useState([
    { id: 1, name: "Paracetamol", dose: "500mg", qty: 10 },
    { id: 2, name: "Cetirizine", dose: "10mg", qty: 5 },
    { id: 3, name: "Amoxicillin", dose: "250mg", qty: 14 },
    { id: 4, name: "Multivitamin", dose: "—", qty: 30 }
  ]);
  const [scanning, setScanning] = React.useState(false);
  
  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      setScanning(true);
      // Simulate processing
      setTimeout(() => {
        setScanning(false);
        // Add processed medicine
        setMedicines(prev => [...prev, {
          id: Date.now(),
          name: "New Medicine",
          dose: "100mg",
          qty: 10
        }]);
      }, 2000);
    }
  };

  const handleTakePhoto = () => {
    // In a real app, this would activate the device camera
    setScanning(true);
    setTimeout(() => {
      setScanning(false);
      setMedicines(prev => [...prev, {
        id: Date.now(),
        name: "Captured Medicine",
        dose: "100mg",
        qty: 10
      }]);
    }, 2000);
  };

  const handleDelete = (id) => {
    setMedicines(prev => prev.filter(med => med.id !== id));
  };

  const handleEdit = (id) => {
    const name = prompt("Enter new medicine name:");
    if (name) {
      setMedicines(prev => prev.map(med => 
        med.id === id ? { ...med, name } : med
      ));
    }
  };

  const handleSpeak = (text) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleAddMedicine = () => {
    const name = prompt("Enter medicine name:");
    if (name) {
      setMedicines(prev => [...prev, {
        id: Date.now(),
        name,
        dose: prompt("Enter dose:") || "—",
        qty: parseInt(prompt("Enter quantity:")) || 1
      }]);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-28 pb-8">
      {/* Header bar inside page (additional controls) */}
      <div className="container mx-auto px-6">
        <div className="bg-white rounded-lg shadow p-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <img src={logo} alt="Sanjeevani" className="h-12 w-12 object-contain" />
            <div>
              <div className="font-semibold text-lg">Smart Medicine Access</div>
              <div className="text-sm text-gray-500">Prescription Handling</div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <select aria-label="language" className="border rounded px-3 py-2 bg-white">
              <option>EN</option>
              <option>HI</option>
              <option>TE</option>
            </select>
            <button aria-label="voice" className="p-2 bg-amber-50 rounded">🎙️</button>
            <button aria-label="sos" className="bg-red-600 text-white px-3 py-2 rounded">🚨 SOS</button>
          </div>
        </div>
      </div>

      {/* Upload Section */}
      <div className="container mx-auto px-6 mt-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow p-6">
              <h3 className="text-xl font-semibold mb-4">Upload Prescription</h3>
              <p className="text-sm text-gray-500 mb-4">Take a photo or upload from gallery/files. Scanning will begin automatically.</p>

              <div className="flex flex-col sm:flex-row gap-4">
                <button 
                  onClick={handleTakePhoto}
                  className="flex-1 bg-green-800 text-white py-4 rounded-lg text-lg hover:bg-green-700"
                >
                  📷 Take a Photo of Prescription
                </button>
                <label className="flex-1 cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileUpload}
                  />
                  <div className="flex-1 border border-dashed border-gray-300 py-4 rounded-lg text-lg text-center hover:bg-gray-50">
                    📤 Upload from Gallery / Files
                  </div>
                </label>
              </div>

              {/* scanning placeholder */}
              {scanning && (
                <div className="mt-6 flex items-center gap-4">
                  <div className="animate-spin h-8 w-8 border-4 border-green-300 border-t-green-700 rounded-full" />
                  <div>
                    <div className="text-sm font-medium">Scanning Prescription…</div>
                    <div className="text-xs text-gray-500">(Regional language + voice narration)</div>
                  </div>
                </div>
              )}
            </div>

            {/* AI Recognition Output Section */}
            <div className="bg-white rounded-xl shadow p-6 mt-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold">AI Recognition Output</h3>
                <div className="flex items-center gap-2">
                  <button className="px-3 py-2 bg-amber-50 rounded">Play All 🔊</button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {medicines.map(med => (
                  <MedicineCard
                    key={med.id}
                    name={med.name}
                    dose={med.dose}
                    qty={med.qty}
                    onDelete={() => handleDelete(med.id)}
                    onEdit={() => handleEdit(med.id)}
                    onSpeak={() => handleSpeak(`${med.name}, ${med.dose}, Quantity: ${med.qty}`)}
                  />
                ))}
              </div>

              {/* Tabs for OCR text & Doctor's notes — simplified */}
              <div className="mt-6">
                <div className="border-t pt-4">
                  <h4 className="font-semibold">Prescription Summary (editable)</h4>
                  <textarea className="w-full mt-2 p-3 border rounded" rows={4} defaultValue={`Paracetamol 500mg - Take one tablet after food\nCetirizine 10mg - Once daily`} />
                </div>
              </div>
            </div>
          </div>

          {/* Right column: Add/Correct, Reminders, Share */}
          <aside>
            <div className="bg-white rounded-xl shadow p-6 mb-6">
              <h4 className="font-semibold mb-3">Add / Correct Information</h4>
              <button className="w-full bg-amber-50 py-3 rounded mb-3">➕ Add Medicine</button>
              <div>
                <label className="text-sm text-gray-600">Medicine (autocomplete)</label>
                <input className="w-full mt-2 p-2 border rounded" placeholder="Search medicine" />
              </div>
            </div>

            <div className="bg-white rounded-xl shadow p-6 mb-6">
              <h4 className="font-semibold mb-3">Reminders & Schedule</h4>
              <div className="flex flex-col gap-3">
                <button 
                  onClick={() => {
                    const medicineName = prompt("Enter medicine name:");
                    if (medicineName) {
                      const time = prompt("Enter reminder time (HH:MM):");
                      if (time) {
                        setMedicines(prev => [...prev, {
                          id: Date.now(),
                          name: medicineName,
                          dose: "Custom Reminder",
                          qty: 0,
                          reminderTime: time
                        }]);
                        alert(`New reminder set for ${medicineName} at ${time}`);
                      }
                    }
                  }}
                  className="w-full bg-green-800 text-white py-2 rounded hover:bg-green-700 mb-3"
                >
                  ➕ Add New Reminder
                </button>
                {medicines.map(med => (
                  <div key={med.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                    <div>
                      <div className="font-medium">{med.name}</div>
                      <div className="text-sm text-gray-500">{med.dose}</div>
                      {med.reminderTime && (
                        <div className="text-xs text-green-600">⏰ Reminder: {med.reminderTime}</div>
                      )}
                    </div>
                    <button 
                      className="p-2 bg-amber-50 rounded hover:bg-amber-100"
                      onClick={() => {
                        const time = prompt("Enter reminder time (HH:MM):");
                        if (time) {
                          setMedicines(prev => prev.map(m => 
                            m.id === med.id ? { ...m, reminderTime: time } : m
                          ));
                          alert(`Reminder set for ${med.name} at ${time}`);
                        }
                      }}
                    >
                      ⏰ Set Reminder
                    </button>
                  </div>
                ))}
              </div>
            </div>

          </aside>
        </div>
      </div>

    </div>
  );
};

export default PrescriptionHandling;
