const addIncident = async (incident) => {
    const response = await fetch('http://localhost:3001/incidents', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(incident)
    });
    const data=await response.json();
    console.log(data);
    return null;
};

export default addIncident;