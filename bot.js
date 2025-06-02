// ================================================
//                BOT.JS COMPLETO
// ================================================

// ==== IMPORTACIONES DE MÓDULOS ====
const natural = require('natural');
const qrcode = require('qrcode-terminal');
const { Client, MessageMedia, LocalAuth } = require('whatsapp-web.js');
const stringSimilarity = require('string-similarity');
const fs = require('fs'); // Módulo para trabajar con el sistema de archivos

// ==== CONFIGURACIÓN INICIAL ====

// Lista de usuarios para el mensaje de bienvenida (reemplaza con números reales)
// Formato: 'NUMERO_SIN_CODIGO_PAIS@c.us' o 'CODIGO_PAISNUMERO@c.us'
// Ejemplo para un número de España: '34600123456@c.us'
// Ejemplo para un número de EEUU: '12025550101@c.us'
// Ejemplo para un número de Colombia: '573001234567@c.us'
const usuariosBienvenida = [
     '573226111372@c.us'  // Cambia esto (puedes añadir más o quitar)
];

// Mensaje de bienvenida y ruta de la imagen promocional
// En bot.js
const nombreEmpresaOServicio = "Asistente USB Cali"; // O "Tu Guía USB Cali"

const mensajeBienvenidaTexto = `¡Hola! 👋 Soy ${nombreEmpresaOServicio}, tu compañero virtual en la U. de San Buenaventura Cali.

Estoy aquí para ayudarte con:
🎓 **Programas Académicos**: Info sobre carreras y posgrados. (Escribe "PROGRAMAS")
📝 **Admisiones**: Requisitos, fechas, costos. (Escribe "ADMISIONES")
🏛️ **Campus y Servicios**: Biblioteca, Bienestar, etc. (Escribe "CAMPUS")
📞 **Contacto**: ¿Necesitas hablar con alguien? (Escribe "CONTACTO")

¿Sobre qué te gustaría saber? Solo escribe la palabra clave o tu pregunta. 😊`;
const rutaImagenPromocional = './media/ImagenPromocion.png'; // Asegúrate que esta ruta y archivo existan

// Archivo para registrar consultas no reconocidas
const archivoConsultasNoReconocidas = 'consultas_no_reconocidas.log';

// Umbral de similitud para considerar una respuesta válida (0.0 a 1.0)
const UMBRAL_SIMILITUD = 0.6; // Ajusta según tus pruebas (0.5 - 0.7 es un buen inicio)

// ==== CARGA Y PROCESAMIENTO DEL CORPUS ====
let corpus = [];
let corpusProcesado = [];
const tokenizer = new natural.WordTokenizer();
// Considera usar PorterStemmerEs si tu corpus está mayormente en español.
// const stemmer = natural.PorterStemmerEs;
const stemmer = natural.PorterStemmer; // Stemmer en inglés por defecto, funciona decentemente para algunas palabras en español

try {
  const corpusData = fs.readFileSync('corpus.json', 'utf8');
  corpus = JSON.parse(corpusData);
  console.log('📰 Corpus cargado exitosamente.');

  // Pre-procesar el corpus para una búsqueda más efectiva
  corpusProcesado = corpus.map(item => {
    const tokens = tokenizer.tokenize(item.pregunta.toLowerCase());
    const stems = tokens.map(token => stemmer.stem(token));
    return {
      ...item,
      preguntaProcesada: stems.join(' ') // Guardamos la pregunta procesada (stems unidos)
    };
  });
  console.log('🛠️ Corpus pre-procesado para búsqueda.');

} catch (error) {
  console.error('Error al cargar o procesar el corpus:', error);
  console.error('Asegúrate de que el archivo "corpus.json" exista en la misma carpeta que bot.js y tenga un formato JSON válido.');
  process.exit(1); // Salir si el corpus no se puede cargar
}


