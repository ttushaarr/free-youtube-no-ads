#!/usr/bin/env python3
import http.server
import socketserver
import mimetypes
import os
import sys

PORT = 8080
DIRECTORY = os.path.dirname(os.path.abspath(__file__))

# Ensure correct mime types for APK and ZIP downloads
mimetypes.init()
mimetypes.add_type('application/vnd.android.package-archive', '.apk')
mimetypes.add_type('application/zip', '.zip')
mimetypes.add_type('text/css', '.css')
mimetypes.add_type('application/javascript', '.js')
mimetypes.add_type('image/png', '.png')

class CustomHTTPHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

    def end_headers(self):
        # Enable CORS and caching headers for downloads
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
        super().end_headers()

    def guess_type(self, path):
        if path.endswith('.apk'):
            return 'application/vnd.android.package-archive'
        if path.endswith('.zip'):
            return 'application/zip'
        return super().guess_type(path)

class ThreadingHTTPServer(socketserver.ThreadingMixIn, http.server.HTTPServer):
    daemon_threads = True
    allow_reuse_address = True

if __name__ == '__main__':
    with ThreadingHTTPServer(('0.0.0.0', PORT), CustomHTTPHandler) as httpd:
        print(f"======================================================")
        print(f"🚀 BraveTube Live Website is running!")
        print(f"Local Access:   http://localhost:{PORT}")
        print(f"Network Access: http://10.255.228.133:{PORT}")
        print(f"Direct APK:     http://10.255.228.133:{PORT}/downloads/BraveTube.apk")
        print(f"======================================================")
        sys.stdout.flush()
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nShutting down server.")
