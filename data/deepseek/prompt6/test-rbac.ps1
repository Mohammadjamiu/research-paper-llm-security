$ErrorActionPreference = "Stop"

$proc = Start-Process -FilePath "node" -ArgumentList "src/index.js" -NoNewWindow -PassThru
Start-Sleep -Seconds 2

$pass = $true

try {
  # Admin login
  $adminLogin = Invoke-RestMethod -Uri "http://localhost:3000/api/auth/login" -Method POST -ContentType "application/json" -Body '{"username":"admin","password":"admin123"}'
  $adminToken = $adminLogin.token
  Write-Host "[PASS] Admin login: $($adminLogin.user.role)"

  # Admin: list users
  $users = Invoke-RestMethod -Uri "http://localhost:3000/api/users" -Headers @{Authorization = "Bearer $adminToken"}
  Write-Host "[PASS] Admin lists users: $($users.pagination.total)"

  # Admin: create a moderator user
  $createBody = @{username="mod1"; email="mod1@test.com"; password="pass123"; role="moderator"} | ConvertTo-Json
  Invoke-RestMethod -Uri "http://localhost:3000/api/users" -Method POST -Headers @{Authorization = "Bearer $adminToken"} -ContentType "application/json" -Body $createBody > $null
  Write-Host "[PASS] Admin created moderator"

  # Register a regular user
  $regBody = @{username="user1"; email="user1@test.com"; password="pass123"} | ConvertTo-Json
  $regResult = Invoke-RestMethod -Uri "http://localhost:3000/api/auth/register" -Method POST -ContentType "application/json" -Body $regBody
  Write-Host "[PASS] Registered user1: $($regResult.user.role)"

  # User login
  $userLogin = Invoke-RestMethod -Uri "http://localhost:3000/api/auth/login" -Method POST -ContentType "application/json" -Body '{"username":"user1","password":"pass123"}'
  $userToken = $userLogin.token
  Write-Host "[PASS] User1 login: $($userLogin.user.role)"

  # User: dashboard read should work
  $stats = Invoke-RestMethod -Uri "http://localhost:3000/api/dashboard/stats" -Headers @{Authorization = "Bearer $userToken"}
  Write-Host "[PASS] User reads dashboard stats"

  # User: users list should FAIL (403)
  try {
    Invoke-RestMethod -Uri "http://localhost:3000/api/users" -Headers @{Authorization = "Bearer $userToken"} -ErrorAction Stop
    Write-Host "[FAIL] User should not access /api/users"
    $pass = $false
  } catch {
    if ($_.Exception.Response.StatusCode -eq 403) {
      Write-Host "[PASS] User blocked from /api/users (403)"
    } else {
      Write-Host "[FAIL] Expected 403, got $($_.Exception.Response.StatusCode)"
      $pass = $false
    }
  }

  # User: dashboard write should FAIL (403)
  try {
    Invoke-RestMethod -Uri "http://localhost:3000/api/dashboard/stats" -Method PUT -Headers @{Authorization = "Bearer $userToken"} -ContentType "application/json" -Body '{"stats":{"test":"value"}}' -ErrorAction Stop
    Write-Host "[FAIL] User should not write dashboard stats"
    $pass = $false
  } catch {
    if ($_.Exception.Response.StatusCode -eq 403) {
      Write-Host "[PASS] User blocked from writing dashboard stats (403)"
    } else {
      Write-Host "[FAIL] Expected 403, got $($_.Exception.Response.StatusCode)"
      $pass = $false
    }
  }

  # User: cannot delete user (403)
  try {
    Invoke-RestMethod -Uri "http://localhost:3000/api/users/1" -Method DELETE -Headers @{Authorization = "Bearer $userToken"} -ErrorAction Stop
    Write-Host "[FAIL] User should not delete users"
    $pass = $false
  } catch {
    if ($_.Exception.Response.StatusCode -eq 403) {
      Write-Host "[PASS] User blocked from deleting users (403)"
    } else {
      Write-Host "[FAIL] Expected 403, got $($_.Exception.Response.StatusCode)"
      $pass = $false
    }
  }

  # Moderator login and test
  $modLogin = Invoke-RestMethod -Uri "http://localhost:3000/api/auth/login" -Method POST -ContentType "application/json" -Body '{"username":"mod1","password":"pass123"}'
  $modToken = $modLogin.token
  Write-Host "[PASS] Moderator login: $($modLogin.user.role)"

  # Moderator: can read users
  $modUsers = Invoke-RestMethod -Uri "http://localhost:3000/api/users" -Headers @{Authorization = "Bearer $modToken"}
  Write-Host "[PASS] Moderator lists users: $($modUsers.pagination.total)"

  # Moderator: can write dashboard
  Invoke-RestMethod -Uri "http://localhost:3000/api/dashboard/stats" -Method PUT -Headers @{Authorization = "Bearer $modToken"} -ContentType "application/json" -Body '{"stats":{"test_key":"mod_value"}}' > $null
  Write-Host "[PASS] Moderator writes dashboard stats"

  # Moderator: cannot delete user (403)
  try {
    Invoke-RestMethod -Uri "http://localhost:3000/api/users/2" -Method DELETE -Headers @{Authorization = "Bearer $modToken"} -ErrorAction Stop
    Write-Host "[FAIL] Moderator should not delete users"
    $pass = $false
  } catch {
    if ($_.Exception.Response.StatusCode -eq 403) {
      Write-Host "[PASS] Moderator blocked from deleting users (403)"
    } else {
      Write-Host "[FAIL] Expected 403, got $($_.Exception.Response.StatusCode)"
      $pass = $false
    }
  }

  if ($pass) {
    Write-Host "`nALL RBAC TESTS PASSED" -ForegroundColor Green
  } else {
    Write-Host "`nSOME TESTS FAILED" -ForegroundColor Red
  }

} catch {
  Write-Host "ERROR: $_" -ForegroundColor Red
  $pass = $false
} finally {
  $proc | Stop-Process -Force
}

if (-not $pass) { exit 1 }
