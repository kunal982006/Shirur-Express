async function check() {
    const res = await fetch('http://localhost:5000/api/admin/providers');
    const data = await res.json();
    const abhiruchi = data.filter((p: any) => p.businessName && p.businessName.toLowerCase().includes('abhiruchi'));
    console.log("Found:", abhiruchi);
}
check();
