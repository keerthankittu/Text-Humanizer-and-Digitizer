# 🧠 INTELLIFY: Hybrid Documentation Engine
**A Polyglot Microservices Platform for Digitizing and Humanizing Educational Notes.**

![React](https://img.shields.io/badge/react-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB)
![Flask](https://img.shields.io/badge/flask-%23000.svg?style=for-the-badge&logo=flask&logoColor=white)
![OpenCV](https://img.shields.io/badge/opencv-%23white.svg?style=for-the-badge&logo=opencv&logoColor=white)

## 📌 Overview
The Hybrid Documentation Engine is a core module of **INTELLIFY**, designed to bridge the gap between physical and digital learning environments. It solves two distinct problems in modern document processing:
1. **Digitize (OCR):** Accurately extracting text from low-quality, heavily shadowed photographs of physical handwritten notes.
2. **Humanize (Generative Rendering):** Defeating the "Typewriter Effect" by rendering standard digital text into highly realistic, mathematically randomized handwriting.

This module utilizes a client-server architecture, decoupling the React.js frontend state management from the heavy computational matrix operations handled by a Python/Flask vision server.

---

## ✨ Core Features

### 📸 1. The "Digitize" Pipeline (Computer Vision + OCR)
* **OpenCV Pre-Processing:** Raw image arrays are passed through a `5x5` Gaussian Blur and Adaptive Thresholding to eliminate camera noise, strip away shadows, and create a high-contrast binary image.
* **Tesseract AI Extraction:** A localized C++ LSTM neural network scans the cleaned pixel array (configured with `--psm 6` for uniform text blocking) to extract string data offline.
* **Human-in-the-Loop Architecture:** Extracted strings are routed back to the React UI as JSON. The user reviews and corrects any AI cursive parsing errors before final compilation, ensuring 100% output accuracy.

### ✍️ 2. The "Humanize" Pipeline (Stochastic Rendering)
* **Word-by-Word Mapping:** Bypasses standard line-rendering to draw documents word-by-word on a dynamically generated Pillow (PIL) canvas.
* **Jitter Injection Algorithm:** Simulates human motor imperfection by injecting randomized millimeter variations (`random.randint`) into:
  * **Baseline Y-Axis:** Prevents words from sitting on a flawless, invisible line.
  * **X-Axis Padding:** Simulates natural, inconsistent human spacing between words.
  * **RGB Ink Variance:** Simulates the fluctuating pressure of a ballpoint pen.
* **FPDF Compilation:** The final generated canvas is mapped onto a standard A4 template and exported as a downloadable PDF Blob.

---

## 🛠️ Technology Stack
* **Frontend:** React.js, Tailwind CSS, Axios, HTML5 APIs
* **Backend:** Python, Flask, Flask-CORS
* **Computer Vision & AI:** OpenCV, NumPy, Tesseract OCR
* **Graphics & Document Generation:** Pillow (PIL), FPDF, textwrap

---

## 🚀 Installation & Setup

### Prerequisites
1. **Node.js** (v14 or higher)
2. **Python** (v3.8 or higher)
3. **Tesseract OCR Engine:** Must be installed locally on your machine.
   * *Windows:* Download the installer from UB-Mannheim and ensure the installation path matches: `C:\Program Files\Tesseract-OCR\tesseract.exe`

### Backend Setup (Flask Server)
```bash
# 1. Navigate to the backend directory
cd backend

# 2. Create a virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# 3. Install dependencies
pip install flask flask-cors opencv-python numpy pytesseract Pillow fpdf PyPDF2 python-docx

# 4. Run the vision server
python app.py
