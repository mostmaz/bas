const apiKey = "AIzaSyBEirnly84mY7THxpUfgPpXvU0HIjjZpF4";
async function listModels() {
    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
        const data = await response.json();
        console.log(data.models.map(m => m.name).join("\n"));
    } catch (e) {
        console.error(e);
    }
}
listModels();
