export async function sendGupshupSMS(msisdn: string, text: string) {
  const body = new URLSearchParams({
    method: 'SENDMESSAGE',
    msg: text,
    v: '1.1',
    format: 'json',
    userid: process.env.GUPSHUP_USER_ID!,
    password: process.env.GUPSHUP_API_KEY!,
    send_to: msisdn,          // e.g., '91XXXXXXXXXX' (no +)
    msg_type: 'TEXT',
    auth_scheme: 'PLAIN',
    mask: process.env.GUPSHUP_SENDER_ID!,
  });

  const res = await fetch('https://api.gupshup.io/sms/send', {
    method: 'POST',
    headers: { 'Content-Type':'application/x-www-form-urlencoded' },
    body
  });

  if (!res.ok) throw new Error(`GUPSHUP_SMS_HTTP_${res.status}`);
  const data = await res.json().catch(()=> ({} as any));
  const ok = data.response?.code === 'success' || data.response?.status === 'success';
  if (!ok) throw new Error('GUPSHUP_SMS_NOT_SENT');
}