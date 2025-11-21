# McManager

Milk Collection Manager - An Angular application for managing milk collection ledgers, customer passbooks, and billing.

## Table of Contents
- [Development Server](#development-server)
- [Database Setup](#database-setup)
  - [Local Development Setup](#local-development-setup)
  - [Production Server Setup](#production-server-setup)
- [Building](#building)
- [Testing](#testing)
- [Additional Resources](#additional-resources)

## Development server

To start a local development server, run:

```bash
ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

## Database Setup

This application uses CouchDB as the backend database. Both development and production databases run on the same Ubuntu server instance (192.168.1.224).

### Ubuntu Server Setup with Nginx + Ngrok

**Architecture Overview:**
- **CouchDB**: Running on localhost:5984 (not exposed directly)
- **Databases**: `mcm_dev` (development) and `mc_manager_prod` (production) on same instance
- **Nginx**: Reverse proxy on local network for Fauxton UI (http://192.168.1.224)
- **Ngrok**: Tunnel for external API access (https://your-ngrok-url.app → Nginx → CouchDB)
- **Mode**: Standalone (no cluster)
- **Fauxton UI**: Accessible only on intranet via Nginx
- **API Access**: Available both locally (Nginx) and externally (Ngrok)

#### Step 1: Install CouchDB on Ubuntu Server

```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Install required dependencies
sudo apt install -y curl apt-transport-https gnupg ca-certificates

# Add Apache CouchDB repository key
curl https://couchdb.apache.org/repo/keys.asc | gpg --dearmor | sudo tee /usr/share/keyrings/couchdb-archive-keyring.gpg >/dev/null 2>&1

# Add CouchDB repository (for Ubuntu 22.04 Jammy)
echo "deb [signed-by=/usr/share/keyrings/couchdb-archive-keyring.gpg] https://apache.jfrog.io/artifactory/couchdb-deb/ jammy main" | sudo tee /etc/apt/sources.list.d/couchdb.list

# For Ubuntu 20.04 LTS use:
# echo "deb [signed-by=/usr/share/keyrings/couchdb-archive-keyring.gpg] https://apache.jfrog.io/artifactory/couchdb-deb/ focal main" | sudo tee /etc/apt/sources.list.d/couchdb.list

# Update package list
sudo apt update

# Install CouchDB
sudo apt install -y couchdb
```

**During installation, configure:**
1. **Setup type**: Select `standalone`
2. **Bind address**: Enter `127.0.0.1` (localhost only - we'll use Nginx as proxy)
3. **Admin password**: Set a strong password (e.g., `YourSecurePassword123!`)
4. **Cookie secret**: Accept the default (auto-generated)

**Verify installation:**
```bash
# Check CouchDB status
sudo systemctl status couchdb

# Test local access
curl http://127.0.0.1:5984/
# Expected: {"couchdb":"Welcome","version":"3.x.x",...}

# Enable CouchDB to start on boot
sudo systemctl enable couchdb
```

#### Step 2: Configure CouchDB for Production

**Edit CouchDB local configuration:**
```bash
sudo nano /opt/couchdb/etc/local.ini
```

**Add/Update these sections:**
```ini
[couchdb]
single_node=true

[chttpd]
bind_address = 127.0.0.1
port = 5984

[httpd]
bind_address = 127.0.0.1
port = 5984

[cors]
origins = http://192.168.1.224, https://*.ngrok-free.app, https://*.ngrok.app, https://*.ngrok.io
credentials = true
headers = accept, authorization, content-type, origin, referer, x-requested-with
methods = GET, PUT, POST, HEAD, DELETE, OPTIONS
max_age = 3600

[log]
level = info
```

**Save and exit** (Ctrl+X, then Y, then Enter)

**Restart CouchDB:**
```bash
sudo systemctl restart couchdb
sudo systemctl status couchdb

# Verify it's listening only on localhost
sudo netstat -tulpn | grep 5984
# Should show: 127.0.0.1:5984 (NOT 0.0.0.0:5984)
```

**Enable CORS via API:**
```bash
# Replace 'admin:YourSecurePassword123!' with your actual credentials
curl -X PUT http://admin:YourSecurePassword123!@127.0.0.1:5984/_node/_local/_config/httpd/enable_cors -d '"true"'

curl -X PUT http://admin:YourSecurePassword123!@127.0.0.1:5984/_node/_local/_config/cors/credentials -d '"true"'

curl -X PUT http://admin:YourSecurePassword123!@127.0.0.1:5984/_node/_local/_config/cors/origins -d '"http://192.168.1.224, https://*.ngrok-free.app, https://*.ngrok.app, https://*.ngrok.io"'

curl -X PUT http://admin:YourSecurePassword123!@127.0.0.1:5984/_node/_local/_config/cors/methods -d '"GET, PUT, POST, HEAD, DELETE, OPTIONS"'

curl -X PUT http://admin:YourSecurePassword123!@127.0.0.1:5984/_node/_local/_config/cors/headers -d '"accept, authorization, content-type, origin, referer, x-requested-with"'

# Verify CORS settings
curl http://admin:YourSecurePassword123!@127.0.0.1:5984/_node/_local/_config/cors
```

#### Step 3: Install and Configure Nginx

**Install Nginx:**
```bash
sudo apt install -y nginx

# Check Nginx status
sudo systemctl status nginx
sudo systemctl enable nginx
```

**Create Nginx configuration for CouchDB:**
```bash
sudo nano /etc/nginx/sites-available/couchdb
```

**Add this configuration:**
```nginx
# CouchDB Reverse Proxy Configuration
# Fauxton UI accessible only on intranet
# API accessible via both intranet and ngrok tunnel

server {
    listen 80;
    server_name 192.168.1.224;

    # Increase buffer sizes for CouchDB
    client_max_body_size 100M;
    proxy_buffers 8 16k;
    proxy_buffer_size 32k;

    # Security headers
    add_header X-Content-Type-Options nosniff;
    add_header X-Frame-Options SAMEORIGIN;
    add_header X-XSS-Protection "1; mode=block";

    # Logging
    access_log /var/log/nginx/couchdb_access.log;
    error_log /var/log/nginx/couchdb_error.log;

    # Root location - redirect to Fauxton
    location = / {
        return 301 /_utils/;
    }

    # Fauxton UI - restrict to intranet only
    location /_utils {
        # Allow only local network
        allow 192.168.1.0/24;
        deny all;

        proxy_pass http://127.0.0.1:5984;
        proxy_redirect off;
        proxy_buffering off;
        
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # API endpoints - accessible from anywhere (for ngrok)
    location / {
        # No IP restriction - ngrok will access this
        proxy_pass http://127.0.0.1:5984;
        proxy_redirect off;
        proxy_buffering off;
        
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Handle OPTIONS for CORS preflight
        if ($request_method = 'OPTIONS') {
            add_header 'Access-Control-Allow-Origin' '*';
            add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS';
            add_header 'Access-Control-Allow-Headers' 'DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range,Authorization';
            add_header 'Access-Control-Max-Age' 3600;
            add_header 'Content-Type' 'text/plain; charset=utf-8';
            add_header 'Content-Length' 0;
            return 204;
        }
    }
}
```

**Enable the site:**
```bash
# Create symbolic link to enable the site
sudo ln -s /etc/nginx/sites-available/couchdb /etc/nginx/sites-enabled/

# Remove default site if it exists
sudo rm -f /etc/nginx/sites-enabled/default

# Test Nginx configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

**Test Nginx proxy:**
```bash
# Test from the server itself
curl http://127.0.0.1/
# Should return CouchDB welcome message

# Test from another machine on the network
curl http://192.168.1.224/
# Should return CouchDB welcome message

# Test Fauxton UI access (from browser on intranet)
# Open: http://192.168.1.224/_utils
```

#### Step 4: Install and Configure Ngrok

**Create dedicated user for Ngrok (recommended for security):**
```bash
# Create a system user without shell access for running ngrok
sudo useradd -r -s /bin/false -m -d /opt/ngrok ngrok-user

# Create ngrok directory
sudo mkdir -p /opt/ngrok
sudo chown ngrok-user:ngrok-user /opt/ngrok
```

**Install Ngrok:**
```bash
# Download ngrok (ARM64 for Raspberry Pi, AMD64 for standard servers)
# For AMD64:
curl -s https://ngrok-agent.s3.amazonaws.com/ngrok.asc | sudo tee /etc/apt/trusted.gpg.d/ngrok.asc >/dev/null
echo "deb https://ngrok-agent.s3.amazonaws.com buster main" | sudo tee /etc/apt/sources.list.d/ngrok.list
sudo apt update
sudo apt install ngrok

# Verify installation
ngrok version

# Set up ngrok for the dedicated user
sudo -u ngrok-user ngrok config add-authtoken YOUR_NGROK_AUTH_TOKEN
```

**Create ngrok configuration file for the dedicated user:**
```bash
sudo nano /opt/ngrok/ngrok.yml
```

**Add this configuration:**
```yaml
version: "2"
authtoken: YOUR_NGROK_AUTH_TOKEN

tunnels:
  couchdb:
    proto: http
    addr: 192.168.1.224:80
    bind_tls: true
    inspect: false
```

**Set proper ownership:**
```bash
sudo chown ngrok-user:ngrok-user /opt/ngrok/ngrok.yml
sudo chmod 600 /opt/ngrok/ngrok.yml
```

**Test ngrok tunnel (as your regular user for testing):**
```bash
# First, authenticate with your account (only for testing)
ngrok config add-authtoken YOUR_NGROK_AUTH_TOKEN

# Start ngrok (this will run in foreground for testing)
ngrok http 192.168.1.224:80

# You'll see output like:
# Forwarding  https://abc123.ngrok-free.app -> http://192.168.1.224:80
# Copy this URL - this is your public API endpoint

# Press Ctrl+C to stop the test
```

**Set up Ngrok as a systemd service (for automatic startup):**
```bash
sudo nano /etc/systemd/system/ngrok.service
```

**Add this service configuration:**
```ini
[Unit]
Description=Ngrok Tunnel Service
After=network.target nginx.service

[Service]
Type=simple
User=ngrok-user
Group=ngrok-user
WorkingDirectory=/opt/ngrok
ExecStart=/usr/bin/ngrok start --all --config /opt/ngrok/ngrok.yml
Restart=always
RestartSec=10

# Security hardening
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ProtectHome=true
ReadWritePaths=/opt/ngrok

[Install]
WantedBy=multi-user.target
```

**Enable and start ngrok service:**
```bash
# Reload systemd
sudo systemctl daemon-reload

# Enable ngrok to start on boot
sudo systemctl enable ngrok

# Start ngrok service
sudo systemctl start ngrok

# Check status
sudo systemctl status ngrok

# View ngrok logs
sudo journalctl -u ngrok -f
```

**Get your public ngrok URL:**
```bash
# Install jq for JSON parsing (if not installed)
sudo apt install -y jq

# Get ngrok URL via API
curl http://127.0.0.1:4040/api/tunnels | jq -r '.tunnels[0].public_url'

# Or view in web interface (only accessible locally)
# Open: http://127.0.0.1:4040
```

#### Step 5: Create Databases (Development and Production)

**Create both databases on the same CouchDB instance:**

```bash
# Development database
curl -X PUT http://admin:YourSecurePassword123!@192.168.1.224/mcm_dev

# Production database
curl -X PUT http://admin:YourSecurePassword123!@192.168.1.224/mc_manager_prod

# Expected response for each: {"ok":true}
```

**Verify database creation:**
```bash
# List all databases
curl http://admin:YourSecurePassword123!@192.168.1.224/_all_dbs

# Get development database info
curl http://admin:YourSecurePassword123!@192.168.1.224/mcm_dev

# Get production database info
curl http://admin:YourSecurePassword123!@192.168.1.224/mc_manager_prod
```

**Set database security (both databases):**
```bash
# Development database security
curl -X PUT http://admin:YourSecurePassword123!@192.168.1.224/mcm_dev/_security \
  -H "Content-Type: application/json" \
  -d '{
    "admins": {
      "names": ["admin"],
      "roles": ["_admin"]
    },
    "members": {
      "names": ["admin"],
      "roles": []
    }
  }'

# Production database security
curl -X PUT http://admin:YourSecurePassword123!@192.168.1.224/mc_manager_prod/_security \
  -H "Content-Type: application/json" \
  -d '{
    "admins": {
      "names": ["admin"],
      "roles": ["_admin"]
    },
    "members": {
      "names": ["admin"],
      "roles": []
    }
  }'

# Verify security settings
curl http://admin:YourSecurePassword123!@192.168.1.224/mcm_dev/_security
curl http://admin:YourSecurePassword123!@192.168.1.224/mc_manager_prod/_security
```

#### Step 6: Configure Firewall

**Configure UFW firewall:**
```bash
# Allow SSH (important - don't lock yourself out!)
sudo ufw allow 22/tcp

# Allow HTTP from local network only (for Nginx)
sudo ufw allow from 192.168.1.0/24 to any port 80 proto tcp

# Allow ngrok to connect outbound (usually allowed by default)
# No inbound rules needed for ngrok

# Enable firewall
sudo ufw enable

# Check status
sudo ufw status numbered

# Verify CouchDB port 5984 is NOT exposed
sudo ufw status | grep 5984
# Should return nothing - port 5984 blocked from outside
```

**Verify firewall rules:**
```bash
# Check what's listening on external interfaces
sudo netstat -tulpn | grep LISTEN

# CouchDB should only show 127.0.0.1:5984
# Nginx should show 0.0.0.0:80 or specific IP
```

#### Step 7: Test Complete Setup

**Test 1: Local CouchDB access (should work):**
```bash
curl http://127.0.0.1:5984/
```

**Test 2: Nginx proxy on intranet (should work from local network):**
```bash
# From server or any machine on 192.168.1.x network
curl http://192.168.1.224/
curl http://192.168.1.224/mcm_dev
curl http://192.168.1.224/mc_manager_prod
```

**Test 3: Fauxton UI on intranet (from browser on local network):**
```
http://192.168.1.224/_utils
# Should show CouchDB admin interface
# Login with admin credentials
# Both databases (mcm_dev and mc_manager_prod) should be visible
```

**Test 4: Direct CouchDB access from outside (should fail):**
```bash
# From external machine - should timeout or be refused
curl http://192.168.1.224:5984/
# Should fail - port not open
```

**Test 5: API access via ngrok (should work from anywhere):**
```bash
# Get your ngrok URL
NGROK_URL=$(curl -s http://127.0.0.1:4040/api/tunnels | jq -r '.tunnels[0].public_url')
echo $NGROK_URL

# Test from anywhere (even from external internet)
curl $NGROK_URL/
curl $NGROK_URL/_all_dbs -u admin:YourSecurePassword123!
curl $NGROK_URL/mcm_dev -u admin:YourSecurePassword123!
curl $NGROK_URL/mc_manager_prod -u admin:YourSecurePassword123!
```

**Test 6: Fauxton UI via ngrok (should be blocked):**
```bash
# This should return 403 Forbidden (IP not in allowed range)
curl $NGROK_URL/_utils/
```

#### Step 8: Update Angular Environment Configuration

**For development with local database, edit `src/environments/environment.ts`:**
```typescript
export const environment = {
  production: false,
  BASE_URL: 'http://192.168.1.224',  // Nginx proxy on local network
  DB_NAME: 'mcm_dev'  // Development database
};
```

**For production with production database, edit `src/environments/environment.prod.ts`:**
```typescript
export const environment = {
  production: true,
  BASE_URL: 'https://your-actual-ngrok-url.ngrok-free.app',  // Update with your real ngrok URL
  DB_NAME: 'mc_manager_prod'  // Production database
};
```

**Note on Database Usage:**
- **Development**: Use `mcm_dev` database for testing and development
- **Production**: Use `mc_manager_prod` database for live data
- Both databases run on the same CouchDB instance (192.168.1.224)
- Switch between them by updating the `DB_NAME` in environment files

**Note on Ngrok URL:** The ngrok URL changes on restart with free tier. Consider:
1. Using ngrok's static domain feature (paid)
2. Or updating the environment file when ngrok restarts
3. Or creating a script to fetch the current ngrok URL dynamically

**Create a helper script to get current ngrok URL:**
```bash
nano ~/get-ngrok-url.sh
```

```bash
#!/bin/bash
# Get current ngrok URL
NGROK_URL=$(curl -s http://127.0.0.1:4040/api/tunnels | jq -r '.tunnels[0].public_url')
echo "Current ngrok URL: $NGROK_URL"
echo "Update your environment.prod.ts BASE_URL to: $NGROK_URL"
```

```bash
chmod +x ~/get-ngrok-url.sh
./get-ngrok-url.sh
```

#### Step 9: Monitoring and Maintenance

**Monitor CouchDB:**
```bash
# View CouchDB logs
sudo tail -f /var/log/couchdb/couchdb.log

# Check CouchDB stats
curl http://admin:YourSecurePassword123!@192.168.1.224/_stats
```

**Monitor Nginx:**
```bash
# View Nginx access logs
sudo tail -f /var/log/nginx/couchdb_access.log

# View Nginx error logs
sudo tail -f /var/log/nginx/couchdb_error.log

# Test Nginx configuration
sudo nginx -t

# Reload Nginx (after config changes)
sudo systemctl reload nginx
```

**Monitor Ngrok:**
```bash
# Check ngrok service status
sudo systemctl status ngrok

# View ngrok logs
sudo journalctl -u ngrok -f

# Check active tunnels
curl http://127.0.0.1:4040/api/tunnels

# Get current public URL
curl -s http://127.0.0.1:4040/api/tunnels | jq -r '.tunnels[0].public_url'
```

**Restart services if needed:**
```bash
# Restart CouchDB
sudo systemctl restart couchdb

# Restart Nginx
sudo systemctl restart nginx

# Restart Ngrok
sudo systemctl restart ngrok

# Restart all
sudo systemctl restart couchdb nginx ngrok
```

#### Complete Verification Checklist

```bash
# 1. CouchDB running on localhost only
sudo netstat -tulpn | grep 5984 | grep 127.0.0.1

# 2. Nginx running and proxying
curl http://192.168.1.224/ | grep couchdb

# 3. Fauxton accessible on intranet
curl -I http://192.168.1.224/_utils/ | grep "200\|302"

# 4. Both databases exist
curl http://admin:YourSecurePassword123!@192.168.1.224/_all_dbs | grep -E "mcm_dev|mc_manager_prod"

# 5. Ngrok tunnel active
curl -s http://127.0.0.1:4040/api/tunnels | jq -r '.tunnels[0].public_url'

# 6. External API access works (replace with your ngrok URL)
curl https://your-ngrok-url.ngrok-free.app/

# 7. Both databases accessible via ngrok
curl https://your-ngrok-url.ngrok-free.app/_all_dbs -u admin:YourSecurePassword123!

# 8. Fauxton blocked via ngrok
curl -I https://your-ngrok-url.ngrok-free.app/_utils/ | grep "403"

# 9. Firewall properly configured
sudo ufw status | grep -E "80|5984"
```

#### Security Best Practices

1. **Strong Passwords**: Use complex passwords for CouchDB admin
2. **Regular Updates**: Keep Ubuntu, CouchDB, and Nginx updated
   ```bash
   sudo apt update && sudo apt upgrade -y
   ```

3. **Monitor Access**: Regularly check Nginx logs for suspicious activity
   ```bash
   sudo grep "POST\|PUT\|DELETE" /var/log/nginx/couchdb_access.log
   ```

4. **Backup Database**: Set up automated backups
   ```bash
   # Create backup script
   sudo nano /opt/backup-couchdb.sh
   ```

5. **Ngrok Security**: 
   - Consider upgrading to ngrok paid plan for:
     - Static domain (no URL changes)
     - IP whitelisting
     - Custom branding
   - Or use alternative: Cloudflare Tunnel, FRP, etc.

6. **HTTPS on Local Network** (Optional):
   - Generate self-signed certificate for intranet
   - Configure Nginx with SSL for local access

#### Optional: Set Up SSL/HTTPS with Let's Encrypt (If using a domain)

If you have a domain pointing to your server and want HTTPS on the local network:

**Install Certbot:**
```bash
sudo apt install certbot python3-certbot-nginx
```

**Get SSL certificate:**
```bash
# Make sure your domain points to your server
sudo certbot --nginx -d your-domain.com
```

**Update Nginx configuration to use HTTPS:**
```bash
sudo nano /etc/nginx/sites-available/couchdb
# Certbot will auto-configure, or manually add SSL directives
```

**Auto-renewal:**
```bash
# Test renewal
sudo certbot renew --dry-run

# Renewal is automatic via systemd timer
sudo systemctl status certbot.timer
```

#### Troubleshooting Common Issues

**Issue 1: Can't access Fauxton from browser**
```bash
# Check if Nginx is running
sudo systemctl status nginx

# Check Nginx configuration
sudo nginx -t

# Check if you're on the allowed network
ip addr show

# Test with curl
curl -I http://192.168.1.224/_utils/
```

**Issue 2: Ngrok tunnel not working**
```bash
# Check ngrok service
sudo systemctl status ngrok

# View ngrok logs
sudo journalctl -u ngrok -n 50

# Check if tunnel is active
curl http://127.0.0.1:4040/api/tunnels

# Restart ngrok
sudo systemctl restart ngrok
```

**Issue 3: CouchDB not accessible via Nginx**
```bash
# Check if CouchDB is running
sudo systemctl status couchdb

# Check if CouchDB is listening
sudo netstat -tulpn | grep 5984

# Test direct CouchDB access
curl http://127.0.0.1:5984/

# Check Nginx error logs
sudo tail -f /var/log/nginx/couchdb_error.log
```

**Issue 4: CORS errors in Angular app**
```bash
# Re-verify CORS settings
curl http://admin:password@127.0.0.1:5984/_node/_local/_config/cors

# Update CORS origins to include your ngrok domain
curl -X PUT http://admin:password@127.0.0.1:5984/_node/_local/_config/cors/origins \
  -d '"http://192.168.1.224, https://your-actual-ngrok-url.ngrok-free.app"'

# Restart CouchDB
sudo systemctl restart couchdb
```

**Issue 5: Can't connect from external network via ngrok**
```bash
# Get current ngrok URL
curl -s http://127.0.0.1:4040/api/tunnels | jq

# If empty, ngrok isn't running
sudo systemctl start ngrok

# Check ngrok logs for errors
sudo journalctl -u ngrok -f

# Test ngrok URL
NGROK_URL=$(curl -s http://127.0.0.1:4040/api/tunnels | jq -r '.tunnels[0].public_url')
curl $NGROK_URL/
```

**Issue 6: Ngrok URL keeps changing**
```bash
# This is expected with free tier
# Solutions:
# 1. Upgrade to ngrok paid plan for static domain
# 2. Create systemd service to update environment file automatically
# 3. Use ngrok API to fetch current URL dynamically in your app
```

**Issue 7: Database backup fails**
```bash
# Check disk space
df -h

# Check CouchDB is accessible
curl http://admin:password@127.0.0.1:5984/mc_manager_prod

# Test backup manually
curl -X GET "http://admin:password@127.0.0.1:5984/mc_manager_prod/_all_docs?include_docs=true" > backup.json

# Check file size
ls -lh backup.json
```

#### 8. Database Backup Strategy

**Automated Backup Script:**
```bash
#!/bin/bash
# Save as /opt/backup-couchdb.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backup/couchdb"
DB_NAME="mc_manager_prod"
ADMIN="admin"
PASSWORD="your_password"

mkdir -p $BACKUP_DIR

curl -X GET "http://$ADMIN:$PASSWORD@localhost:5984/$DB_NAME/_all_docs?include_docs=true" \
  -o "$BACKUP_DIR/${DB_NAME}_backup_$DATE.json"

# Keep only last 30 days of backups
find $BACKUP_DIR -name "*.json" -mtime +30 -delete

echo "Backup completed: ${DB_NAME}_backup_$DATE.json"
```

**Set up Cron Job:**
```bash
# Make script executable
sudo chmod +x /opt/backup-couchdb.sh

# Add to crontab (daily at 2 AM)
sudo crontab -e
0 2 * * * /opt/backup-couchdb.sh >> /var/log/couchdb-backup.log 2>&1
```

#### 9. Monitoring and Maintenance

**Check CouchDB Logs:**
```bash
sudo tail -f /var/log/couchdb/couchdb.log
```

**Check Database Size:**
```bash
curl http://admin:password@localhost:5984/mc_manager_prod | jq '.disk_size'
```

**Compact Database (if needed):**
```bash
curl -H "Content-Type: application/json" \
  -X POST http://admin:password@localhost:5984/mc_manager_prod/_compact
```

### Database Migration (Local to Production)

To copy data from local development to production:

```bash
# Export from local
curl -X GET "http://admin:password@localhost:5984/mcm_dev/_all_docs?include_docs=true" \
  -o mcm_dev_export.json

# Import to production (from same machine or transfer file first)
curl -X POST "http://admin:password@YOUR_SERVER_IP:5984/mc_manager_prod/_bulk_docs" \
  -H "Content-Type: application/json" \
  -d @mcm_dev_export.json
```

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

**Production Build:**
```bash
ng build --configuration production
```

## Running unit tests

To execute unit tests with the [Karma](https://karma-runner.github.io) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.

## Troubleshooting

### CouchDB Connection Issues

1. **CORS errors in browser console:**
   - Verify CORS is enabled in CouchDB configuration
   - Check browser network tab for preflight requests

2. **Cannot connect to CouchDB:**
   - Verify CouchDB is running: `systemctl status couchdb`
   - Check firewall rules
   - Verify bind_address in configuration

3. **Authentication errors:**
   - Verify admin credentials
   - Check database security settings

4. **Database not found:**
   - Verify database name matches environment configuration
   - Create database if it doesn't exist

## License

This project is licensed under the MIT License.

