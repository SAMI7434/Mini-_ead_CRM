const axios = require('axios');

const API_BASE = 'http://localhost:3000';

async function runTests() {
  let leadId = null;

  try {
    console.log('=== Lead Management API Tests ===\n');

    console.log('1. Creating a lead...');
    const createResponse = await axios.post(`${API_BASE}/leads`, {
      name: 'Aman Gupta',
      email: 'aman@example.com',
      phone: '+91-9876543210',
      source: 'website'
    });
    console.log('Created:', createResponse.data);
    leadId = createResponse.data.id;

    console.log('\n2. Getting lead by ID...');
    const getResponse = await axios.get(`${API_BASE}/leads/${leadId}`);
    console.log('Retrieved:', getResponse.data);

    console.log('\n3. Listing all leads...');
    const listResponse = await axios.get(`${API_BASE}/leads`);
    console.log(`Total leads: ${listResponse.data.length}`);

    console.log('\n4. Filtering by status NEW...');
    const filterResponse = await axios.get(`${API_BASE}/leads?status=NEW`);
    console.log(`NEW leads: ${filterResponse.data.length}`);

    console.log('\n5. Updating lead name...');
    const updateResponse = await axios.put(`${API_BASE}/leads/${leadId}`, {
      name: 'Aman Gupta Updated',
      phone: '+91-9876543211'
    });
    console.log('Updated:', updateResponse.data);

    console.log('\n6. Transitioning status: NEW -> CONTACTED...');
    const statusResponse = await axios.patch(`${API_BASE}/leads/${leadId}/status`, {
      status: 'CONTACTED'
    });
    console.log('Status updated:', statusResponse.data);

    console.log('\n7. Attempting invalid transition: CONTACTED -> CONVERTED...');
    try {
      await axios.patch(`${API_BASE}/leads/${leadId}/status`, { status: 'CONVERTED' });
      console.log('ERROR: Should have failed!');
    } catch (error) {
      console.log('Expected error:', error.response.data);
    }

    console.log('\n8. Transitioning: CONTACTED -> QUALIFIED...');
    await axios.patch(`${API_BASE}/leads/${leadId}/status`, { status: 'QUALIFIED' });

    console.log('\n9. Transitioning: QUALIFIED -> CONVERTED...');
    await axios.patch(`${API_BASE}/leads/${leadId}/status`, { status: 'CONVERTED' });

    console.log('\n10. Attempting transition from CONVERTED terminal state...');
    try {
      await axios.patch(`${API_BASE}/leads/${leadId}/status`, { status: 'LOST' });
      console.log('ERROR: Should have failed!');
    } catch (error) {
      console.log('Expected error:', error.response.data);
    }

    console.log('\n11. Creating another lead to test LOST transition...');
    const lead2Response = await axios.post(`${API_BASE}/leads`, {
      name: 'Test User',
      email: 'test@example.com'
    });
    const lead2Id = lead2Response.data.id;

    console.log('\n12. Transitioning NEW -> LOST...');
    const lostResponse = await axios.patch(`${API_BASE}/leads/${lead2Id}/status`, {
      status: 'LOST'
    });
    console.log('Status updated:', lostResponse.data);

    console.log('\n13. Attempting transition from LOST terminal state...');
    try {
      await axios.patch(`${API_BASE}/leads/${lead2Id}/status`, { status: 'CONTACTED' });
      console.log('ERROR: Should have failed!');
    } catch (error) {
      console.log('Expected error:', error.response.data);
    }

    console.log('\n14. Deleting lead...');
    await axios.delete(`${API_BASE}/leads/${lead2Id}`);
    console.log('Lead deleted');

    console.log('\n15. Attempting to get non-existent lead...');
    try {
      await axios.get(`${API_BASE}/leads/nonexistent`);
    } catch (error) {
      console.log('Expected error:', error.response.data);
    }

    console.log('\n16. Testing validation - missing name...');
    try {
      await axios.post(`${API_BASE}/leads`, { email: 'test@example.com' });
    } catch (error) {
      console.log('Expected error:', error.response.data);
    }

    console.log('\n17. Testing validation - invalid email...');
    try {
      await axios.post(`${API_BASE}/leads`, {
        name: 'Test',
        email: 'invalid-email'
      });
    } catch (error) {
      console.log('Expected error:', error.response.data);
    }

    console.log('\n18. Bulk create leads...');
    const bulkCreateResponse = await axios.post(`${API_BASE}/leads/bulk`, [
      { name: 'Lead A', email: 'leadA@example.com', phone: '+91-1111111111', source: 'website' },
      { name: 'Lead B', email: 'leadB@example.com', source: 'referral' },
      { name: 'Lead C', email: 'leadC@example.com' }
    ]);
    console.log('Bulk create response:', {
      total: bulkCreateResponse.data.total,
      successful: bulkCreateResponse.data.successful,
      failed: bulkCreateResponse.data.failed
    });
    console.log('Results:', bulkCreateResponse.data.results.map(r => ({
      index: r.index,
      success: r.success,
      ...(r.error && { error: r.error }),
      ...(r.lead && { id: r.lead.id, name: r.lead.name, status: r.lead.status })
    })));

    console.log('\n19. Bulk create with mixed valid/invalid...');
    const bulkMixedResponse = await axios.post(`${API_BASE}/leads/bulk`, [
      { name: 'Valid Lead', email: 'valid@example.com' },
      { name: '', email: 'no-name@example.com' },
      { name: 'Bad Email', email: 'not-an-email' },
      { name: 'Another Valid', email: 'another@example.com', source: 'campaign' }
    ]);
    console.log('Mixed bulk response:', {
      total: bulkMixedResponse.data.total,
      successful: bulkMixedResponse.data.successful,
      failed: bulkMixedResponse.data.failed
    });
    bulkMixedResponse.data.results.forEach(r => {
      if (r.success) {
        console.log(`  [${r.index}] SUCCESS: ${r.lead.name} (${r.lead.id})`);
      } else {
        console.log(`  [${r.index}] FAILED: ${r.error}`);
      }
    });

    console.log('\n20. Bulk update leads...');
    const leadIds = bulkCreateResponse.data.results
      .filter(r => r.success)
      .map(r => r.lead.id);

    const bulkUpdateResponse = await axios.put(`${API_BASE}/leads/bulk`, [
      { id: leadIds[0], name: 'Lead A Updated', phone: '+91-2222222222' },
      { id: leadIds[1], source: 'social' }
    ]);
    console.log('Bulk update response:', {
      total: bulkUpdateResponse.data.total,
      successful: bulkUpdateResponse.data.successful,
      failed: bulkUpdateResponse.data.failed
    });
    console.log('Updated leads:', bulkUpdateResponse.data.results.map(r => ({
      index: r.index,
      success: r.success,
      ...(r.lead && { name: r.lead.name, phone: r.lead.phone, source: r.lead.source })
    })));

    console.log('\n21. Bulk update with errors...');
    const bulkUpdateErrorResponse = await axios.put(`${API_BASE}/leads/bulk`, [
      { id: 'nonexistent', name: 'Wont Work' },
      { id: leadIds[2], name: '', email: 'test@example.com' },
      { id: leadIds[2], status: 'CONVERTED' }, // should fail - status via PATCH
      { id: leadIds[2], email: 'invalid-email' }
    ]);
    console.log('Bulk update error response:', {
      total: bulkUpdateErrorResponse.data.total,
      successful: bulkUpdateErrorResponse.data.successful,
      failed: bulkUpdateErrorResponse.data.failed
    });
    bulkUpdateErrorResponse.data.results.forEach(r => {
      console.log(`  [${r.index}] ${r.success ? 'SUCCESS' : 'FAILED'}: ${r.error || r.lead.name}`);
    });

    console.log('\n22. Bulk create with invalid body (not array)...');
    try {
      await axios.post(`${API_BASE}/leads/bulk`, { not: 'an array' });
    } catch (error) {
      console.log('Expected error (400):', error.response.data);
    }

    console.log('\n\n=== All tests completed successfully! ===');
  } catch (error) {
    console.error('Test error:', error);
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
    } else if (error.request) {
      console.error('Request was made but no response received');
    } else {
      console.error('Error message:', error.message);
    }
  }
}

runTests();
