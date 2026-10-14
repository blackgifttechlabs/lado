#!/usr/bin/env python3
# Dev server that tells the browser never to cache, so edits show up on a normal reload.
import http.server, sys
class H(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store, must-revalidate'); super().end_headers()
http.server.ThreadingHTTPServer(('0.0.0.0', int(sys.argv[1]) if len(sys.argv) > 1 else 8000), H).serve_forever()
