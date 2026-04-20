# Use the slim version of Python 3.10
FROM python:3.10-slim

# Set the working directory
WORKDIR /app

# Install system tools needed for Python builds
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copy the requirements file first (this speeds up Docker builds)
COPY requirements.txt .

# Install the libraries (including pypdf)
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of your AI code (main.py, etc.)
COPY . .

# Start the FastAPI server using uvicorn on port 8000
CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}"]