// ==== CLIENTE DE WHATSAPP ====
console.log('🔄 Inicializando cliente de WhatsApp...');
const client = new Client({
  authStrategy: new LocalAuth(), // Usa LocalAuth para guardar la sesión y evitar escanear QR cada vez
  puppeteer: {
    headless: true, // true para ejecutar en segundo plano, false para ver el navegador (útil para depurar al inicio)
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-extensions',
      '--disable-gpu', // Puede ayudar en algunos sistemas
      // '--disable-dev-shm-usage' // Puede ser necesario en entornos Linux con poca memoria /dev/shm
    ]
  }
});

// Evento: Se genera el código QR para escanear
client.on('qr', qr => {
  console.log('🏁 Escanea este código QR con tu WhatsApp:');
  qrcode.generate(qr, { small: true });
});

// Evento: Autenticación exitosa
client.on('authenticated', () => {
  console.log('🔑 Autenticado exitosamente.');
});

// Evento: Falla en la autenticación
client.on('auth_failure', msg => {
  console.error('❌ Fallo en la autenticación:', msg);
  console.error('Si usas LocalAuth, intenta borrar la carpeta .wwebjs_auth y reintentar.');
});

// Evento: Cliente listo para operar
client.on('ready', async () => {
  console.log('✅ Cliente de WhatsApp listo y conectado.');
  console.log(`🤖 Bot operando como: ${client.info.pushname} (${client.info.wid.user})`);


  // Enviar mensaje de bienvenida con imagen (solo si hay usuarios definidos)
  if (usuariosBienvenida && usuariosBienvenida.length > 0 && usuariosBienvenida[0] !== 'NUMERO_USUARIO_1@c.us') { // Evitar enviar si no se configuraron
    console.log('🚀 Enviando mensajes de bienvenida...');
    try {
      if (!fs.existsSync(rutaImagenPromocional)) {
          console.warn(`⚠️ Advertencia: No se encontró la imagen promocional en ${rutaImagenPromocional}. Se enviará solo texto.`);
          for (const chatId of usuariosBienvenida) {
            try {
              await client.sendMessage(chatId, mensajeBienvenidaTexto);
              console.log(`🎉 Mensaje de bienvenida (texto) enviado a ${chatId}`);
              await new Promise(resolve => setTimeout(resolve, 2000)); // Pausa
            } catch (err) {
              console.error(`Error enviando bienvenida (texto) a ${chatId}:`, err.message);
            }
          }
      } else {
        const media = MessageMedia.fromFilePath(rutaImagenPromocional);
        for (const chatId of usuariosBienvenida) {
          try {
            await client.sendMessage(chatId, media, { caption: mensajeBienvenidaTexto });
            console.log(`🎉 Mensaje de bienvenida con imagen enviado a ${chatId}`);
            await new Promise(resolve => setTimeout(resolve, 2000)); // Pausa para evitar spam
          } catch (err) {
            console.error(`Error enviando bienvenida con imagen a ${chatId}:`, err.message);
          }
        }
      }
      console.log('🏁 Todos los mensajes de bienvenida programados han sido procesados.');
    } catch (error) {
        console.error('Error general al procesar mensajes de bienvenida:', error);
    }
  } else {
    console.log('ℹ️ No se enviarán mensajes de bienvenida (lista de usuarios no configurada o vacía).');
  }
});

// ==== FUNCIÓN DE BÚSQUEDA DE RESPUESTA ====
function buscarRespuesta(inputUsuario) {
  const inputProcesado = tokenizer.tokenize(inputUsuario.toLowerCase())
                               .map(token => stemmer.stem(token))
                               .join(' ');

  let mejorCoincidencia = {
    puntuacion: 0,
    respuesta: "Lo siento, no entendí tu pregunta. ¿Podrías reformularla? También puedes preguntar sobre nuestros productos o servicios."
  };

  corpusProcesado.forEach(item => {
    const puntuacion = stringSimilarity.compareTwoStrings(inputProcesado, item.preguntaProcesada);
    // console.log(`Comparando "${inputProcesado}" con "${item.preguntaProcesada}" (Original: "${item.pregunta}"): Similitud ${puntuacion.toFixed(3)}`); // Para depuración detallada

    if (puntuacion > mejorCoincidencia.puntuacion && puntuacion >= UMBRAL_SIMILITUD) {
      mejorCoincidencia = { puntuacion, respuesta: item.respuesta };
    }
  });

  // Registrar si se usará la respuesta genérica (porque ninguna coincidencia superó el umbral)
  if (mejorCoincidencia.respuesta === "Lo siento, no entendí tu pregunta. ¿Podrías reformularla? También puedes preguntar sobre nuestros productos o servicios." && mejorCoincidencia.puntuacion < UMBRAL_SIMILITUD) {
    registrarConsultaNoReconocida(inputUsuario);
  }

  return mejorCoincidencia.respuesta;
}

