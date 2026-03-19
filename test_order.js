async function test() {
  try {
    const loginRes = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'main_branch',
        password: 'shirur2seva'
      })
    });
    const cookie = loginRes.headers.get('set-cookie');
    
    console.log("Login Status:", loginRes.status);
    
    const res = await fetch('http://localhost:5000/api/grocery-orders', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Cookie': cookie || ''
      },
      body: JSON.stringify({
        items: [],
        subtotal: "0",
        platformFee: "0",
        deliveryFee: "0",
        total: "0",
        deliveryAddress: "Test Address",
        paymentMethod: "online",
        providerId: "test",
      }),
    });
    console.log("Order Status:", res.status);
    const text = await res.text();
    console.log(text);
  } catch (e) {
    console.error(e);
  }
}

test();
