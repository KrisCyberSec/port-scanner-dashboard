from flask import Flask, render_template, request, jsonify
import socket
import concurrent.futures
import time
import subprocess
import platform

app = Flask(__name__)

def get_local_ip():
    try:
        # Connect to an external server (doesn't actually send data) to get local interface IP
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        local_ip = s.getsockname()[0]
        s.close()
        return local_ip
    except:
        return "127.0.0.1"

def ping_host(ip):
    # Determine the ping command based on OS (Network+ Tip: OS differences matter!)
    param = '-n' if platform.system().lower() == 'windows' else '-c'
    timeout_param = '-w' if platform.system().lower() == 'windows' else '-W'
    timeout_val = '500' # 500ms timeout
    
    # Building the command: ping -c 1 -W 500 <ip>
    command = ['ping', param, '1', timeout_param, timeout_val, ip]
    
    try:
        # Run ping and hide output
        result = subprocess.call(command, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        if result == 0:
            return {"ip": ip, "status": "Active", "type": "Unknown Device"}
        return None
    except:
        return None

@app.route('/scan_network', methods=['POST'])
def scan_network():
    local_ip = get_local_ip()
    # Assume /24 subnet (Standard Home Network) - standard Network+ concept
    # If IP is 192.168.1.5, network is 192.168.1.0/24
    subnet = '.'.join(local_ip.split('.')[:-1]) + '.' 
    
    active_hosts = []
    
    # Scan .1 to .254
    with concurrent.futures.ThreadPoolExecutor(max_workers=50) as executor:
        futures = []
        for i in range(1, 255):
            ip = f"{subnet}{i}"
            futures.append(executor.submit(ping_host, ip))
            
        for future in concurrent.futures.as_completed(futures):
            result = future.result()
            if result:
                # Mark our own device
                if result['ip'] == local_ip:
                    result['type'] = "This Device (You)"
                active_hosts.append(result)

    # Sort by IP address
    active_hosts.sort(key=lambda x: int(x['ip'].split('.')[-1]))

    return jsonify({
        "network": f"{subnet}0/24",
        "local_ip": local_ip,
        "hosts": active_hosts
    })

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
        sock.settimeout(1.5) # Slightly longer timeout for banner/response
        result = sock.connect_ex((ip, port))
        
        service = COMMON_PORTS.get(port, "Unknown")
        banner = "No service banner"
        
        if result == 0:
            # Banner Grabbing: Try to read the service version
            try:
                # If it's a web port, we often need to "speak" first to get a reply
                if port in [80, 8080, 3000, 5000]:
                    sock.send(b'HEAD / HTTP/1.1\r\n\r\n')
                
                # Listen for a response
                banner_bytes = sock.recv(1024)
                
                # Cleanup and decode the banner
                banner = banner_bytes.decode('utf-8', errors='ignore').strip()
                # If it's an HTTP response, just grab the first line (Server version usually)
                if '\n' in banner:
                    banner = banner.split('\n')[0]
            except:
                # If it connects but stays silent (timeout), allow it
                pass
                
            sock.close()
            return {"port": port, "status": "Open", "service": service, "banner": banner}
        else:
            sock.close()
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
