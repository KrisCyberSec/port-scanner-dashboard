from flask import Flask, render_template, request, jsonify
import socket
import concurrent.futures
import time

app = Flask(__name__)

# List of common ports to scan for the demo
COMMON_PORTS = {
    21: "FTP",
    22: "SSH",
    23: "Telnet",
    25: "SMTP",
    53: "DNS",
    80: "HTTP",
    110: "POP3",
    143: "IMAP",
    443: "HTTPS",
    445: "SMB",
    3000: "Dashboard (Self)",
    3306: "MySQL",
    3389: "RDP",
    5000: "AirPlay/Control",
    5432: "PostgreSQL",
    8080: "HTTP-Proxy"
}

def scan_port(ip, port):
    try:
        # Create a socket object
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.settimeout(1) # 1 second timeout for speed
        result = sock.connect_ex((ip, port))
        sock.close()
        
        service = COMMON_PORTS.get(port, "Unknown")
        
        if result == 0:
            return {"port": port, "status": "Open", "service": service}
        else:
            return {"port": port, "status": "Closed", "service": service}
    except Exception as e:
        return {"port": port, "status": "Error", "service": "Unknown", "error": str(e)}

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/scan', methods=['POST'])
def scan():
    data = request.json
    target = data.get('target', '127.0.0.1')
    
    # Resolve domain to IP if necessary
    try:
        target_ip = socket.gethostbyname(target)
    except socket.gaierror:
        return jsonify({"error": "Invalid hostname or IP address"}), 400

    results = []
    
    # Use ThreadPoolExecutor to scan ports in parallel
    with concurrent.futures.ThreadPoolExecutor(max_workers=20) as executor:
        # Create a dictionary to map futures to ports
        future_to_port = {executor.submit(scan_port, target_ip, port): port for port in COMMON_PORTS}
        
        for future in concurrent.futures.as_completed(future_to_port):
            results.append(future.result())

    # Sort results by port number
    results.sort(key=lambda x: x['port'])

    return jsonify({
        "target": target,
        "ip": target_ip,
        "results": results
    })

if __name__ == '__main__':
    app.run(debug=True, port=3000)
