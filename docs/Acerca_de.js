// Descripción del barrio
const descripcion = `
Palermo Sur es un barrio ubicado en la localidad de Rafael Uribe Uribe, 
en el suroriente de Bogotá. Se caracteriza por su entorno residencial, 
su cercanía a importantes vías de acceso y su papel en la vida comunitaria 
de la ciudad. La localidad de Rafael Uribe Uribe, a la que pertenece, 
se reconoce por su diversidad cultural, su tradición barrial y su importancia 
en el desarrollo urbano de la capital.

En Palermo Sur se encuentran espacios comunitarios, comercios locales y 
zonas de encuentro que fortalecen la identidad barrial. Su población 
combina familias tradicionales y nuevos habitantes que han dinamizado 
la vida del sector. El barrio hace parte de un territorio en constante 
crecimiento, en donde se mantienen tradiciones culturales y sociales 
propias de Bogotá.
`;

// Asignar descripción e imagen
document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("texto-barrio").innerText = descripcion;

    // Aquí colocas el nombre del archivo que pondrás en la carpeta FOTOS
    document.getElementById("foto-barrio").src = "INSUMOS/FOTOS/palermo_sur.jpg";
});
