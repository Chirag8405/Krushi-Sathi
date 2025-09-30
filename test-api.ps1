# Test API using PowerShell
$body = @{
    question = "My corn plants have bugs eating them, what should I do?"
    lang = "en"
} | ConvertTo-Json

$headers = @{
    "Content-Type" = "application/json"
}

try {
    Write-Host "🧪 Testing API at http://localhost:8083/api/advisory"
    Write-Host "📤 Sending request with question about corn bugs..."
    
    $response = Invoke-RestMethod -Uri "http://localhost:8083/api/advisory" -Method POST -Body $body -Headers $headers -TimeoutSec 30
    
    Write-Host "✅ Response received!"
    Write-Host "📄 Title: $($response.title)"
    Write-Host "📝 Source: $($response.source)"
    Write-Host "📋 Steps count: $($response.steps.Count)"
    Write-Host "📃 Text preview: $($response.text.Substring(0, [Math]::Min(150, $response.text.Length)))..."
    
    if ($response.source -eq "ai") {
        Write-Host "🎉 SUCCESS: AI is working and generating dynamic responses!" -ForegroundColor Green
    } elseif ($response.source -eq "template") {
        Write-Host "⚠️  WARNING: API is falling back to template responses" -ForegroundColor Yellow
    }
    
} catch {
    Write-Host "❌ Error testing API: $($_.Exception.Message)" -ForegroundColor Red
}