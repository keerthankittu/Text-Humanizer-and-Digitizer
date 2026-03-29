import React, { useState } from 'react';
import axios from 'axios';
import { PenTool, ScanText, Download } from 'lucide-react';

function App() {
  const [extractedText, setExtractedText] = useState("");
  const [isReviewing, setIsReviewing] = useState(false);
  const [typedText, setTypedText] = useState("");
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [ocrImage, setOcrImage] = useState(null);
  const [pdfUrl, setPdfUrl] = useState(null);
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [isConvertingDoc, setIsConvertingDoc] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  
  const [selectedStyle, setSelectedStyle] = useState("font1.ttf");
  const [selectedColor, setSelectedColor] = useState("blue");

  const handleGenerate = async () => {
    if (!typedText) return alert("Please type text first!");
    setIsGenerating(true);
    try {
      const response = await axios.post('https://text-humanizer-and-digitizer.onrender.com', 
        { text: typedText, style: selectedStyle, color: selectedColor }, { responseType: 'blob' }
      );
      setPdfUrl(window.URL.createObjectURL(new Blob([response.data])));
    } catch (error) { alert("Error generating PDF."); }
    setIsGenerating(false);
  };

  const handleDocumentConvert = async () => {
    if (!selectedDoc) return alert("Please select a file!");
    setIsConvertingDoc(true);
    const formData = new FormData();
    formData.append('file', selectedDoc);
    formData.append('style', selectedStyle);
    formData.append('color', selectedColor);

    try {
      const response = await axios.post('https://text-humanizer-and-digitizer.onrender.com', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }, responseType: 'blob'
      });
      setPdfUrl(window.URL.createObjectURL(new Blob([response.data])));
    } catch (error) { alert("Error converting document."); }
    setIsConvertingDoc(false);
  };

  const handleDigitize = async () => {
    if (!ocrImage) return alert("Please upload an image first!");
    setIsExtracting(true);
    const formData = new FormData();
    formData.append('file', ocrImage);

    try {
      const response = await axios.post('https://text-humanizer-and-digitizer.onrender.com', formData, {
        headers: { 'Content-Type': 'multipart/form-data' } 
      });
      
      if (response.data.status === 'success') {
        setExtractedText(response.data.extracted_text);
        setIsReviewing(true); // Opens the review box
      }
    } catch (error) { alert("Error processing image."); }
    setIsExtracting(false);
  };

  // FIXED: Now points to /generate-digital-pdf and only sends the raw text!
  const handleGenerateDigitizedPDF = async () => {
    setIsExtracting(true);
    try {
      const response = await axios.post('https://text-humanizer-and-digitizer.onrender.com', 
        { text: extractedText }, { responseType: 'blob' }
      );
      setPdfUrl(window.URL.createObjectURL(new Blob([response.data])));
      setIsReviewing(false); // Close the box after success
    } catch (error) { alert("Error generating final PDF."); }
    setIsExtracting(false);
  };

  return (
    <div style={{ fontFamily: 'system-ui, -apple-system, sans-serif', padding: '40px', maxWidth: '1200px', margin: '0 auto', backgroundColor: '#f8fafc', minHeight: '100vh' }}>
      
      <header style={{ textAlign: 'center', marginBottom: '40px' }}>
        <h1 style={{ fontSize: '3.5rem', color: '#0f172a', margin: '0', letterSpacing: '-1px' }}>INTELLIFY</h1> 
        <p style={{ color: '#64748b', fontSize: '1.2rem', marginTop: '10px' }}>A Full-Stack Platform for Humanized & Digitized Documentation</p>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
        
        {/* LEFT COLUMN: Digitize Notes (The AI Feature) */}
        <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#1e293b' }}><ScanText color="#3b82f6" /> Digitize Notes </h2>
          <p style={{ color: '#64748b', marginBottom: '20px' }}>Upload a high-contrast document scan. The deep learning model will extract it to text for review.</p>
          
          <input type="file" accept="image/*" onChange={(e) => setOcrImage(e.target.files[0])} style={{ display: 'block', marginBottom: '15px' }} />
          
          <button onClick={handleDigitize} disabled={isExtracting} style={{ width: '100%', padding: '12px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', marginBottom: isReviewing ? '15px' : '0' }}>
            {isExtracting ? "Extracting Text..." : "Extract Text"}
          </button>

          {/* NEW REVIEW UI BOX */}
          {isReviewing && (
            <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '8px' }}>
              <h3 style={{ marginTop: 0, color: '#1e3a8a', fontSize: '1rem', marginBottom: '10px' }}>Review Extracted Text:</h3>
              <textarea 
                rows="6" 
                value={extractedText} 
                onChange={(e) => setExtractedText(e.target.value)} 
                style={{ width: '100%', padding: '10px', marginBottom: '15px', boxSizing: 'border-box', borderRadius: '6px', border: '1px solid #93c5fd', fontFamily: 'monospace', fontSize: '14px' }} 
              />
              <button onClick={handleGenerateDigitizedPDF} disabled={isExtracting} style={{ width: '100%', padding: '10px', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>
                {isExtracting ? "Generating..." : "Generate PDF"}
              </button>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: Humanize Notes (The Rendering Feature) */}
        <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#1e293b' }}><PenTool color="#10b981" /> Humanize Digital Notes</h2>
          <p style={{ color: '#64748b', marginBottom: '20px' }}>Generate realistic handwriting from text or documents.</p>
          
          <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
            <select value={selectedStyle} onChange={(e) => setSelectedStyle(e.target.value)} style={{ flex: 1, padding: '8px', borderRadius: '6px' }}>
              <option value="font1.ttf">Style 1</option>
              <option value="font2.ttf">Style 2</option>
              <option value="font3.ttf">Style 3</option>
              <option value="font4.ttf">Style 4</option>
            </select>
            <select value={selectedColor} onChange={(e) => setSelectedColor(e.target.value)} style={{ flex: 1, padding: '8px', borderRadius: '6px' }}>
              <option value="blue">Blue Ink</option>
              <option value="black">Black Ink</option>
            </select>
          </div>

          <input type="file" accept=".pdf,.docx" onChange={(e) => setSelectedDoc(e.target.files[0])} style={{ marginBottom: '10px' }} />
          <button onClick={handleDocumentConvert} disabled={isConvertingDoc} style={{ width: '100%', padding: '10px', backgroundColor: '#4f46e5', color: 'white', border: 'none', borderRadius: '8px', marginBottom: '15px', cursor: 'pointer' }}>
             {isConvertingDoc ? "Parsing..." : "Convert File"}
          </button>

          <textarea rows="4" placeholder="Or type text here..." value={typedText} onChange={(e) => setTypedText(e.target.value)} style={{ width: '100%', padding: '10px', marginBottom: '10px', boxSizing: 'border-box' }} />
          <button onClick={handleGenerate} disabled={isGenerating} style={{ width: '100%', padding: '12px', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>
            {isGenerating ? "Rendering..." : "Generate PDF"}
          </button>
        </div>
      </div>

      {/* GLOBAL DOWNLOAD SECTION */}
      {pdfUrl && (
        <div style={{ marginTop: '40px', textAlign: 'center' }}>
          <a href={pdfUrl} download="Intellify_Result.pdf" style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', padding: '15px 30px', backgroundColor: '#f59e0b', color: 'white', textDecoration: 'none', borderRadius: '8px', fontWeight: 'bold' }}>
            <Download size={24} /> Download Output PDF
          </a>
        </div>
      )}
    </div>
  );
}

export default App;