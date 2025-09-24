const formData = new FormData();
formData.append('name', 'Test');
formData.append('index', 'a');
formData.append('category', 'animals');

const response = await fetch('http://localhost:3005/api/admin/items', {
  method: 'POST',
  body: formData
});

console.log('Status:', response.status);
const text = await response.text();
console.log('Response:', text);