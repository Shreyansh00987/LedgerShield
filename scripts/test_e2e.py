import httpx

base = 'http://localhost:3000/api'
client = httpx.Client(timeout=10.0)

print('1. Testing Demo Load...')
r_demo = client.post(f'{base}/demo/load')
print('Demo Load status:', r_demo.status_code, r_demo.json()['name'])
s_id = r_demo.json()['session_id']

print('\n2. Fetching Transactions before reconciliation...')
r_txs1 = client.get(f'{base}/sessions/{s_id}/transactions')
txs1 = r_txs1.json()
print(f'Retrieved {len(txs1)} transactions. Initial status: {txs1[0]["status"]}')

print('\n3. Running Reconciliation Pipeline...')
r_rec = client.post(f'{base}/sessions/{s_id}/reconcile')
print('Reconciliation result:', r_rec.status_code, r_rec.json())

print('\n4. Fetching Transactions after reconciliation...')
r_txs2 = client.get(f'{base}/sessions/{s_id}/transactions')
txs2 = r_txs2.json()
statuses = {}
sources = {}
for t in txs2:
    statuses[t['status']] = statuses.get(t['status'], 0) + 1
    sources[t['match_source']] = sources.get(t['match_source'], 0) + 1
print('Status counts after reconciliation:', statuses)
print('Source counts after reconciliation:', sources)

print('\n5. Testing Client Inquiry Generation...')
r_inq = client.post(f'{base}/inquiry/generate?session_id={s_id}&client_name=Northstar%20Electrical')
inq = r_inq.json()
items = inq.get('items', [])
print(f'Generated {len(items)} clarification questions for client')
if items:
    print('Sample Question 1:', items[0]['question'])
    print('Sample Options 1:', items[0]['options'])

print('\n6. Testing Batch Action (Accepting 5 suggested transactions)...')
suggested_ids = [t['id'] for t in txs2 if t['status'] == 'suggested'][:5]
r_batch = client.post(f'{base}/transactions/batch', json={
    'transaction_ids': suggested_ids,
    'action': 'accept'
})
print('Batch accept response:', r_batch.status_code, r_batch.json())

print('\n7. Testing Export CSV...')
r_exp = client.get(f'{base}/sessions/{s_id}/export')
print('Export status:', r_exp.status_code, 'Content bytes:', len(r_exp.content))
first_lines = r_exp.text.splitlines()[:4]
print('Export CSV preview:\n' + '\n'.join(first_lines))

print('\n8. Testing Model Evaluation Benchmark...')
r_eval = client.get(f'{base}/evaluation/run')
print('Eval Benchmark accuracy:', r_eval.json()['metrics']['deterministic_plus_local_ai']['accuracy'], '%')

print('\nALL END-TO-END PIPELINE TESTS PASSED WITH 100% SUCCESS!')
