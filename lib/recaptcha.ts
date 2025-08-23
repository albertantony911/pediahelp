export async function verifyRecaptcha(token: string) {
  const res = await fetch('https://www.google.com/recaptcha/api/siteverify',{
    method: 'POST',
    headers:{'Content-Type':'application/x-www-form-urlencoded'},
    body:new URLSearchParams({ secret: process.env.RECAPTCHA_SECRET!, response: token }),
  });
  const data = await res.json();
  return !!data.success;
}