// ==== FUNCIÓN PARA REGISTRAR CONSULTAS NO RECONOCIDAS ====
function registrarConsultaNoReconocida(consulta) {
  const timestamp = new Date().toISOString();
  const logEntry = `${timestamp} - Consulta no reconocida: "${consulta}"\n`;
  fs.appendFile(archivoConsultasNoReconocidas, logEntry, err => {
    if (err) {
      console.error('Error al registrar consulta no reconocida:', err);
    } else {
      // console.log(`Consulta no reconocida registrada: "${consulta}"`); // Opcional: loguear también a consola
    }
  });
}

// ==== MANEJO DE MENSAJES ENTRANTES ====
client.on('message', async message => {
  // Ignorar mensajes propios, de estado, o de grupos si no es una mención directa (opcional)
  if (message.fromMe || message.isStatus) return;
  // if (message.id.remote.endsWith('@g.us') && !message.mentionedIds.includes(client.info.wid._serialized)) return; // Si es grupo y no me mencionan

  const remitente = message.from;
  const cuerpoMensaje = message.body;

  // Filtrar mensajes vacíos o muy cortos que probablemente no sean preguntas
  if (!cuerpoMensaje || cuerpoMensaje.trim().length < 2) {
    // console.log(`Mensaje corto o vacío de ${remitente}, ignorado.`);
    return;
  }

  console.log(`💬 Mensaje recibido de ${remitente}: ${cuerpoMensaje}`);

  const respuesta = buscarRespuesta(cuerpoMensaje);

  try {
    await client.sendMessage(remitente, respuesta);
    console.log(`📢 Respuesta enviada a ${remitente}: ${respuesta}`);
  } catch (error) {
    console.error(`Error al enviar mensaje a ${remitente}:`, error);
  }
});

// Evento: Cliente desconectado
client.on('disconnected', (reason) => {
  console.warn('🔌 Cliente de WhatsApp desconectado:', reason);
  // Aquí podrías intentar reinicializar el cliente si lo deseas,
  // pero cuidado con los bucles de reconexión infinitos.
  // client.initialize(); // Ejemplo, pero usar con precaución
});


// ==== INICIALIZACIÓN DEL CLIENTE Y MANEJO DE ERRORES GLOBALES ====
client.initialize().catch(err => {
  console.error("Error fatal durante la inicialización del cliente:", err);
  process.exit(1); // Salir si la inicialización falla críticamente
});

// Manejo de errores no capturados para evitar que el bot se caiga abruptamente
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // Considera si necesitas acciones específicas aquí, como reiniciar el bot de forma controlada.
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  // Es una buena práctica cerrar el proceso después de un error no capturado,
  // y usar un gestor de procesos como PM2 para reiniciarlo.
  process.exit(1);
});

// Manejo de cierre elegante (Ctrl+C)
process.on('SIGINT', async () => {
  console.log("\n🔌 Recibida señal SIGINT (Ctrl+C). Desconectando cliente de WhatsApp...");
  if (client) {
    try {
      await client.destroy(); // Cierra la sesión de WhatsApp y limpia recursos
      console.log("Cliente de WhatsApp desconectado exitosamente.");
    } catch (e) {
      console.error("Error al destruir el cliente de WhatsApp:", e);
    }
  }
  process.exit(0);
});

console.log('✨ Bot iniciado. Esperando conexión y eventos de WhatsApp...');