export async function sendGupshupWA(msisdnPlus: string, code: string) {
  if (!process.env.GUPSHUP_WA_API_KEY) throw new Error('WA_DISABLED');
  const payload = {
    channel: 'whatsapp',
    source: process.env.GUPSHUP_WA_NUMBER!,
    destination: msisdnPlus.startsWith('+') ? msisdnPlus.slice(1) : msisdnPlus,
    'src.name': process.env.GUPSHUP_WA_APP_NAME!,
    template: { id: 'otp_template', params: [code, '10'] } // replace with your approved template
  };

  const res = await fetch('https://api.gupshup.io/wa/api/v1/msg', {
    method: 'POST',
    headers: { 'Content-Type':'application/json', apikey: process.env.GUPSHUP_WA_API_KEY! },
    body: JSON.stringify(payload),
  });

  if (!res.ok) throw new Error(`GUPSHUP_WA_HTTP_${res.status}`);
  const data = await res.json().catch(()=> ({} as any));
  const ok = data.status === 'submitted' || data.code === '202';
  if (!ok) throw new Error('GUPSHUP_WA_NOT_SENT');
}