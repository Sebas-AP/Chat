const net = require("net");
const readline = require("readline-sync"); //extrae datos de la consola
//inicializar el servidor del cliente
const server = {
  port: 3000,
  host: "localhost",
};
//crear un cliente
const client = new net.createConnection(server);
//conexion del cliente al servidor
client.on("connect", () => {
  //mensaje de bienvenida
  console.log("Cliente conectado al servidor");
  client.write("Hola desde el cliente \n");
  //leer datos de la consola
  while (true) {
    let mensaje = readline.question("Mensaje para el servidor: ");
    client.write(mensaje + "\n");
    if (mensaje.toLowerCase() === "exit") {
      console.log("Cerrando conexion...");
      client.end();
      break;
    }
  }
});
//recibir mensajes del servidor
client.on("data", (data) => {
  console.log("Mensaje del servidor: ", data.toString());
});
//mensaje de error
client.on("error", (err) => {
  console.log("Error: ", err);
});
