# Network Port Scanner Dashboard

This project is a custom-built network scanner designed to perform reconnaissance on target IP addresses. I built this to gain a deeper understanding of low-level networking concepts like TCP handshakes and socket programming, while also creating a modern dashboard to visualize the data.

## How It Works
The backend uses Python's `socket` library to attempt TCP connections on common ports. It utilizes `concurrent.futures` to multi-thread the scanning process for speed. 

- **Port Detection**: Identifies open vs closed ports.
- **Subnet Discovery**: Scans local network (ARP/Ping sweep) to find active devices.
- **Banner Grabbing**: Sends probe packets to open ports to capture service version banners (e.g., Apache/2.4, SSH).
- **Frontend**: A Flask server streams the results to a Javascript-powered dashboard.

## Technology Used
- **Python 3** (Sockets, Threading)
- **Flask** (API & Web Server)
- **Frontend**: HTML/CSS/JS (Custom dark UI)

## Running the Project
1. Install requirements: `pip3 install -r requirements.txt`
2. Run the scanner: `python3 app.py`
3. View at: `http://localhost:3000`
