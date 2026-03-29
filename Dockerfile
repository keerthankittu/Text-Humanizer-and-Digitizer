# 1. Use an official lightweight Python/Linux image
FROM python:3.9-slim

# 2. Install the C++ system requirements for OpenCV and Tesseract
RUN apt-get update && apt-get install -y \
    tesseract-ocr \
    libgl1-mesa-glx \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

# 3. Set the working directory inside the server
WORKDIR /app

# 4. Copy your requirements and install Python dependencies
COPY requirements.txt .
# Add gunicorn, which is required to run Flask in production
RUN pip install --no-cache-dir -r requirements.txt gunicorn

# 5. Copy the rest of your app code
COPY . .

# 6. Expose the port and run the app using Gunicorn
EXPOSE 5000
CMD ["gunicorn", "-b", "0.0.0.0:5000", "app:app"]