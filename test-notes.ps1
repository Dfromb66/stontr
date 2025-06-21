$API_BASE = "http://localhost:5000/api"

Write-Host "Testing notes functionality..." -ForegroundColor Green
Write-Host ""

try {
    # 1. Create a test event
    Write-Host "1. Creating a test event..." -ForegroundColor Yellow
    $createBody = @{
        title = "Test Event with Notes"
        category = "social"
        nextOccurrence = "2024-12-31"
        isRecurring = $false
    } | ConvertTo-Json

    $newEvent = Invoke-RestMethod -Uri "$API_BASE/events" -Method POST -Body $createBody -ContentType "application/json"
    Write-Host "✅ Event created: $($newEvent.title)" -ForegroundColor Green
    Write-Host "Event ID: $($newEvent.id)" -ForegroundColor Cyan
    Write-Host "Notes: $($newEvent.notes)" -ForegroundColor Cyan
    Write-Host ""

    # 2. Add notes to the event
    Write-Host "2. Adding notes to the event..." -ForegroundColor Yellow
    $notesBody = @{
        notes = "This is a test note for the event. It should be saved and retrieved correctly."
    } | ConvertTo-Json

    $updatedEvent = Invoke-RestMethod -Uri "$API_BASE/events/$($newEvent.id)/notes" -Method PUT -Body $notesBody -ContentType "application/json"
    Write-Host "✅ Notes added successfully" -ForegroundColor Green
    Write-Host "Notes: $($updatedEvent.notes)" -ForegroundColor Cyan
    Write-Host ""

    # 3. Update the notes
    Write-Host "3. Updating the notes..." -ForegroundColor Yellow
    $updateNotesBody = @{
        notes = "Updated note: This note has been modified to test the update functionality."
    } | ConvertTo-Json

    $updatedEvent2 = Invoke-RestMethod -Uri "$API_BASE/events/$($newEvent.id)/notes" -Method PUT -Body $updateNotesBody -ContentType "application/json"
    Write-Host "✅ Notes updated successfully" -ForegroundColor Green
    Write-Host "Updated Notes: $($updatedEvent2.notes)" -ForegroundColor Cyan
    Write-Host ""

    # 4. Delete the notes
    Write-Host "4. Deleting the notes..." -ForegroundColor Yellow
    $deleteNotesBody = @{
        notes = $null
    } | ConvertTo-Json

    $updatedEvent3 = Invoke-RestMethod -Uri "$API_BASE/events/$($newEvent.id)/notes" -Method PUT -Body $deleteNotesBody -ContentType "application/json"
    Write-Host "✅ Notes deleted successfully" -ForegroundColor Green
    Write-Host "Notes after deletion: $($updatedEvent3.notes)" -ForegroundColor Cyan
    Write-Host ""

    # 5. Clean up - delete the test event
    Write-Host "5. Cleaning up - deleting test event..." -ForegroundColor Yellow
    Invoke-RestMethod -Uri "$API_BASE/events/$($newEvent.id)" -Method DELETE
    Write-Host "✅ Test event deleted" -ForegroundColor Green
    Write-Host ""

    Write-Host "🎉 All notes functionality tests passed!" -ForegroundColor Green

} catch {
    Write-Host "❌ Test failed: $($_.Exception.Message)" -ForegroundColor Red
} 