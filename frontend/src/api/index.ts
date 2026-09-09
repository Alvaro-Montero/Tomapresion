// lightweight API client helpers
export async function sendPhotoToServer(uri: string, serverBase = 'http://10.0.2.2:3000'){
  const form = new FormData();
  form.append('photo', { uri, name: 'photo.jpg', type: 'image/jpeg' } as any);
  const res = await fetch(`${serverBase}/api/scan`, { method: 'POST', body: form });
  return res.json();
}
