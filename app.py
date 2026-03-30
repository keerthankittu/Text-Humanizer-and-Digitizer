from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
from PIL import Image, ImageDraw, ImageFont
from fpdf import FPDF
import os
import uuid
import textwrap
import PyPDF2
import docx
import cv2
import numpy as np
import pytesseract

app = Flask(__name__)
CORS(app)
@app.route('/', methods=['GET'])
def health_check():
    return {
        "status": "success",
        "message": "INTELLIFY API is LIVE and Running!"
    }, 200
import platform

# ==========================================
# 1. CONFIGURE TESSERACT (WINDOWS ONLY)
# ==========================================
if platform.system() == 'Windows':
    pytesseract.pytesseract.tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'

# ==========================================
# 2. DIGITIZE NOTES TO JSON (AI PIPELINE)
# ==========================================
@app.route('/predict-handwriting', methods=['POST'])
def predict_handwriting():
    if 'file' not in request.files:
        return jsonify({"error": "No file uploaded"}), 400

    try:
        # 1. Read the uploaded image
        file = request.files['file']
        file_bytes = np.frombuffer(file.read(), np.uint8)
        img = cv2.imdecode(file_bytes, cv2.IMREAD_GRAYSCALE)

        # 2. OpenCV Pipeline
        img = cv2.GaussianBlur(img, (5, 5), 0)
        img = cv2.adaptiveThreshold(img, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY, 51, 15)
        cv2.imwrite("debug_vision.jpg", img)

        # 3. Tesseract Engine
        custom_config = r'--oem 3 --psm 4'
        raw_text = pytesseract.image_to_string(img, config=custom_config)
        extracted_text = raw_text.strip()

        if len(extracted_text) < 2:
            extracted_text = "[No readable text found. You can type your notes manually!]"
            
        # Returns the text to React so the user can review it!
        return jsonify({"status": "success", "extracted_text": extracted_text})    

    except Exception as e:
        print(f"\n==== OCR ERROR ====\n{str(e)}\n====================\n")
        return jsonify({"error": "Failed to process the image. Is Tesseract installed at the correct path?"}), 500


# ==========================================
# 3. GENERATE STANDARD TEXT PDF (THE NEW FIX)
# ==========================================
@app.route('/generate-digital-pdf', methods=['POST'])
def generate_digital_pdf():
    try:
        data = request.json
        text = data.get('text', '')

        pdf = FPDF()
        pdf.add_page()
        
        # Title
        pdf.set_font("Arial", style='B', size=16)
        pdf.cell(200, 10, txt="INTELLIFY: Digitized Notes", ln=True, align='C')
        pdf.ln(10)
        
        # Body Text
        pdf.set_font("Arial", size=12)
        # We encode and decode to prevent FPDF from crashing on special characters
        safe_text = text.encode('latin-1', 'replace').decode('latin-1')
        pdf.multi_cell(0, 10, txt=safe_text)
        
        pdf_filename = f"intellify_digitized_{uuid.uuid4().hex}.pdf"
        pdf.output(pdf_filename)

        return send_file(pdf_filename, as_attachment=True)
        
    except Exception as e:
        print(f"\n==== PDF ERROR ====\n{str(e)}\n====================\n")
        return jsonify({"error": "Failed to generate digital PDF."}), 500


# ==========================================
# 4. GENERATIVE HANDWRITING ENGINE (UNTOUCHED)
# ==========================================
@app.route('/generate-handwriting', methods=['POST'])
def generate_handwriting():
    data = request.json
    return render_handwriting_to_pdf(data.get('text', ''), data.get('style', 'font1.ttf'), data.get('color', 'blue'))

@app.route('/convert-document', methods=['POST'])
def convert_document():
    try:
        file = request.files['file']
        filename = file.filename.lower()
        extracted_text = ""

        if filename.endswith('.pdf'):
            pdf_reader = PyPDF2.PdfReader(file)
            for page in pdf_reader.pages:
                text = page.extract_text()
                if text: extracted_text += text + "\n"
        elif filename.endswith('.docx'):
            doc = docx.Document(file)
            for para in doc.paragraphs: extracted_text += para.text + "\n"

        return render_handwriting_to_pdf(extracted_text, request.form.get('style', 'font1.ttf'), request.form.get('color', 'blue'))
    except Exception as e:
        return jsonify({"error": str(e)}), 500

import random # Add this at the top of your file!

def render_handwriting_to_pdf(text, style, color):
    # 1. Create the blank canvas
    img = Image.new('RGB', (800, 1000), color=(255, 255, 255))
    draw = ImageDraw.Draw(img)
    
    try: 
        font = ImageFont.truetype(style, 40)
    except IOError: 
        font = ImageFont.load_default() 
    
    # Add a slight opacity variation to the ink to simulate pen pressure
    ink_rgb = (0, 0, random.randint(130, 180)) if color == 'blue' else (random.randint(10, 30), random.randint(10, 30), random.randint(10, 30))
    
    margin = random.randint(45, 55) # Start margin isn't perfectly identical on every page
    offset = 50
    
    for paragraph in text.split('\n'):
        if not paragraph.strip():
            offset += 50
            continue
            
        wrapped_lines = textwrap.wrap(paragraph, width=32)
        
        for line in wrapped_lines:
            if offset > 950: break 
            
            current_x = margin
            
            # --- THE "HUMAN JITTER" ALGORITHM ---
            # Instead of drawing the whole line, we draw word by word
            for word in line.split(' '):
                # 1. Baseline Jitter: Words bounce up and down slightly (like real handwriting)
                jitter_y = offset + random.randint(-3, 3)
                
                # 2. Draw the word
                draw.text((current_x, jitter_y), word, font=font, fill=ink_rgb)
                
                # 3. Spacing Jitter: The gap between words isn't mathematically perfect
                # Use draw.textlength to calculate the width of the word
                word_width = draw.textlength(word + ' ', font=font)
                current_x += word_width + random.randint(-2, 4) 
                
            # Line Spacing Jitter: The gap between lines isn't perfectly uniform
            offset += 45 + random.randint(-2, 3)
            
    # Save and generate PDF
    temp_img = f"temp_{uuid.uuid4().hex}.jpg"
    img.save(temp_img)
    pdf = FPDF(unit="pt", format=[800, 1000])
    pdf.add_page()
    pdf.image(temp_img, 0, 0, 800, 1000)
    
    pdf_filename = f"intellify_generated_{uuid.uuid4().hex}.pdf"
    pdf.output(pdf_filename)
    os.remove(temp_img)
    
    return send_file(pdf_filename, as_attachment=True)

if __name__ == '__main__':
    app.run(debug=True, port=5000)
