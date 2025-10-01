const express = require('express');
const http = require('http');
const socketio = require('socket.io');
const admin = require('firebase-admin'); // Importar Firebase Admin SDK

//Inicializar Firebase
const serviceAccount = require('../firebase-key.json'); 

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore(); // Obtener una referencia a Firestore
const messagesRef = db.collection('chats'); // La colección donde guardaremos los mensajes

const app = express();
const server = http.createServer(app);
const io = socketio(server);

app.use(express.static('public'));

//Cargar mensajes antiguos desde Firestore
async function loadOldMessages() {
    try {
        // Consultar los mensajes ordenados por el timestamp
        const snapshot = await messagesRef.orderBy('timestamp', 'asc').get();
        const messages = [];
        snapshot.forEach(doc => {
           
            messages.push(doc.data().message); 
        });
        return messages;
    } catch (error) {
        console.error("Error al cargar mensajes antiguos: ", error);
        return [];
    }
}

io.on('connection', async (socket) => {
    console.log('Cliente Web conectado:', socket.id);

    //cargar mensajes antiguos y enviarlos al cliente que se conecta
    const oldMessages = await loadOldMessages();
    oldMessages.forEach(msg => {
        socket.emit('chat message', msg); // Solo enviar al cliente que acaba de conectar
    });
    
    //Escuchar nuevos mensajes
    socket.on('chat message', async (fullMessage) => {
        //Guardar el nuevo mensaje en Firestore
        const messageData = {
            message: fullMessage,
            timestamp: admin.firestore.FieldValue.serverTimestamp() // Usar timestamp del servidor
        };

        try {
            await messagesRef.add(messageData);
        } catch (error) {
            console.error("Error al guardar mensaje en Firestore: ", error);
        }

        //Enviar el mensaje los clientes conectados
        io.emit('chat message', fullMessage);
    });

    socket.on('disconnect', () => {
        console.log('Cliente Web desconectado:', socket.id);
    });
});
//Iniciar el servidor
const PORT = 3000;
server.listen(PORT, () => {
    console.log(`Servidor Express/Socket.IO escuchando en http://localhost:${PORT}`);
});