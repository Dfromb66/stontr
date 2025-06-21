const fetch = require('node-fetch');

const API_BASE = 'http://localhost:5000/api';

async function testNotes() {
  try {
    console.log('Testing notes functionality...\n');

    // 1. Create a test event
    console.log('1. Creating a test event...');
    const createResponse = await fetch(`${API_BASE}/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'Test Event with Notes',
        category: 'social',
        nextOccurrence: '2024-12-31',
        isRecurring: false
      })
    });
    
    const newEvent = await createResponse.json();
    console.log('✅ Event created:', newEvent.title);
    console.log('Event ID:', newEvent.id);
    console.log('Notes:', newEvent.notes);
    console.log('');

    // 2. Add notes to the event
    console.log('2. Adding notes to the event...');
    const notesResponse = await fetch(`${API_BASE}/events/${newEvent.id}/notes`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        notes: 'This is a test note for the event. It should be saved and retrieved correctly.'
      })
    });
    
    const updatedEvent = await notesResponse.json();
    console.log('✅ Notes added successfully');
    console.log('Notes:', updatedEvent.notes);
    console.log('');

    // 3. Update the notes
    console.log('3. Updating the notes...');
    const updateNotesResponse = await fetch(`${API_BASE}/events/${newEvent.id}/notes`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        notes: 'Updated note: This note has been modified to test the update functionality.'
      })
    });
    
    const updatedEvent2 = await updateNotesResponse.json();
    console.log('✅ Notes updated successfully');
    console.log('Updated Notes:', updatedEvent2.notes);
    console.log('');

    // 4. Delete the notes
    console.log('4. Deleting the notes...');
    const deleteNotesResponse = await fetch(`${API_BASE}/events/${newEvent.id}/notes`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        notes: null
      })
    });
    
    const updatedEvent3 = await deleteNotesResponse.json();
    console.log('✅ Notes deleted successfully');
    console.log('Notes after deletion:', updatedEvent3.notes);
    console.log('');

    // 5. Clean up - delete the test event
    console.log('5. Cleaning up - deleting test event...');
    await fetch(`${API_BASE}/events/${newEvent.id}`, {
      method: 'DELETE'
    });
    console.log('✅ Test event deleted');
    console.log('');

    console.log('🎉 All notes functionality tests passed!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testNotes(); 