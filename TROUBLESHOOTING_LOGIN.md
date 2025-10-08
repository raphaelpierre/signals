# Troubleshooting Login Issues

## Problem: Network Error on Login

If you're getting a "Network Error" when trying to login, here are the solutions:

### Solution 1: Check Services Are Running

```bash
docker compose ps

# All services should show "running"
# If not, restart:
docker compose up -d
```

### Solution 2: Verify Backend is Accessible

```bash
# Test backend health
curl http://localhost:8000/health

# Should return: {"status": "ok", "service": "Signals Backend"}
```

### Solution 3: Test Login Directly

```bash
# Register a test user
curl -X POST http://localhost:8000/api/v1/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"email":"test@example.com","password":"testpassword"}'

# Try login
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H 'Content-Type: application/x-www-form-urlencoded' \
  -d 'username=test@example.com&password=testpassword'

# Should return a JWT token
```

### Solution 4: Check Frontend API URL

The frontend needs to know where the backend is. Check the `docker-compose.yml`:

```yaml
frontend:
  environment:
    NEXT_PUBLIC_API_URL: http://localhost:8000/api/v1
```

**Important**: If you're accessing the app from a browser, the frontend (which runs in the browser) needs to connect to `localhost:8000`. Make sure:

1. Backend is accessible at http://localhost:8000
2. No firewall is blocking port 8000

### Solution 5: Check Browser Console

Open your browser's Developer Tools (F12) and check the Console tab for errors. You might see:

- CORS errors → Backend CORS is configured, but check logs
- Connection refused → Backend not running
- 404 errors → API endpoint mismatch

### Solution 6: Check Backend Logs

```bash
# Watch backend logs in real-time
docker compose logs -f backend

# You should see login attempts:
# INFO: 192.168.65.1:xxxxx - "POST /api/v1/auth/login HTTP/1.1" 200 OK
```

### Solution 7: Restart Everything

Sometimes a clean restart fixes issues:

```bash
# Stop all services
docker compose down

# Start fresh
docker compose up -d

# Wait 10 seconds for services to start
sleep 10

# Test backend
curl http://localhost:8000/health

# Access frontend
open http://localhost:3000
```

### Solution 8: Create a Test User via Database

If registration isn't working, create a user directly:

```bash
docker compose exec backend python3 << 'EOF'
from app.db.session import SessionLocal
from app.models.user import User
from app.core.security import get_password_hash

db = SessionLocal()
user = User(
    email="admin@example.com",
    hashed_password=get_password_hash("password123"),
    is_active=True
)
db.add(user)
db.commit()
print(f"Created user: {user.email}")
EOF
```

Then login with:
- Email: admin@example.com
- Password: password123

### Common Issues

#### Issue: "Incorrect email or password"
**Solution**: The user doesn't exist. Register first at http://localhost:3000/register

#### Issue: "Network Error" in browser
**Solutions**:
1. Check backend is running: `curl http://localhost:8000/health`
2. Check frontend can reach backend
3. Clear browser cache and cookies
4. Try incognito/private mode

#### Issue: "Failed to connect to localhost port 8000"
**Solution**: Backend isn't running. Start it:
```bash
docker compose up -d backend
docker compose logs -f backend
```

#### Issue: CORS error in browser console
**Solution**: This shouldn't happen with the current setup, but if it does:
```bash
# Check CORS_ORIGINS in docker-compose.yml
docker compose exec backend env | grep CORS
```

### Quick Test Script

Run this to verify everything:

```bash
#!/bin/bash

echo "=== SignalStack Login Troubleshooting ==="
echo

echo "1. Testing backend health..."
curl -s http://localhost:8000/health | python3 -m json.tool
echo

echo "2. Testing frontend..."
curl -s http://localhost:3000 | head -1
echo

echo "3. Checking services..."
docker compose ps
echo

echo "4. Creating test user..."
curl -s -X POST http://localhost:8000/api/v1/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"email":"test@example.com","password":"testpassword"}' | python3 -m json.tool
echo

echo "5. Testing login..."
TOKEN=$(curl -s -X POST http://localhost:8000/api/v1/auth/login \
  -H 'Content-Type: application/x-www-form-urlencoded' \
  -d 'username=test@example.com&password=testpassword' | python3 -c "import sys, json; print(json.load(sys.stdin).get('access_token', 'FAILED'))")

if [ "$TOKEN" != "FAILED" ]; then
  echo "✅ Login successful! Token: ${TOKEN:0:50}..."
else
  echo "❌ Login failed"
fi
echo

echo "=== Troubleshooting Complete ==="
echo
echo "If login works in curl but not in browser:"
echo "  1. Open browser DevTools (F12)"
echo "  2. Check Console for errors"
echo "  3. Check Network tab for failed requests"
echo "  4. Try clearing cookies and cache"
```

Save this as `test_login.sh`, make it executable, and run it:

```bash
chmod +x test_login.sh
./test_login.sh
```

### Still Having Issues?

If none of the above works:

1. Check all services are running:
   ```bash
   docker compose ps
   ```

2. View all logs:
   ```bash
   docker compose logs --tail=100
   ```

3. Restart with fresh containers:
   ```bash
   docker compose down -v
   docker compose up -d --build
   ```

4. Test with curl (bypasses frontend):
   ```bash
   # Register
   curl -X POST http://localhost:8000/api/v1/auth/register \
     -H 'Content-Type: application/json' \
     -d '{"email":"your@email.com","password":"yourpassword"}'

   # Login
   curl -X POST http://localhost:8000/api/v1/auth/login \
     -H 'Content-Type: application/x-www-form-urlencoded' \
     -d 'username=your@email.com&password=yourpassword'
   ```

### Working Credentials for Testing

A test user has been created with:
- **Email**: test@example.com
- **Password**: testpassword

Try logging in with these credentials at http://localhost:3000/login

---

## Success! 🎉

Once you can login successfully:

1. You'll get a JWT token
2. You can access protected endpoints
3. You can view signals at http://localhost:3000/dashboard
4. API docs are at http://localhost:8000/docs

For more help, see:
- `IMPROVEMENTS.md` - Full documentation
- `QUICK_START.md` - Quick reference
- `POST_MIGRATION_CHECKLIST.md` - Verification steps
