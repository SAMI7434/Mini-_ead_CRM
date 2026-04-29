

const { default: app, leads, generateId, formatTimestamp } = require('./dist/app2');
const PORT = process.env.PORT || 3000;


const sampleLeads = [
  { name: 'Acme Corporation', email: 'contact@acme.com', phone: '+1-555-0100', source: 'referral', status: 'QUALIFIED' },
  { name: 'TechStart Inc', email: 'info@techstart.io', phone: '+1-555-0101', source: 'website', status: 'CONTACTED' },
  { name: 'Global Solutions Ltd', email: 'hello@globalsolutions.com', phone: '+1-555-0102', source: 'LinkedIn', status: 'NEW' },
  { name: 'Innovation Labs', email: 'contact@innovationlabs.co', phone: '+1-555-0103', source: 'trade-show', status: 'CONVERTED' },
  { name: 'Beta Corp', email: 'sales@beta.com', phone: '+1-555-0104', source: 'cold-call', status: 'LOST' },
  { name: 'Sunrise Industries', email: 'info@sunrise.com', phone: '+1-555-0105', source: 'website', status: 'NEW' },
  { name: 'Nexus Systems', email: 'contact@nexus.systems', phone: '+1-555-0106', source: 'partner', status: 'CONTACTED' },
  { name: 'Quantum Dynamics', email: 'hello@quantum.dynamics', phone: '+1-555-0107', source: 'website', status: 'QUALIFIED' },
];

console.log('=== Seeding database with sample leads ===\n');

sampleLeads.forEach((leadData, index) => {
  const id = generateId();
  const lead = {
    id,
    ...leadData,
    created_at: formatTimestamp(),
    updated_at: formatTimestamp(),
  };
  leads.set(id, lead);
  console.log(`✅ ${index + 1}. ${lead.name} (${lead.email}) [${lead.status}]`);
});

console.log(`\n✅ Successfully seeded ${sampleLeads.length} leads.`);


if (!process.argv.includes('--seed-only')) {
  app.listen(PORT, () => {
    console.log(`\n✓ Lead management API running on http://localhost:${PORT}`);
    console.log('→ Test: curl http://localhost:' + PORT + '/leads');
  });
}
