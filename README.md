# Chatbot de Atención USB Cali

Este es un proyecto de chatbot para WhatsApp diseñado para proveer información sobre la Universidad de San Buenaventura Cali.

## Características Principales

*   Respuestas automáticas a preguntas frecuentes.
*   Procesamiento de Lenguaje Natural (PLN) para entender las consultas.
*   Envío de mensaje de bienvenida con imagen promocional.
*   Registro de consultas no reconocidas para mejora continua.

## Tecnologías Utilizadas

*   Node.js
*   whatsapp-web.js
*   natural (para PLN)
*   string-similarity
*   qrcode-terminal

## Instalación y Ejecución

1.  **Clonar el repositorio:**
    ```bash
    git clone https://github.com/TU_USUARIO/NOMBRE_DEL_REPOSITORIO.git
    cd NOMBRE_DEL_REPOSITORIO
    ```
2.  **Instalar dependencias:**
    ```bash
    npm install
    ```
3.  **Configuración (Opcional):**
    *   Edita `bot.js` para añadir números a `usuariosBienvenida` si deseas probar el mensaje de bienvenida.
    *   Asegúrate de tener una imagen en `media/promocion.png`.
4.  **Ejecutar el bot:**
    ```bash
    node bot.js
    ```
5.  Escanea el código QR que aparece en la terminal con tu WhatsApp.
## Autor

*   Anthony Guzman Osorio lhcneo123
