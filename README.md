# CyberScout - Visual Network Scanner

A modern, web-based network port scanner built with Python (Flask) and a custom glassmorphism UI.

## Features
- **Real-time Port Scanning**: Utilizing Python's socket library and multi-threading for speed.
- **Service Version Detection**: Automated banner grabbing to identify software versions running on open ports.
- **Visual Dashboard**: A clean, dark-mode interface to visualize scan results.
- **Service Detection**: Identifies common services running on open ports.

## Tech Stack
- **Backend**: Python 3, Flask
- **Frontend**: HTML5, CSS3 (Glassmorphism), Vanilla JavaScript

## Setup & Run

1. **Install Dependencies**
   ```bash
   pip3 install -r requirements.txt
   ```

2. **Start the Application**
   ```bash
   python3 app.py
   ```

3. **Access Dashboard**
   Open your browser and navigate to: `http://localhost:3000`

## Disclaimer
This tool is for educational purposes and authorized network testing only. Do not scan networks you do not own or have permission to test.
