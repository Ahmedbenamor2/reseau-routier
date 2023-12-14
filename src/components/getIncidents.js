const getIncidents=async()=>{
    const response=await fetch('http://localhost:3001/incidents');
    const data=await response.json();
    return data;
}
export default getIncidents;